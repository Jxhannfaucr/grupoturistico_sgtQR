# app/models/ticket.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    asiento_id = Column(Integer, ForeignKey("asientos.id"), unique=True)
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=True)
    nombre_pasajero = Column(String, nullable=False)
    qr_hash = Column(String, unique=True, nullable=False)
    estado = Column(String, default="valido")
    escaneado_en = Column(DateTime, nullable=True)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    email_pasajero = Column(String, nullable=True)
    
    # Agrega estas relaciones
    token = relationship("Token", back_populates="tickets")
    asiento = relationship("Asiento") 