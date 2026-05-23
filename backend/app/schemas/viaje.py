# app/schemas/viaje.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, date, time

class BusSimple(BaseModel):
    id: int
    nombre: str
    capacidad_total: int

    class Config:
        from_attributes = True

class ViajeCreate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=200)
    fecha_salida: date
    hora_salida: str = Field(..., pattern=r'^\d{2}:\d{2}$')
    lugar_abordaje: str = Field(..., min_length=5)
    precio: float = Field(..., gt=0)
    bus_id: int = Field(..., gt=0)

class ViajeUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=200)
    fecha_salida: Optional[date] = None
    hora_salida: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    lugar_abordaje: Optional[str] = Field(None, min_length=5)
    precio: Optional[float] = Field(None, gt=0)
    bus_id: Optional[int] = Field(None, gt=0)

class ViajeResponse(BaseModel):
    id: int
    nombre: str
    fecha_salida: datetime
    hora_salida: str
    lugar_abordaje: str
    precio: float
    bus_id: int
    bus: Optional[BusSimple] = None
    creado_por: Optional[int] = None
    creado_en: Optional[datetime] = None
    tokens_count: int = 0
    asientos_count: int = 0

    class Config:
        from_attributes = True

    @field_validator('hora_salida', mode='before')
    @classmethod
    def format_hora(cls, v):
        if isinstance(v, time):
            return v.strftime('%H:%M')
        return v

class ViajeStats(BaseModel):
    total_asientos: int
    asientos_disponibles: int
    asientos_reservados: int
    tickets_validados: int
    tickets_escaneados: int
    porcentaje_ocupacion: float