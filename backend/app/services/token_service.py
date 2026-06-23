# app/services/token_service.py
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.token import Token
from app.models.viaje import Viaje
from app.models.asiento import Asiento
from app.schemas.token import TokenCreate, TokenUpdate


def generar_codigo() -> str:
    """Genera un código único para el lote (8 caracteres hex en mayúscula)."""
    return uuid.uuid4().hex[:8].upper()


def listar_tokens(db: Session, viaje_id: int | None = None) -> list[Token]:
    """Devuelve todos los tokens, opcionalmente filtrados por viaje."""
    query = db.query(Token)
    if viaje_id:
        query = query.filter(Token.viaje_id == viaje_id)
    return query.order_by(Token.creado_en.desc()).all()


def obtener_token(db: Session, token_id: int) -> Token:
    """Obtiene un token por ID o lanza 404."""
    token = db.query(Token).filter(Token.id == token_id).first()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote (token) no encontrado.",
        )
    return token


def obtener_token_por_codigo(db: Session, codigo: str) -> Token:
    """Obtiene un token por su código único o lanza 404."""
    token = db.query(Token).filter(Token.codigo == codigo).first()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código de lote no encontrado.",
        )
    return token


def crear_token(db: Session, data: TokenCreate, user_id: int | None = None) -> Token:
    """
    Crea un nuevo lote para un viaje.
    Valida que:
      - El viaje exista.
      - La capacidad solicitada no exceda los asientos disponibles del viaje.
    """
    viaje = db.query(Viaje).filter(Viaje.id == data.viaje_id).first()
    if not viaje:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El viaje seleccionado no existe.",
        )

    tokens_existentes = (
        db.query(Token)
        .filter(Token.viaje_id == data.viaje_id)
        .all()
    )
    capacidad_comprometida = sum(t.capacidad_total for t in tokens_existentes)
    total_asientos = (
        db.query(Asiento).filter(Asiento.viaje_id == data.viaje_id).count()
    )
    disponible = total_asientos - capacidad_comprometida

    if data.capacidad_total > disponible:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Capacidad excedida. Solo quedan {disponible} asientos sin asignar a lotes.",
        )

    for _ in range(5):
        codigo = generar_codigo()
        existe = db.query(Token).filter(Token.codigo == codigo).first()
        if not existe:
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo generar un código único. Intente de nuevo.",
        )

    token = Token(
        viaje_id=data.viaje_id,
        codigo=codigo,
        capacidad_total=data.capacidad_total,
        capacidad_usada=0,
        cliente=data.cliente,
        creado_por=user_id,
    )

    db.add(token)
    db.commit()
    db.refresh(token)
    return token


def actualizar_token(db: Session, token_id: int, data: TokenUpdate) -> Token:
    """
    Actualiza la capacidad total de un lote.
    No permite reducir por debajo de la capacidad ya usada.
    """
    token = obtener_token(db, token_id)

    if data.capacidad_total is not None:
        if data.capacidad_total < token.capacidad_usada:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede reducir a {data.capacidad_total}. "
                       f"Ya se usaron {token.capacidad_usada} de este lote.",
            )

        otros_tokens = (
            db.query(Token)
            .filter(Token.viaje_id == token.viaje_id, Token.id != token.id)
            .all()
        )
        capacidad_otros = sum(t.capacidad_total for t in otros_tokens)
        total_asientos = (
            db.query(Asiento).filter(Asiento.viaje_id == token.viaje_id).count()
        )
        disponible = total_asientos - capacidad_otros

        if data.capacidad_total > disponible:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Capacidad excedida. Máximo permitido para este lote: {disponible}.",
            )

        token.capacidad_total = data.capacidad_total

    db.commit()
    db.refresh(token)
    return token


def eliminar_token(db: Session, token_id: int) -> None:
    """
    Elimina un lote si no tiene tickets emitidos (capacidad_usada == 0).
    """
    token = obtener_token(db, token_id)

    if token.capacidad_usada > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar. Este lote ya tiene {token.capacidad_usada} ticket(s) emitido(s).",
        )

    try:
        db.delete(token)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo eliminar el lote por restricciones de integridad.",
        )


def formatear_token(token: Token) -> dict:
    """Serializa un Token a dict para la respuesta JSON."""
    return {
        "id": token.id,
        "viaje_id": token.viaje_id,
        "codigo": token.codigo,
        "capacidad_total": token.capacidad_total,
        "capacidad_usada": token.capacidad_usada,
        "capacidad_disponible": token.capacidad_total - token.capacidad_usada,
        "cliente": token.cliente,
        "creado_por": token.creado_por,
        "creado_en": token.creado_en.isoformat() if token.creado_en else None,
        "viaje": {
            "id": token.viaje.id,
            "nombre": token.viaje.nombre,
        } if token.viaje else None,
    }