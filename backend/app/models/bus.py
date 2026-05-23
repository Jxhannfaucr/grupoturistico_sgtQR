# app/models/bus.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone

from app.database import Base

class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    capacidad_total = Column(Integer, nullable=False)
    configuracion_json = Column(JSONB)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))