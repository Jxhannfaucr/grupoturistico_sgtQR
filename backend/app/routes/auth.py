# app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.core.security import create_access_token, verify_password
from app.core.config import SECRET_KEY, ALGORITHM
from app.database import get_db
from app.models.usuarios import Usuario

router = APIRouter(prefix="/auth", tags=["autenticación"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_user_by_username(db: Session, username: str) -> Usuario | None:
    return db.execute(select(Usuario).where(Usuario.username == username)).scalar_one_or_none()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = get_user_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return {"id": user.id, "username": user.username, "rol": user.rol}


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    try:
        user = get_user_by_username(db, username=form_data.username)
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "No se puede conectar a la base de datos. "
                "En Supabase usa la URI del 'Session pooler' (IPv4) y reinicia Docker."
            ),
        )

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_payload = {
        "sub": user.username,
        "rol": user.rol,
    }

    access_token = create_access_token(data=token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "rol": user.rol,
    }