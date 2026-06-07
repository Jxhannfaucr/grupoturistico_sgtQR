from sqlalchemy import Column, Integer, String, Numeric, DateTime, Time, ForeignKey
from sqlalchemy.orm import relationship 
from datetime import datetime, timezone
from app.database import Base

class Viaje(Base):
    __tablename__ = "viajes"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    fecha_salida = Column(DateTime, nullable=False)
    hora_salida = Column(Time(timezone=True), nullable=False)
    lugar_abordaje = Column(String, nullable=False)
    precio = Column(Numeric, nullable=False)
    bus_id = Column(Integer, ForeignKey("buses.id"))
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    bus = relationship("Bus")
    asientos = relationship("Asiento", back_populates="viaje")
    tokens = relationship("Token", back_populates="viaje")
    estado = Column(String, default="activo")