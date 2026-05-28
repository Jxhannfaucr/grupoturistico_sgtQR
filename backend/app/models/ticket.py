import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class EstadoTicket(str, enum.Enum):
    VALIDO = "valido"
    USADO = "usado"
    CANCELADO = "cancelado"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    asiento_id = Column(Integer, ForeignKey("asientos.id"), unique=True, nullable=False)
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=False)
    nombre_pasajero = Column(String, nullable=False)
    email_pasajero = Column(String, nullable=True)
    qr_hash = Column(String, unique=True, nullable=False)
    estado = Column(
        SQLEnum(
            EstadoTicket,
            name="estado_ticket",
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj]
        ),
        default=EstadoTicket.VALIDO
    )
    escaneado_en = Column(DateTime, nullable=True)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # ── Relaciones ──────────────────────────────────────────
    asiento = relationship("Asiento", back_populates="ticket")
    token = relationship("Token", back_populates="tickets")