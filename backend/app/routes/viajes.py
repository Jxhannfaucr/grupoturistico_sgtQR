# app/routes/viajes.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.viaje import Viaje
from app.models.bus import Bus
from app.models.asiento import Asiento, EstadoAsiento
from app.models.ticket import Ticket
from app.schemas.viaje import ViajeCreate, ViajeUpdate, ViajeResponse, ViajeStats
from app.routes.auth import get_current_user

router = APIRouter(prefix="/viajes", tags=["viajes"])

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
        tickets = db.query(Ticket).join(Asiento).filter(
            Asiento.viaje_id == viaje_id
        ).count()
        
        if tickets > 0:
            raise HTTPException(
                status_code=400,
                detail="No se puede cambiar el bus porque ya hay tickets emitidos"
            )
        
        bus = db.query(Bus).filter(Bus.id == viaje_data.bus_id).first()
        if not bus:
            raise HTTPException(status_code=404, detail="Bus no encontrado")
        
        db.query(Asiento).filter(Asiento.viaje_id == viaje_id).delete()
        for i in range(1, bus.capacidad_total + 1):
            db.add(Asiento(viaje_id=viaje_id, numero=str(i), estado="disponible"))
        
        viaje.bus_id = viaje_data.bus_id
    
    update_data = viaje_data.model_dump(exclude_unset=True)
    
    if "nombre" in update_data:
        viaje.nombre = update_data["nombre"]
    if "lugar_abordaje" in update_data:
        viaje.lugar_abordaje = update_data["lugar_abordaje"]
    if "precio" in update_data:
        viaje.precio = update_data["precio"]
    
    if "fecha_salida" in update_data or "hora_salida" in update_data:
        fecha = viaje.fecha_salida.date()
        hora = viaje.hora_salida
        
        if "fecha_salida" in update_data:
            fecha = update_data["fecha_salida"]
        if "hora_salida" in update_data:
            hora = datetime.strptime(update_data["hora_salida"], "%H:%M").time()
            viaje.hora_salida = hora
        
        viaje.fecha_salida = datetime.combine(fecha, hora)
    
    db.commit()
    db.refresh(viaje)
    
    return {
        "message": "Viaje actualizado exitosamente",
        "viaje": formatear_viaje(viaje)
    }

@router.delete("/{viaje_id}")
def eliminar_viaje(
    viaje_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    viaje = db.query(Viaje).filter(Viaje.id == viaje_id).first()
    
    if not viaje:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    
    # 1. Verificamos si hay impacto financiero/operativo
    tickets = db.query(Ticket).join(Asiento).filter(
        Asiento.viaje_id == viaje_id
    ).count()
    
    # 2. SOFT DELETE (Cancelación Lógica)
    if tickets > 0:
        # Bloqueamos el borrado físico y cambiamos el estado
        viaje.estado = "cancelado"
        db.commit()
        return {
            "message": f"El viaje tiene {tickets} tickets vendidos. Se ha marcado como CANCELADO en lugar de eliminarse.",
            "accion": "soft_delete",
            "estado_actual": "cancelado"
        }
    
    # 3. HARD DELETE (Borrado Físico - Solo si tickets == 0)
    from app.models.token import Token
    db.query(Token).filter(Token.viaje_id == viaje_id).delete(synchronize_session=False)
    db.query(Asiento).filter(Asiento.viaje_id == viaje_id).delete(synchronize_session=False)
    db.delete(viaje)
    db.commit()
    
    return {
        "message": "Viaje eliminado físicamente exitosamente.",
        "accion": "hard_delete"
    }

@router.get("/publico/{viaje_id}")
def obtener_viaje_publico(
    viaje_id: int, 
    db: Session = Depends(get_db)
):
    """
    ENDPOINT PÚBLICO: Sin validación de usuario (current_user).
    Provee los datos necesarios para la pantalla de selección de asientos del cliente.
    """
    viaje = db.query(Viaje).filter(Viaje.id == viaje_id).first()
    
    if not viaje:
        raise HTTPException(
            status_code=404, 
            detail="El enlace del viaje no es válido o ha expirado."
        )
    
    # 1. Obtener capacidad total del bus asignado
    total_asientos = viaje.bus.capacidad_total if viaje.bus else 0
    
    # 2. Buscar qué asientos ya no están disponibles
    asientos_reservados_query = db.query(Asiento.numero).filter(
        Asiento.viaje_id == viaje_id,
        Asiento.estado == "reservado"
    ).all()
    asientos_ocupados = [str(asiento[0]) for asiento in asientos_reservados_query]
    
    # 3. Extraer el tipo de plantilla (si existe, si no fallback a 2x2 estándar)
    tipo_plantilla = viaje.bus.tipo_plantilla if viaje.bus and hasattr(viaje.bus, 'tipo_plantilla') else "2x2_estandar"
    
    # 4. Retornar el diccionario completo
    return {
        "id": viaje.id,
        "nombre": viaje.nombre,
        "fecha_salida": viaje.fecha_salida.isoformat() if viaje.fecha_salida else None,
        "hora_salida": viaje.hora_salida.strftime("%H:%M") if viaje.hora_salida else None,
        "lugar_abordaje": viaje.lugar_abordaje,
        "precio": float(viaje.precio) if viaje.precio else 0.0,
        "total_asientos": total_asientos,
        "asientos_ocupados": asientos_ocupados,
        "tipo_plantilla": tipo_plantilla
    }
# ============================================
# ESTADÍSTICAS
# ============================================
@router.get("/{viaje_id}/stats")
def stats_viaje(
    viaje_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    viaje = db.query(Viaje).filter(Viaje.id == viaje_id).first()
    if not viaje:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    
    total = db.query(Asiento).filter(Asiento.viaje_id == viaje_id).count()
    disponibles = db.query(Asiento).filter(
        Asiento.viaje_id == viaje_id,
        Asiento.estado == "disponible"
    ).count()
    reservados = db.query(Asiento).filter(
        Asiento.viaje_id == viaje_id,
        Asiento.estado == "reservado"
    ).count()
    validados = db.query(Ticket).join(Asiento).filter(
        Asiento.viaje_id == viaje_id,
        Ticket.estado == "valido"
    ).count()
    escaneados = db.query(Ticket).join(Asiento).filter(
        Asiento.viaje_id == viaje_id,
        Ticket.estado == "usado"
    ).count()
    
    return {
        "total_asientos": total,
        "asientos_disponibles": disponibles,
        "asientos_reservados": reservados,
        "tickets_validados": validados,
        "tickets_escaneados": escaneados,
        "porcentaje_ocupacion": round((reservados / total * 100), 1) if total > 0 else 0
    }

# ============================================
# HELPERS
# ============================================
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