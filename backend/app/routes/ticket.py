from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.ticket import ReservarRequest, EscanearRequest
from app.services.ticket_service import (
    obtener_info_lote,
    reservar_asientos,
    listar_tickets,
    obtener_ticket,
    escanear_ticket,
    cancelar_ticket,
)
from app.routes.auth import get_current_user

router = APIRouter(tags=["tickets"])


# ═══════════════════════════════════════════════════════════
# ENDPOINTS PÚBLICOS (sin autenticación)
# El cliente accede con el link del lote
# ═══════════════════════════════════════════════════════════

@router.get("/reservar/{codigo}")
def get_info_reserva(
    codigo: str,
    db: Session = Depends(get_db),
):
    """
    Página pública de reserva.
    Devuelve info del viaje + mapa de asientos disponibles/ocupados.
    El cliente usa esto para ver el bus y escoger su asiento.
    """
    return obtener_info_lote(db, codigo)


@router.post("/reservar/{codigo}", status_code=status.HTTP_201_CREATED)
def post_reservar(
    codigo: str,
    data: ReservarRequest,
    db: Session = Depends(get_db),
):
    """
    El cliente confirma su reserva.
    Recibe la lista de asientos con nombre y email de cada pasajero.
    En una transacción atómica: bloquea asientos + genera tickets + actualiza lote.
    """
    return reservar_asientos(db, codigo, data)


# ═══════════════════════════════════════════════════════════
# ENDPOINTS ADMIN (requieren autenticación)
# ═══════════════════════════════════════════════════════════

@router.get("/tickets")
def get_tickets(
    viaje_id: Optional[int] = Query(None, description="Filtrar por viaje"),
    token_id: Optional[int] = Query(None, description="Filtrar por lote"),
    estado: Optional[str] = Query(None, description="Filtrar por estado: valido, usado, cancelado"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista todos los tickets con filtros opcionales."""
    return listar_tickets(db, viaje_id=viaje_id, token_id=token_id, estado=estado)


@router.get("/tickets/{ticket_id}")
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtiene el detalle de un ticket."""
    return obtener_ticket(db, ticket_id)


@router.post("/tickets/escanear")
def post_escanear(
    data: EscanearRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Escaneo de QR el día del viaje.
    Valida el ticket y lo marca como usado si es válido.
    """
    return escanear_ticket(db, data.qr_hash)


@router.patch("/tickets/{ticket_id}/cancelar")
def patch_cancelar(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Cancela un ticket (solo si está válido, no usado).
    Libera el asiento y devuelve capacidad al lote.
    """
    return cancelar_ticket(db, ticket_id)