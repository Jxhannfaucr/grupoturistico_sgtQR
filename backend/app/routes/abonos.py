# app/routes/abonos.py
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.abono import AbonoPlanCreate, AbonoMovimientoCreate
from app.services.abono_service import (
    crear_plan,
    registrar_pago,
    listar_planes,
    listar_planes_por_viaje,
    cancelar_plan,
    formatear_plan,
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/abonos", tags=["abonos"])


def _user_id(current_user) -> int | None:
    return current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)


@router.get("/")
def get_abonos(
    viaje_id: Optional[int] = Query(None, description="Filtrar por ID de viaje"),
    incluir_pasados: bool = Query(False, description="Mostrar abonos de viajes pasados/cancelados"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista todos los planes de abono, opcionalmente filtrados por viaje."""
    planes = listar_planes(db, viaje_id=viaje_id, incluir_pasados=incluir_pasados)
    return [formatear_plan(p) for p in planes]


@router.post("/", status_code=status.HTTP_201_CREATED)
def post_abono(
    data: AbonoPlanCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Crea un plan de abono para N asientos. No descuenta capacidad ni bloquea asientos del viaje."""
    plan = crear_plan(db, data)
    return {
        "message": "Plan de abono creado exitosamente",
        "plan": formatear_plan(plan),
    }


@router.post("/{plan_id}/pagos", status_code=status.HTTP_201_CREATED)
def post_pago(
    plan_id: int,
    data: AbonoMovimientoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Registra un abono. Si la suma de pagos alcanza el precio total, genera el token automáticamente."""
    plan, token = registrar_pago(db, plan_id, data, user_id=_user_id(current_user))

    respuesta = {
        "message": "Pago registrado exitosamente",
        "plan": formatear_plan(plan),
        "token_codigo": token.codigo if token else None,
    }
    if token:
        respuesta["message"] = "Pago registrado. El plan se completó y se generó el token."
    return respuesta


@router.get("/viaje/{viaje_id}")
def get_abonos_de_viaje(
    viaje_id: int,
    incluir_pasados: bool = Query(False, description="Mostrar abonos de viajes pasados/cancelados"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista los planes de abono de un viaje con el total abonado y el porcentaje completado."""
    planes = listar_planes_por_viaje(db, viaje_id, incluir_pasados=incluir_pasados)
    return [formatear_plan(p) for p in planes]


@router.patch("/{plan_id}/cancelar")
def patch_cancelar_abono(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Cancela un plan de abono. Solo actualiza el estado, no revierte pagos ni toca inventario."""
    plan = cancelar_plan(db, plan_id)
    return {
        "message": "Plan de abono cancelado exitosamente",
        "plan": formatear_plan(plan),
    }
