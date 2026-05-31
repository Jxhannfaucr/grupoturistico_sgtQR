from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

# devolver los viajes asignados cuando se consulta un bus específico.
class ViajeAsignadoSimple(BaseModel):
    id: int
    nombre: str
    fecha_salida: datetime
    hora_salida: str
    precio: float

    class Config:
        from_attributes = True

class BusCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre o identificador interno del bus")
    capacidad_total: int = Field(..., gt=0, description="Cantidad máxima de asientos de pasajeros")
    tipo_plantilla: Literal["2x2_estandar", "3x2_ancho", "2x2_refuerzo"] = Field(
        default="2x2_estandar", 
        description="Distribución física de los asientos"
    )

class BusUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    capacidad_total: Optional[int] = Field(None, gt=0)

class BusResponse(BaseModel):
    id: int
    nombre: str
    capacidad_total: int
    creado_en: Optional[datetime] = None
    
    # Relación inversa opcional: Muestra los viajes que este bus tiene programados
    viajes: Optional[List[ViajeAsignadoSimple]] = []

    class Config:
        from_attributes = True

class BusStats(BaseModel):
    total_viajes_asignados: int
    asientos_promedio_vendidos: float