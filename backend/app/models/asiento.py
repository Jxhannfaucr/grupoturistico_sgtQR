from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from datetime import datetime, timezone
from app.database import Base
import enum

class EstadoAsiento(str, enum.Enum):
    DISPONIBLE = "disponible"
    RESERVADO = "reservado"
    BLOQUEADO = "bloqueado"

class Asiento(Base):
    __tablename__ = "asientos"
    
    id = Column(Integer, primary_key=True, index=True)
    viaje_id = Column(Integer, ForeignKey("viajes.id"))
    numero = Column(String, nullable=False)
    
    estado = Column(
        SQLEnum(
            EstadoAsiento, 
            name="estado_asiento", 
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj]
        ), 
        default=EstadoAsiento.DISPONIBLE
    )
    bloqueado_hasta = Column(DateTime, nullable=True)
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=True)