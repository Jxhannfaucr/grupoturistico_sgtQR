from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.token import TokenCreate, TokenUpdate
from app.services.token_service import (
    listar_tokens,
    obtener_token,
    obtener_token_por_codigo,
    crear_token,
    actualizar_token,
    eliminar_token,
    formatear_token,
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/tokens", tags=["tokens"])


@router.get("/")
def get_tokens(
    viaje_id: Optional[int] = Query(None, description="Filtrar por ID de viaje"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista todos los lotes, opcionalmente filtrados por viaje."""
    tokens = listar_tokens(db, viaje_id=viaje_id)
    return [formatear_token(t) for t in tokens]


@router.post("/", status_code=status.HTTP_201_CREATED)
def post_token(
    data: TokenCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Crea un nuevo lote para un viaje con código autogenerado."""
    user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
    token = crear_token(db, data, user_id=user_id)
    return {
        "message": "Lote creado exitosamente",
        "token": formatear_token(token),
    }


@router.get("/codigo/{codigo}")
def get_token_by_code(
    codigo: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Busca un lote por su código único (útil para el escáner)."""
    token = obtener_token_por_codigo(db, codigo)
    return formatear_token(token)


@router.get("/{token_id}")
def get_token(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtiene el detalle de un lote por ID."""
    token = obtener_token(db, token_id)
    return formatear_token(token)


@router.put("/{token_id}")
def put_token(
    token_id: int,
    data: TokenUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Actualiza la capacidad de un lote existente."""
    token = actualizar_token(db, token_id, data)
    return {
        "message": "Lote actualizado exitosamente",
        "token": formatear_token(token),
    }


@router.delete("/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_token(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Elimina un lote si no tiene tickets emitidos."""
    eliminar_token(db, token_id)
    return None