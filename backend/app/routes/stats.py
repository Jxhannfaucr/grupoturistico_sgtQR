# app/routes/stats.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.routes.auth import get_current_user
from app.services.stats_service import obtener_stats_dashboard

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/dashboard")
def get_stats_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """KPIs del mes en curso: ingresos, ocupación de viajes activos, saldo de abonos y próximo viaje."""
    return obtener_stats_dashboard(db)
