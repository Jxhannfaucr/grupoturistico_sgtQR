from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UsuarioBase(BaseModel):
    username: str
    rol: str  # "admin" | "operador" | etc.


class UsuarioCreate(UsuarioBase):
    password: str  # contraseña en texto plano, se hashea en el CRUD


class UsuarioUpdate(BaseModel):
    username: Optional[str] = None
    rol: Optional[str] = None
    password: Optional[str] = None


class UsuarioOut(UsuarioBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True