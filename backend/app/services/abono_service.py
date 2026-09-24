# app/services/abono_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timezone

from app.models.abono import AbonoPlan, AbonoMovimiento, EstadoAbonoPlan
from app.models.viaje import Viaje
from app.models.token import Token
from app.schemas.abono import AbonoPlanCreate, AbonoMovimientoCreate
from app.schemas.token import TokenCreate
from app.services.token_service import crear_token


def obtener_plan(db: Session, plan_id: int) -> AbonoPlan:
    plan = db.query(AbonoPlan).filter(AbonoPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan de abono no encontrado.",
        )
    return plan


def crear_plan(db: Session, data: AbonoPlanCreate) -> AbonoPlan:
    """
    Crea un plan de abono para un viaje.
    Regla estricta: no toca la tabla de asientos ni la capacidad del viaje.
    El inventario se controla manualmente hasta que el plan se complete.
    """
    viaje = db.query(Viaje).filter(Viaje.id == data.viaje_id).first()
    if not viaje:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El viaje seleccionado no existe.",
        )

    plan = AbonoPlan(
        viaje_id=data.viaje_id,
        cliente_nombre=data.cliente_nombre,
        telefono=data.telefono,
        cantidad_asientos_proyectados=data.cantidad_asientos_proyectados,
        precio_total=data.precio_total,
        estado=EstadoAbonoPlan.ACTIVO,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def _total_abonado(plan: AbonoPlan) -> float:
    return sum(m.monto for m in plan.movimientos)


def registrar_pago(
    db: Session,
    plan_id: int,
    data: AbonoMovimientoCreate,
    user_id: int | None = None,
) -> tuple[AbonoPlan, Token | None]:
    """
    Registra un movimiento de pago. Si la suma de abonos alcanza el precio
    total, marca el plan como completado y genera el token de compra por
    la cantidad de asientos proyectados.
    """
    plan = obtener_plan(db, plan_id)

    if plan.estado != EstadoAbonoPlan.ACTIVO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pueden registrar pagos en un plan '{plan.estado.value}'.",
        )

    total_previo = _total_abonado(plan)

    movimiento = AbonoMovimiento(plan_id=plan.id, monto=data.monto)
    db.add(movimiento)

    token_generado = None
    if (total_previo + data.monto) >= plan.precio_total:
        plan.estado = EstadoAbonoPlan.COMPLETADO
        token_generado = crear_token(
            db,
            TokenCreate(
                viaje_id=plan.viaje_id,
                capacidad_total=plan.cantidad_asientos_proyectados,
                cliente=plan.cliente_nombre,
            ),
            user_id=user_id,
        )
        plan.token_id = token_generado.id

    db.commit()
    db.refresh(plan)
    return plan, token_generado


def listar_planes_por_viaje(
    db: Session,
    viaje_id: int,
    incluir_pasados: bool = False,
    incluir_cancelados: bool = False,
) -> list[AbonoPlan]:
    """Lista los planes de abono de un viaje, ocultando por defecto los de
    viajes ya finalizados/cancelados y los planes cancelados."""
    existe_viaje = db.query(Viaje.id).filter(Viaje.id == viaje_id).first()
    if not existe_viaje:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Viaje no encontrado.",
        )

    return listar_planes(
        db,
        viaje_id=viaje_id,
        incluir_pasados=incluir_pasados,
        incluir_cancelados=incluir_cancelados,
    )


def listar_planes(
    db: Session,
    viaje_id: int | None = None,
    incluir_pasados: bool = False,
    incluir_cancelados: bool = False,
) -> list[AbonoPlan]:
    """
    Lista los planes de abono, opcionalmente filtrados por viaje.
    Por defecto oculta los de viajes ya finalizados/cancelados (incluir_pasados)
    y, de forma independiente, los planes en estado 'cancelado' (incluir_cancelados):
    un plan cancelado es un soft-delete que se conserva para auditoría pero no
    debe aparecer en la lista operativa ni contar en KPIs financieros.
    """
    query = db.query(AbonoPlan).join(Viaje)

    if viaje_id:
        query = query.filter(AbonoPlan.viaje_id == viaje_id)

    if not incluir_pasados:
        query = query.filter(
            Viaje.estado != "cancelado",
            Viaje.fecha_salida >= datetime.now(timezone.utc),
        )

    if not incluir_cancelados:
        query = query.filter(AbonoPlan.estado != EstadoAbonoPlan.CANCELADO)

    return query.order_by(AbonoPlan.creado_en.desc()).all()


def cancelar_plan(db: Session, plan_id: int) -> AbonoPlan:
    """Cancela un plan de abono. Solo cambia el estado; no revierte pagos ni
    toca inventario."""
    plan = obtener_plan(db, plan_id)

    if plan.estado == EstadoAbonoPlan.COMPLETADO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede cancelar un plan ya completado.",
        )

    plan.estado = EstadoAbonoPlan.CANCELADO
    db.commit()
    db.refresh(plan)
    return plan


def formatear_plan(plan: AbonoPlan) -> dict:
    """Serializa un AbonoPlan a dict, calculando el progreso de pago."""
    abonado = _total_abonado(plan)
    pendiente = max(plan.precio_total - abonado, 0)
    porcentaje = (
        round((abonado / plan.precio_total) * 100, 1) if plan.precio_total > 0 else 0
    )

    return {
        "id": plan.id,
        "viaje_id": plan.viaje_id,
        "cliente_nombre": plan.cliente_nombre,
        "telefono": plan.telefono,
        "cantidad_asientos_proyectados": plan.cantidad_asientos_proyectados,
        "precio_total": plan.precio_total,
        "estado": plan.estado.value if hasattr(plan.estado, "value") else plan.estado,
        "total_abonado": round(abonado, 2),
        "saldo_pendiente": round(pendiente, 2),
        "porcentaje_completado": min(porcentaje, 100.0),
        "token_id": plan.token_id,
        "token_codigo": plan.token.codigo if plan.token else None,
        "creado_en": plan.creado_en.isoformat() if plan.creado_en else None,
        "viaje": {
            "id": plan.viaje.id,
            "nombre": plan.viaje.nombre,
        } if plan.viaje else None,
        "movimientos": [
            {
                "id": m.id,
                "monto": m.monto,
                "fecha": m.fecha.isoformat() if m.fecha else None,
            }
            for m in plan.movimientos
        ],
    }
