# app/schemas/rol.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RolOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    creado_en: datetime

    class Config:
        from_attributes = True