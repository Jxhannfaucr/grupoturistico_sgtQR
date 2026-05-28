import uuid
import hashlib
from datetime import datetime, timezone
from typing import List

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.ticket import Ticket, EstadoTicket
from app.models.token import Token
from app.models.asiento import Asiento, EstadoAsiento
from app.models.viaje import Viaje
from app.schemas.ticket import (
    ReservarRequest,
    ReservarResponse,
    ReservaResultItem,
    InfoLotePublico,
)


# ═══════════════════════════════════════════════════════════
# PÚBLICO — Info del lote para la página de reserva
# ═══════════════════════════════════════════════════════════

def obtener_info_lote(db: Session, codigo: str) -> InfoLotePublico:
    """
    Devuelve la información pública de un lote:
    datos del viaje, asientos disponibles y ocupados.
    """
    token = db.query(Token).filter(Token.codigo == codigo).first()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código de lote no encontrado.",
        )

    viaje = db.query(Viaje).filter(Viaje.id == token.viaje_id).first()
    if not viaje:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El viaje asociado a este lote no existe.",
        )

    # Todos los asientos del viaje
    asientos = (
        db.query(Asiento)
        .filter(Asiento.viaje_id == viaje.id)
        .order_by(Asiento.numero)
        .all()
    )

    disponibles = [a.numero for a in asientos if a.estado == EstadoAsiento.DISPONIBLE]
    ocupados = [a.numero for a in asientos if a.estado != EstadoAsiento.DISPONIBLE]

    capacidad_disponible = token.capacidad_total - token.capacidad_usada

    return InfoLotePublico(
        viaje_nombre=viaje.nombre,
        viaje_fecha=viaje.fecha_salida.strftime("%Y-%m-%d") if viaje.fecha_salida else None,
        viaje_hora=viaje.hora_salida.strftime("%H:%M") if viaje.hora_salida else None,
        lugar_abordaje=viaje.lugar_abordaje,
        precio=float(viaje.precio) if viaje.precio else 0,
        capacidad_disponible=capacidad_disponible,
        asientos_disponibles=disponibles,
        asientos_ocupados=ocupados,
        total_asientos=len(asientos),
    )


# ═══════════════════════════════════════════════════════════
# PÚBLICO — Reservar asientos
# ═══════════════════════════════════════════════════════════

def generar_qr_hash() -> str:
    """Genera un hash único para el QR del ticket."""
    unique = f"{uuid.uuid4().hex}-{datetime.now(timezone.utc).timestamp()}"
    return hashlib.sha256(unique.encode()).hexdigest()[:16].upper()


def reservar_asientos(
    db: Session, codigo: str, data: ReservarRequest
) -> ReservarResponse:
    """
    Flujo atómico de reserva:
    1. Valida el token (lote) y que tenga capacidad.
    2. Valida que todos los asientos existan y estén disponibles.
    3. Bloquea los asientos (estado → reservado).
    4. Crea los tickets con QR hash único.
    5. Actualiza capacidad_usada del token.
    """
    # ── 1. Validar token ────────────────────────────────────
    token = db.query(Token).filter(Token.codigo == codigo).first()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código de lote no encontrado.",
        )

    cantidad_solicitada = len(data.asientos)
    capacidad_restante = token.capacidad_total - token.capacidad_usada

    if cantidad_solicitada > capacidad_restante:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Este lote solo tiene {capacidad_restante} espacio(s) disponible(s). "
                   f"Usted solicitó {cantidad_solicitada}.",
        )

    viaje = db.query(Viaje).filter(Viaje.id == token.viaje_id).first()
    if not viaje:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El viaje asociado no existe.",
        )

    # ── 2. Validar asientos ─────────────────────────────────
    resultados: List[ReservaResultItem] = []

    for item in data.asientos:
        asiento = (
            db.query(Asiento)
            .filter(
                Asiento.viaje_id == token.viaje_id,
                Asiento.numero == item.numero_asiento,
            )
            .first()
        )

        if not asiento:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El asiento #{item.numero_asiento} no existe en este viaje.",
            )

        if asiento.estado != EstadoAsiento.DISPONIBLE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El asiento #{item.numero_asiento} ya no está disponible.",
            )

    # ── 3 y 4. Bloquear asientos + crear tickets ───────────
    for item in data.asientos:
        asiento = (
            db.query(Asiento)
            .filter(
                Asiento.viaje_id == token.viaje_id,
                Asiento.numero == item.numero_asiento,
            )
            .first()
        )

        # Bloquear asiento
        asiento.estado = EstadoAsiento.RESERVADO
        asiento.token_id = token.id

        # Generar QR hash único
        qr_hash = generar_qr_hash()
        # Verificar unicidad (reintentar si colisiona)
        for _ in range(5):
            existe = db.query(Ticket).filter(Ticket.qr_hash == qr_hash).first()
            if not existe:
                break
            qr_hash = generar_qr_hash()

        # Crear ticket
        ticket = Ticket(
            asiento_id=asiento.id,
            token_id=token.id,
            nombre_pasajero=item.nombre_pasajero,
            email_pasajero=item.email_pasajero,
            qr_hash=qr_hash,
            estado=EstadoTicket.VALIDO,
        )
        db.add(ticket)
        db.flush()

        resultados.append(
            ReservaResultItem(
                ticket_id=ticket.id,
                numero_asiento=item.numero_asiento,
                nombre_pasajero=item.nombre_pasajero,
                qr_hash=qr_hash,
            )
        )

    # ── 5. Actualizar capacidad usada del token ─────────────
    token.capacidad_usada += cantidad_solicitada

    db.commit()

    return ReservarResponse(
        message=f"{cantidad_solicitada} ticket(s) generado(s) exitosamente.",
        viaje=viaje.nombre,
        tickets=resultados,
    )


# ═══════════════════════════════════════════════════════════
# ADMIN — Listar tickets
# ═══════════════════════════════════════════════════════════

def listar_tickets(
    db: Session,
    viaje_id: int | None = None,
    token_id: int | None = None,
    estado: str | None = None,
) -> list[dict]:
    """Lista tickets con filtros opcionales."""
    query = db.query(Ticket)

    if token_id:
        query = query.filter(Ticket.token_id == token_id)

    if viaje_id:
        query = query.join(Asiento).filter(Asiento.viaje_id == viaje_id)

    if estado:
        query = query.filter(Ticket.estado == estado)

    tickets = query.order_by(Ticket.creado_en.desc()).all()
    return [formatear_ticket(t) for t in tickets]


# ═══════════════════════════════════════════════════════════
# ADMIN — Obtener ticket por ID
# ═══════════════════════════════════════════════════════════

def obtener_ticket(db: Session, ticket_id: int) -> dict:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado.",
        )
    return formatear_ticket(ticket)


# ═══════════════════════════════════════════════════════════
# ESCANEO — Validar QR
# ═══════════════════════════════════════════════════════════

def escanear_ticket(db: Session, qr_hash: str) -> dict:
    """
    Valida un ticket por su QR hash:
    - Si es válido → lo marca como usado + timestamp de escaneo.
    - Si ya fue usado → informa que ya se escaneó.
    - Si está cancelado → informa que fue cancelado.
    - Si no existe → error 404.
    """
    ticket = db.query(Ticket).filter(Ticket.qr_hash == qr_hash).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="QR no válido. Este ticket no existe en el sistema.",
        )

    if ticket.estado == EstadoTicket.USADO:
        return {
            "valido": False,
            "motivo": "already_used",
            "message": f"Este ticket ya fue escaneado el {ticket.escaneado_en.strftime('%d/%m/%Y %H:%M') if ticket.escaneado_en else 'N/A'}.",
            "ticket": formatear_ticket(ticket),
        }

    if ticket.estado == EstadoTicket.CANCELADO:
        return {
            "valido": False,
            "motivo": "cancelled",
            "message": "Este ticket fue cancelado y no es válido para abordar.",
            "ticket": formatear_ticket(ticket),
        }

    # ── Ticket válido → marcar como usado ───────────────────
    ticket.estado = EstadoTicket.USADO
    ticket.escaneado_en = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)

    return {
        "valido": True,
        "motivo": "success",
        "message": f"✓ Bienvenido, {ticket.nombre_pasajero}. Asiento #{ticket.asiento.numero}.",
        "ticket": formatear_ticket(ticket),
    }


# ═══════════════════════════════════════════════════════════
# ADMIN — Cancelar ticket
# ═══════════════════════════════════════════════════════════

def cancelar_ticket(db: Session, ticket_id: int) -> dict:
    """
    Cancela un ticket:
    - Libera el asiento (estado → disponible).
    - Devuelve la capacidad al token (capacidad_usada -= 1).
    - Marca el ticket como cancelado.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado.",
        )

    if ticket.estado == EstadoTicket.CANCELADO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este ticket ya está cancelado.",
        )

    if ticket.estado == EstadoTicket.USADO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede cancelar un ticket que ya fue escaneado/usado.",
        )

    # Liberar asiento
    asiento = db.query(Asiento).filter(Asiento.id == ticket.asiento_id).first()
    if asiento:
        asiento.estado = EstadoAsiento.DISPONIBLE
        asiento.token_id = None

    # Devolver capacidad al token
    token = db.query(Token).filter(Token.id == ticket.token_id).first()
    if token and token.capacidad_usada > 0:
        token.capacidad_usada -= 1

    # Cancelar ticket
    ticket.estado = EstadoTicket.CANCELADO

    db.commit()
    db.refresh(ticket)

    return {
        "message": "Ticket cancelado. El asiento fue liberado.",
        "ticket": formatear_ticket(ticket),
    }


# ═══════════════════════════════════════════════════════════
# HELPER
# ═══════════════════════════════════════════════════════════

def formatear_ticket(ticket: Ticket) -> dict:
    return {
        "id": ticket.id,
        "nombre_pasajero": ticket.nombre_pasajero,
        "email_pasajero": ticket.email_pasajero,
        "qr_hash": ticket.qr_hash,
        "estado": ticket.estado.value if hasattr(ticket.estado, "value") else ticket.estado,
        "numero_asiento": ticket.asiento.numero if ticket.asiento else None,
        "viaje_nombre": ticket.asiento.viaje.nombre if ticket.asiento and ticket.asiento.viaje else None,
        "viaje_id": ticket.asiento.viaje_id if ticket.asiento else None,
        "token_codigo": ticket.token.codigo if ticket.token else None,
        "escaneado_en": ticket.escaneado_en.isoformat() if ticket.escaneado_en else None,
        "creado_en": ticket.creado_en.isoformat() if ticket.creado_en else None,
    }