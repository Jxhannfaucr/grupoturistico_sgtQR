from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models.viaje import Viaje
from app.models.bus import Bus
from app.models.ticket import Ticket
from app.routes.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    ahora = datetime.now(timezone.utc)

    viajes_activos = db.query(Viaje).filter(
        Viaje.fecha_salida >= ahora,
        Viaje.estado != "cancelado"
    ).count()

    viajes_realizados = db.query(Viaje).filter(
        Viaje.fecha_salida < ahora,
        Viaje.estado != "cancelado"
    ).count()

    total_buses = db.query(Bus).count()

    total_tickets = db.query(Ticket).count()

    vendidos = db.query(Ticket).count()

    proximo_viaje = db.query(Viaje).filter(
        Viaje.fecha_salida >= ahora,
        Viaje.estado != "cancelado"
    ).order_by(Viaje.fecha_salida.asc()).first()

    return {
        "viajes_activos": viajes_activos,
        "viajes_realizados": viajes_realizados,
        "total_buses": total_buses,
        "total_tickets": total_tickets,
        "vendidos": vendidos,
        "proximo_viaje": {
            "id": proximo_viaje.id if proximo_viaje else None,
            "nombre": proximo_viaje.nombre if proximo_viaje else None,
            "fecha_salida": proximo_viaje.fecha_salida.isoformat() if proximo_viaje else None,
            "hora_salida": proximo_viaje.hora_salida.strftime("%H:%M") if proximo_viaje and proximo_viaje.hora_salida else None,
        } if proximo_viaje else None
    }