# app/services/stats_service.py
from datetime import datetime, timezone

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.core.config import ZONA_LOCAL
from app.models.abono import AbonoMovimiento, AbonoPlan, EstadoAbonoPlan
from app.models.asiento import Asiento, EstadoAsiento
from app.models.ticket import EstadoTicket, Ticket
from app.models.token import Token
from app.models.viaje import Viaje


def _ahora_local() -> datetime:
    """Hora local sin zona, comparable con Viaje.fecha_salida (se guarda como hora local)."""
    return datetime.now(ZONA_LOCAL).replace(tzinfo=None)


def _inicio_mes_utc() -> datetime:
    """Inicio del mes local expresado en UTC sin zona, comparable con creado_en/fecha (se guardan en UTC)."""
    inicio_local = datetime.now(ZONA_LOCAL).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return inicio_local.astimezone(timezone.utc).replace(tzinfo=None)


def _ingresos_mes(db: Session, inicio_mes: datetime) -> float:
    """
    Pagos recibidos en el mes: tickets al contado + movimientos de abonos.
    Los tickets emitidos con el token de un abono ya se cobraron vía abonos, así que no cuentan como contado.
    """
    tokens_de_abonos = select(AbonoPlan.token_id).where(AbonoPlan.token_id.is_not(None))

    contado = (
        db.query(func.coalesce(func.sum(Viaje.precio), 0))
        .select_from(Ticket)
        .join(Asiento, Ticket.asiento_id == Asiento.id)
        .join(Viaje, Asiento.viaje_id == Viaje.id)
        .filter(
            Ticket.creado_en >= inicio_mes,
            Ticket.estado != EstadoTicket.CANCELADO,
            Ticket.token_id.not_in(tokens_de_abonos),
        )
        .scalar()
    )

    abonos = (
        db.query(func.coalesce(func.sum(AbonoMovimiento.monto), 0))
        .filter(AbonoMovimiento.fecha >= inicio_mes)
        .scalar()
    )

    return float(contado) + float(abonos)


def _saldo_pendiente_abonos(db: Session) -> float:
    """Deuda restante de todos los planes de abono activos."""
    pagado = (
        select(AbonoMovimiento.plan_id, func.sum(AbonoMovimiento.monto).label("pagado"))
        .group_by(AbonoMovimiento.plan_id)
        .subquery()
    )

    filas = (
        db.query(AbonoPlan.precio_total, func.coalesce(pagado.c.pagado, 0))
        .outerjoin(pagado, pagado.c.plan_id == AbonoPlan.id)
        .filter(AbonoPlan.estado == EstadoAbonoPlan.ACTIVO)
        .all()
    )

    return sum(max(float(precio) - float(abonado), 0.0) for precio, abonado in filas)


def _tickets_mes(db: Session, inicio_mes: datetime) -> int:
    return (
        db.query(func.count(Ticket.id))
        .filter(Ticket.creado_en >= inicio_mes, Ticket.estado != EstadoTicket.CANCELADO)
        .scalar()
    )


def _ocupacion_por_viaje(db: Session, viaje_ids: list[int]) -> dict[int, dict[str, int]]:
    """
    Capacidad, asientos vendidos y asientos abonados por viaje.
    Abonados = asientos de planes activos (no reservan asientos) + cupo sin usar de los tokens
    de planes completados (ya pagados pero aún sin ticket), para que el porcentaje no baje
    cuando un plan se completa.
    """
    if not viaje_ids:
        return {}

    asientos = (
        db.query(
            Asiento.viaje_id,
            func.count(Asiento.id),
            func.sum(case((Asiento.estado == EstadoAsiento.RESERVADO, 1), else_=0)),
        )
        .filter(Asiento.viaje_id.in_(viaje_ids))
        .group_by(Asiento.viaje_id)
        .all()
    )

    planes_activos = dict(
        db.query(AbonoPlan.viaje_id, func.sum(AbonoPlan.cantidad_asientos_proyectados))
        .filter(AbonoPlan.viaje_id.in_(viaje_ids), AbonoPlan.estado == EstadoAbonoPlan.ACTIVO)
        .group_by(AbonoPlan.viaje_id)
        .all()
    )

    cupo_sin_usar = dict(
        db.query(
            AbonoPlan.viaje_id,
            func.sum(Token.capacidad_total - func.coalesce(Token.capacidad_usada, 0)),
        )
        .join(Token, AbonoPlan.token_id == Token.id)
        .filter(AbonoPlan.viaje_id.in_(viaje_ids), AbonoPlan.estado == EstadoAbonoPlan.COMPLETADO)
        .group_by(AbonoPlan.viaje_id)
        .all()
    )

    resultado = {}
    for viaje_id, capacidad, vendidos in asientos:
        abonados = int(planes_activos.get(viaje_id) or 0) + max(int(cupo_sin_usar.get(viaje_id) or 0), 0)
        resultado[viaje_id] = {
            "capacidad": int(capacidad),
            "vendidos": int(vendidos or 0),
            "abonados": abonados,
        }
    return resultado


def obtener_stats_dashboard(db: Session) -> dict:
    inicio_mes = _inicio_mes_utc()

    # Viaje "activo": no cancelado y que aún no ha salido.
    viajes = (
        db.query(Viaje)
        .filter(Viaje.estado == "activo", Viaje.fecha_salida >= _ahora_local())
        .order_by(Viaje.fecha_salida.asc())
        .all()
    )
    ocupacion = _ocupacion_por_viaje(db, [v.id for v in viajes])

    capacidad_total = sum(o["capacidad"] for o in ocupacion.values())
    vendidos = sum(o["vendidos"] for o in ocupacion.values())
    abonados = sum(o["abonados"] for o in ocupacion.values())
    porcentaje = round((vendidos + abonados) / capacidad_total * 100, 1) if capacidad_total else 0.0

    proximo_viaje = None
    if viajes:
        proximo = viajes[0]
        o = ocupacion.get(proximo.id, {"capacidad": 0, "vendidos": 0, "abonados": 0})
        proximo_viaje = {
            "id": proximo.id,
            "nombre": proximo.nombre,
            "fecha_salida": proximo.fecha_salida.isoformat(),
            "asientos_restantes": max(o["capacidad"] - o["vendidos"] - o["abonados"], 0),
        }

    return {
        "ingresos_mes_actual": round(_ingresos_mes(db, inicio_mes), 2),
        "ocupacion_global_porcentaje": porcentaje,
        "asientos_vendidos": vendidos,
        "asientos_abonados": abonados,
        "capacidad_total": capacidad_total,
        "saldo_pendiente_abonos": round(_saldo_pendiente_abonos(db), 2),
        "tickets_mes_actual": _tickets_mes(db, inicio_mes),
        "viajes_activos": len(viajes),
        "proximo_viaje": proximo_viaje,
    }
