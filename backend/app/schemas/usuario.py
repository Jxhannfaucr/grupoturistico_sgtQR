# app/schemas/usuario.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RolOut(BaseModel):
    id: int
    nombre: str
    class Config:
        from_attributes = True


class UsuarioBase(BaseModel):
    username: str
    rol_id: int


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioUpdate(BaseModel):
    username: Optional[str] = None
    rol_id: Optional[int] = None
    password: Optional[str] = None


class UsuarioOut(BaseModel):
    id: int
    username: str
    rol: RolOut
    creado_en: datetime

    class Config:
        from_attributes = True