# app/schemas/abono.py
from pydantic import BaseModel, Field
from typing import Optional


class AbonoPlanCreate(BaseModel):
    viaje_id: int = Field(..., description="ID del viaje al que pertenece el plan de abono")
    cliente_nombre: str = Field(..., min_length=2, max_length=100)
    telefono: Optional[str] = Field(None, max_length=30)
    cantidad_asientos_proyectados: int = Field(..., gt=0, description="Cantidad de asientos que cubrirá el plan")
    precio_total: float = Field(..., gt=0, description="Precio total a pagar por el plan")


class AbonoMovimientoCreate(BaseModel):
    monto: float = Field(..., gt=0, description="Monto abonado en este pago")
