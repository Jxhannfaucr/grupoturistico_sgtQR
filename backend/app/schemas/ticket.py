from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── Request: el cliente reserva desde la página pública ────

class ReservarAsientoItem(BaseModel):
    """Un asiento individual dentro de una reserva."""
    numero_asiento: str = Field(..., description="Número del asiento a reservar")
    nombre_pasajero: str = Field(..., min_length=2, description="Nombre completo del pasajero")
    email_pasajero: Optional[EmailStr] = Field(None, description="Correo para enviar el ticket")


class ReservarRequest(BaseModel):
    """
    Solicitud de reserva pública.
    Permite reservar 1 o más asientos en una sola petición.
    """
    asientos: List[ReservarAsientoItem] = Field(
        ..., min_length=1, description="Lista de asientos a reservar"
    )


# ─── Request: admin escanea el QR ──────────────────────────

class EscanearRequest(BaseModel):
    qr_hash: str = Field(..., description="Hash QR del ticket a validar")


# ─── Response ───────────────────────────────────────────────

class AsientoInfo(BaseModel):
    id: int
    numero: str

    class Config:
        from_attributes = True


class ViajeInfo(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class TicketResponse(BaseModel):
    id: int
    nombre_pasajero: str
    email_pasajero: Optional[str] = None
    qr_hash: str
    estado: str
    numero_asiento: str
    viaje_nombre: str
    escaneado_en: Optional[datetime] = None
    creado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReservaResultItem(BaseModel):
    """Resultado de un asiento reservado."""
    ticket_id: int
    numero_asiento: str
    nombre_pasajero: str
    qr_hash: str


class ReservarResponse(BaseModel):
    """Respuesta completa de la reserva."""
    message: str
    viaje: str
    tickets: List[ReservaResultItem]


class InfoLotePublico(BaseModel):
    """Info pública del lote para la página de reserva."""
    viaje_nombre: str
    viaje_fecha: Optional[str] = None
    viaje_hora: Optional[str] = None
    lugar_abordaje: Optional[str] = None
    precio: float
    capacidad_disponible: int
    asientos_disponibles: List[str]
    asientos_ocupados: List[str]
    total_asientos: int