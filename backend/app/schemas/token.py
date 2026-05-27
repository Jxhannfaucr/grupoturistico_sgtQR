from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Request Schemas ────────────────────────────────────────

class TokenCreate(BaseModel):
    viaje_id: int = Field(..., description="ID del viaje al que pertenece el lote")
    capacidad_total: int = Field(..., gt=0, description="Cantidad de tickets que puede generar este lote")


class TokenUpdate(BaseModel):
    capacidad_total: Optional[int] = Field(None, gt=0, description="Nueva capacidad total del lote")


# ─── Response Schemas ───────────────────────────────────────

class ViajeResumen(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    id: int
    viaje_id: int
    codigo: str
    capacidad_total: int
    capacidad_usada: int
    capacidad_disponible: int
    creado_por: Optional[int] = None
    creado_en: Optional[datetime] = None
    viaje: Optional[ViajeResumen] = None

    class Config:
        from_attributes = True