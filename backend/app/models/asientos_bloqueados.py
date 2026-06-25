from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base

class AsientoBloqueado(Base):
    __tablename__ = "asientos_bloqueados"

    id = Column(Integer, primary_key=True, index=True)
    viaje_id = Column(Integer, ForeignKey("viajes.id"), nullable=False)
    numero_asiento = Column(String, nullable=False)
    session_id = Column(String, nullable=False)
    expira_en = Column(DateTime(timezone=True), nullable=False)