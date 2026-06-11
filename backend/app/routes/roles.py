# app/routers/roles.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.rol import Rol
from app.schemas.rol import RolOut

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("/", response_model=List[RolOut])
def listar_roles(db: Session = Depends(get_db)):
    return db.query(Rol).order_by(Rol.id).all()