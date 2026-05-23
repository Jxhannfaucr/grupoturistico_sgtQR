# app/models/token.py (sin relationship)
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime, timezone
from app.database import Base

class Token(Base):
    __tablename__ = "tokens"
    id = Column(Integer, primary_key=True, index=True)
    viaje_id = Column(Integer, ForeignKey("viajes.id"))
    codigo = Column(String, unique=True, nullable=False)
    capacidad_total = Column(Integer, nullable=False)
    capacidad_usada = Column(Integer, default=0)
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))