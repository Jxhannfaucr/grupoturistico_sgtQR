import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.models.viaje import Viaje
from app.models.bus import Bus
from app.models.token import Token
from app.models.asiento import Asiento, EstadoAsiento
from app.models.ticket import Ticket
from app.models.asientos_bloqueados import AsientoBloqueado
from app.schemas.viaje import ViajeCreate, ViajeUpdate
from app.routes.auth import get_current_user

router = APIRouter(prefix="/viajes", tags=["viajes"])

# ─── SCHEMAS LOCALES ────────────────────────────────────────
class BloqueoRequest(BaseModel):
    numero_asiento: str
    session_id: str

class PasajeroReserva(BaseModel):
    numero_asiento: str
    nombre_pasajero: str
    punto_abordaje_pasajero: str
    email_pasajero: Optional[str] = None
    telefono_pasajero: Optional[str] = None

class ReservaRequestFinal(BaseModel):
    token: str
    session_id: str
    asientos: List[PasajeroReserva]

# ─── ENDPOINTS ADMINISTRATIVOS ───────────────────────────────
@router.post("/", status_code=201)
def crear_viaje(
    viaje_data: ViajeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    bus = db.query(Bus).filter(Bus.id == viaje_data.bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="El bus seleccionado no existe")
    
    hora_salida = datetime.strptime(viaje_data.hora_salida, "%H:%M").time()
    fecha_completa = datetime.combine(viaje_data.fecha_salida, hora_salida)
    
    viaje = Viaje(
        nombre=viaje_data.nombre,
        fecha_salida=fecha_completa,
        hora_salida=hora_salida,
        lugar_abordaje=viaje_data.lugar_abordaje,
        precio=viaje_data.precio,
        bus_id=viaje_data.bus_id,
        creado_por=current_user.get("id")
    )
    
    db.add(viaje)
    db.flush()
    
    for i in range(1, bus.capacidad_total + 1):
        asiento = Asiento(
            viaje_id=viaje.id,
            numero=str(i),
            estado=EstadoAsiento.DISPONIBLE 
        )
        db.add(asiento)
    
    db.commit()
    db.refresh(viaje)
    
    return {
        "message": "Viaje creado exitosamente",
        "viaje": {
            "id": viaje.id,
            "nombre": viaje.nombre,
            "fecha_salida": viaje.fecha_salida.isoformat(),
            "hora_salida": viaje.hora_salida.strftime("%H:%M"),
            "lugar_abordaje": viaje.lugar_abordaje,
            "precio": float(viaje.precio),
            "bus_id": viaje.bus_id,
            "asientos_generados": bus.capacidad_total
        }
    }

@router.get("/")
def obtener_viajes(
    fecha: Optional[str] = Query(None),
    bus_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Viaje)
    
    if fecha:
        fecha_filter = datetime.strptime(fecha, "%Y-%m-%d")
        query = query.filter(Viaje.fecha_salida >= fecha_filter)
    
    if bus_id:
        query = query.filter(Viaje.bus_id == bus_id)
    
    if estado == "proximos":
        query = query.filter(Viaje.fecha_salida >= datetime.now(timezone.utc))
    elif estado == "pasados":
        query = query.filter(Viaje.fecha_salida < datetime.now(timezone.utc))
    
    viajes = query.order_by(Viaje.fecha_salida.desc()).all()
    return [formatear_viaje(v) for v in viajes]

@router.get("/{viaje_id}")
def obtener_viaje(
    viaje_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    viaje = db.query(Viaje).filter(Viaje.id == viaje_id).first()
    if not viaje:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    return formatear_viaje(viaje)

@router.put("/{viaje_id}")
def actualizar_viaje(
    viaje_id: int,
    viaje_data: ViajeUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    viaje = db.query(Viaje).filter(Viaje.id == viaje_id).first()
    if not viaje:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    
    if viaje_data.bus_id and viaje_data.bus_id != viaje.bus_id:
        tickets = db.query(Ticket).join(Asiento).filter(Asiento.viaje_id == viaje_id).count()
        if tickets > 0:
            raise HTTPException(status_code=400, detail="No se puede cambiar el bus porque ya hay tickets emitidos")
        
        bus = db.query(Bus).filter(Bus.id == viaje_data.bus_id).first()
        if not bus:
            raise HTTPException(status_code=404, detail="Bus no encontrado")
        
        db.query(Asiento).filter(Asiento.viaje_id == viaje_id).delete()
        for i in range(1, bus.capacidad_total + 1):
            db.add(Asiento(viaje_id=viaje_id, numero=str(i), estado="disponible"))
        
        viaje.bus_id = viaje_data.bus_id
    
    update_data = viaje_data.model_dump(exclude_unset=True)
    if "nombre" in update_data: viaje.nombre = update_data["nombre"]
    if "lugar_abordaje" in update_data: viaje.lugar_abordaje = update_data["lugar_abordaje"]
    if "precio" in update_data: viaje.precio = update_data["precio"]
    
    if "fecha_salida" in update_data or "hora_salida" in update_data:
        fecha = viaje.fecha_salida.date()
        hora = viaje.hora_salida
        if "fecha_salida" in update_data: fecha = update_data["fecha_salida"]
        if "hora_salida" in update_data:
            hora = datetime.strptime(update_data["hora_salida"], "%H:%M").time()
            viaje.hora_salida = hora
        viaje.fecha_salida = datetime.combine(fecha, hora)
    
    db.commit()
    db.refresh(viaje)
    return {"message": "Viaje actualizado exitosamente", "viaje": formatear_viaje(viaje)}

@router.delete("/{viaje_id}")
def eliminar_viaje(
    viaje_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    viaje = db.query(Viaje).filter(Viaje.id == viaje_id).first()
    if not viaje:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    
    tickets = db.query(Ticket).join(Asiento).filter(Asiento.viaje_id == viaje_id).count()
    if tickets > 0:
        viaje.estado = "cancelado"
        db.commit()
        return {
            "message": f"El viaje tiene {tickets} tickets vendidos. Marcado como CANCELADO.",
            "accion": "soft_delete",
            "estado_actual": "cancelado"
        }
    
    from app.models.token import Token
    db.query(Token).filter(Token.viaje_id == viaje_id).delete(synchronize_session=False)
    db.query(Asiento).filter(Asiento.viaje_id == viaje_id).delete(synchronize_session=False)
    db.delete(viaje)
    db.commit()
    return {"message": "Viaje eliminado físicamente exitosamente.", "accion": "hard_delete"}


# ─── ENDPOINTS PÚBLICOS (SISTEMA DE ASIENTOS) ────────────────
@router.get("/publico/{viaje_id}")
def obtener_viaje_publico(
    viaje_id: int, 
    session_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    viaje = db.query(Viaje).filter(Viaje.id == viaje_id).first()
    if not viaje:
        raise HTTPException(status_code=404, detail="El enlace no es válido.")
    
    # 1. Limpieza Pasiva
    db.query(AsientoBloqueado).filter(AsientoBloqueado.expira_en < datetime.now(timezone.utc)).delete()
    db.commit()

    # 2. Vendidos definitivos
    vendidos_query = db.query(Asiento.numero).filter(
        Asiento.viaje_id == viaje_id,
        Asiento.estado == "reservado"
    ).all()
    
    # 3. Bloqueos temporales totales
    bloqueos_query = db.query(AsientoBloqueado).filter(AsientoBloqueado.viaje_id == viaje_id).all()

    ocupados_por_otros = [str(a[0]) for a in vendidos_query]
    mis_asientos = []

    # 4. Segregación de estado
    for bloqueo in bloqueos_query:
        if session_id and bloqueo.session_id == session_id:
            mis_asientos.append(bloqueo.numero_asiento)
        else:
            ocupados_por_otros.append(bloqueo.numero_asiento)
            
    total_asientos = viaje.bus.capacidad_total if viaje.bus else 0
    tipo_plantilla = viaje.bus.tipo_plantilla if viaje.bus and hasattr(viaje.bus, 'tipo_plantilla') else "2x2_estandar"
    
    return {
        "id": viaje.id,
        "nombre": viaje.nombre,
        "fecha_salida": viaje.fecha_salida.isoformat() if viaje.fecha_salida else None,
        "hora_salida": viaje.hora_salida.strftime("%H:%M") if viaje.hora_salida else None,
        "lugar_abordaje": viaje.lugar_abordaje,
        "precio": float(viaje.precio) if viaje.precio else 0.0,
        "total_asientos": total_asientos,
        "asientos_ocupados": list(set(ocupados_por_otros)),
        "mis_asientos": mis_asientos,
        "tipo_plantilla": tipo_plantilla
    }

@router.post("/{viaje_id}/bloquear-asiento")
async def bloquear_asiento(viaje_id: int, req: BloqueoRequest, db: Session = Depends(get_db)):
    db.query(AsientoBloqueado).filter(AsientoBloqueado.expira_en < datetime.now(timezone.utc)).delete()
    
    bloqueo_activo = db.query(AsientoBloqueado).filter(
        AsientoBloqueado.viaje_id == viaje_id,
        AsientoBloqueado.numero_asiento == req.numero_asiento
    ).first()

    if bloqueo_activo:
        if bloqueo_activo.session_id == req.session_id:
            bloqueo_activo.expira_en = datetime.now(timezone.utc) + timedelta(minutes=20)
            db.commit()
            return {"status": "success"}
        raise HTTPException(status_code=409, detail="El asiento acaba de ser tomado por otra persona.")

    nuevo_bloqueo = AsientoBloqueado(
        viaje_id=viaje_id,
        numero_asiento=req.numero_asiento,
        session_id=req.session_id,
        expira_en=datetime.now(timezone.utc) + timedelta(minutes=20)
    )
    db.add(nuevo_bloqueo)
    db.commit()
    return {"status": "success"}

@router.delete("/{viaje_id}/liberar-asiento")
async def liberar_asiento(viaje_id: int, req: BloqueoRequest, db: Session = Depends(get_db)):
    db.query(AsientoBloqueado).filter(
        AsientoBloqueado.viaje_id == viaje_id,
        AsientoBloqueado.numero_asiento == req.numero_asiento,
        AsientoBloqueado.session_id == req.session_id
    ).delete()
    db.commit()
    return {"status": "success"}

# ─── ENDPOINT DE CHECKOUT (RESERVA FINAL) ─────────────────────
@router.post("/{viaje_id}/reservar")
async def confirmar_reserva(viaje_id: int, req: ReservaRequestFinal, db: Session = Depends(get_db)):
    viaje = db.query(Viaje).filter(Viaje.id == viaje_id).first()
    if not viaje:
        raise HTTPException(status_code=404, detail="Viaje no encontrado.")

    token_db = db.query(Token).filter(Token.codigo == req.token, Token.viaje_id == viaje_id).first()
    if not token_db:
        raise HTTPException(status_code=401, detail="Token inválido o no pertenece a este viaje.")

    asientos_pedidos = [p.numero_asiento for p in req.asientos]

    bloqueos = db.query(AsientoBloqueado).filter(
        AsientoBloqueado.viaje_id == viaje_id,
        AsientoBloqueado.numero_asiento.in_(asientos_pedidos),
        AsientoBloqueado.session_id == req.session_id
    ).all()

    if len(bloqueos) != len(asientos_pedidos):
        raise HTTPException(
            status_code=400, 
            detail="Inconsistencia de sesión. Algunos asientos expiraron o fueron tomados. Refresque la página."
        )

    try:
        tickets_generados = []

        for pasajero in req.asientos:
            asiento_db = db.query(Asiento).filter(
                Asiento.viaje_id == viaje_id, 
                Asiento.numero == pasajero.numero_asiento
            ).first()

            if not asiento_db:
                raise ValueError(f"El asiento {pasajero.numero_asiento} no existe.")

            asiento_db.estado = "reservado"
            hash_qr = str(uuid.uuid4())

            nuevo_ticket = Ticket(
                asiento_id=asiento_db.id,
                token_id=token_db.id,
                nombre_pasajero=pasajero.nombre_pasajero,
                email_pasajero=pasajero.email_pasajero,
                qr_hash=hash_qr,
                estado="valido",
                punto_abordaje_pasajero=pasajero.punto_abordaje_pasajero, 
                telefono_pasajero=pasajero.telefono_pasajero
            )
            db.add(nuevo_ticket)
            tickets_generados.append(hash_qr)

        db.query(AsientoBloqueado).filter(
            AsientoBloqueado.viaje_id == viaje_id,
            AsientoBloqueado.session_id == req.session_id
        ).delete()

        db.commit()
        return {
            "status": "success", 
            "message": "Reserva confirmada exitosamente.",
            "hashes": tickets_generados
        }

    except Exception as e:
        db.rollback() 
        raise HTTPException(status_code=500, detail=f"Error interno procesando la reserva: {str(e)}")


# ─── ESTADÍSTICAS Y HELPERS ──────────────────────────────────
@router.get("/{viaje_id}/stats")
def stats_viaje(viaje_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    viaje = db.query(Viaje).filter(Viaje.id == viaje_id).first()
    if not viaje: raise HTTPException(status_code=404, detail="Viaje no encontrado")
    
    total = db.query(Asiento).filter(Asiento.viaje_id == viaje_id).count()
    disponibles = db.query(Asiento).filter(Asiento.viaje_id == viaje_id, Asiento.estado == "disponible").count()
    reservados = db.query(Asiento).filter(Asiento.viaje_id == viaje_id, Asiento.estado == "reservado").count()
    validados = db.query(Ticket).join(Asiento).filter(Asiento.viaje_id == viaje_id, Ticket.estado == "valido").count()
    escaneados = db.query(Ticket).join(Asiento).filter(Asiento.viaje_id == viaje_id, Ticket.estado == "usado").count()
    
    return {
        "total_asientos": total,
        "asientos_disponibles": disponibles,
        "asientos_reservados": reservados,
        "tickets_validados": validados,
        "tickets_escaneados": escaneados,
        "porcentaje_ocupacion": round((reservados / total * 100), 1) if total > 0 else 0
    }

def formatear_viaje(viaje: Viaje) -> dict:
    asientos_vendidos = len([a for a in viaje.asientos if getattr(a, "estado", "") == "reservado"])
    return {
        "id": viaje.id,
        "nombre": viaje.nombre,
        "fecha_salida": viaje.fecha_salida.isoformat() if viaje.fecha_salida else None,
        "hora_salida": viaje.hora_salida.strftime("%H:%M") if viaje.hora_salida else None,
        "lugar_abordaje": viaje.lugar_abordaje,
        "precio": float(viaje.precio) if viaje.precio else 0,
        "bus_id": viaje.bus_id,
        "bus": {
            "id": viaje.bus.id,
            "nombre": viaje.bus.nombre,
            "capacidad_total": viaje.bus.capacidad_total
        } if viaje.bus else None,
        "creado_por": viaje.creado_por,
        "creado_en": viaje.creado_en.isoformat() if viaje.creado_en else None,
        "tokens_count": len(viaje.tokens) if viaje.tokens else 0,
        "asientos_count": len(viaje.asientos) if viaje.asientos else 0,
        "asientos_vendidos_count": asientos_vendidos,
        "estado": getattr(viaje, "estado", "activo")
    }