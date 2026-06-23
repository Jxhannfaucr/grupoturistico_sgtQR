# app/models/token.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)
    viaje_id = Column(Integer, ForeignKey("viajes.id"), nullable=False)
    codigo = Column(String, unique=True, nullable=False)
    capacidad_total = Column(Integer, nullable=False)
    capacidad_usada = Column(Integer, default=0)
    cliente = Column(String(100), nullable=True)
    creado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    viaje = relationship("Viaje", back_populates="tokens")
    tickets = relationship("Ticket", back_populates="token", cascade="all, delete-orphan")