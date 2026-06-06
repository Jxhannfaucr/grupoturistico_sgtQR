from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models.usuarios import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def get_usuario(db: Session, usuario_id: int):
    return db.query(Usuario).filter(Usuario.id == usuario_id).first()


def get_usuario_by_username(db: Session, username: str):
    return db.query(Usuario).filter(Usuario.username == username).first()


def get_usuarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Usuario).offset(skip).limit(limit).all()


def create_usuario(db: Session, data: UsuarioCreate):
    db_user = Usuario(
        username=data.username,
        password_hash=hash_password(data.password),
        rol=data.rol,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_usuario(db: Session, usuario_id: int, data: UsuarioUpdate):
    db_user = get_usuario(db, usuario_id)
    if not db_user:
        return None

    if data.username is not None:
        db_user.username = data.username
    if data.rol is not None:
        db_user.rol = data.rol
    if data.password is not None:
        db_user.password_hash = hash_password(data.password)

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_usuario(db: Session, usuario_id: int):
    db_user = get_usuario(db, usuario_id)
    if not db_user:
        return None
    db.delete(db_user)
    db.commit()
    return db_user

def create_usuario(db: Session, data: UsuarioCreate):
    db_user = Usuario(
        username=data.username,
        password_hash=hash_password(data.password),
        rol_id=data.rol_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user