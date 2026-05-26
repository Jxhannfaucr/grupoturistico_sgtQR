from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.database import get_db
from app.models.bus import Bus
from app.schemas.buses import BusCreate, BusUpdate, BusResponse
from app.routes.auth import get_current_user

router = APIRouter(prefix="/buses", tags=["buses"])

@router.get("/", response_model=List[BusResponse])
def obtener_buses(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lista todos los buses registrados en la base de datos."""
    return db.query(Bus).all()

@router.post("/", response_model=BusResponse, status_code=status.HTTP_201_CREATED)
def crear_bus(
    bus_in: BusCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Registra una nueva unidad inyectando el ID del creador automáticamente."""
    nuevo_bus = Bus(**bus_in.model_dump())
    
    if isinstance(current_user, dict) and "id" in current_user:
        nuevo_bus.creado_por = current_user["id"]
    elif hasattr(current_user, 'id'):
        nuevo_bus.creado_por = current_user.id

    db.add(nuevo_bus)
    db.commit()
    db.refresh(nuevo_bus)
    return nuevo_bus

@router.get("/{bus_id}", response_model=BusResponse)
def obtener_bus_por_id(
    bus_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtiene el detalle de un bus específico."""
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus no encontrado.")
    return bus

@router.put("/{bus_id}", response_model=BusResponse)
def actualizar_bus(
    bus_id: int, 
    bus_in: BusUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Actualiza los campos modificables de una unidad."""
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus no encontrado.")
    
    update_data = bus_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bus, field, value)
        
    db.commit()
    db.refresh(bus)
    return bus

@router.delete("/{bus_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_bus(
    bus_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Elimina físicamente el bus de la base de datos si no tiene dependencias."""
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus no encontrado.")
    
    try:
        db.delete(bus)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restricción de integridad: No se puede eliminar este bus porque tiene viajes asociados en el sistema."
        )
    return None