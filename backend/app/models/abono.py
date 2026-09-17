# app/models/abono.py
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class EstadoAbonoPlan(str, enum.Enum):
    ACTIVO = "activo"
    COMPLETADO = "completado"
    CANCELADO = "cancelado"


class AbonoPlan(Base):
    """
    Plan de pagos por cuotas para N asientos de un viaje.
    Mientras el plan está activo NO se descuenta capacidad ni se bloquean
    asientos: el inventario lo controla el administrador manualmente.
    """
    __tablename__ = "abono_planes"

    id = Column(Integer, primary_key=True, index=True)
    viaje_id = Column(Integer, ForeignKey("viajes.id"), nullable=False)
    cliente_nombre = Column(String(100), nullable=False)
    telefono = Column(String(30), nullable=True)
    cantidad_asientos_proyectados = Column(Integer, nullable=False)
    precio_total = Column(Float, nullable=False)
    estado = Column(
        SQLEnum(
            EstadoAbonoPlan,
            name="estado_abono_plan",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        default=EstadoAbonoPlan.ACTIVO,
        nullable=False,
    )
    # Se completa únicamente cuando el plan llega al 100% de pago.
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=True)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    viaje = relationship("Viaje", back_populates="abonos")
    token = relationship("Token")
    movimientos = relationship(
        "AbonoMovimiento",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="AbonoMovimiento.fecha",
    )


class AbonoMovimiento(Base):
    __tablename__ = "abono_movimientos"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("abono_planes.id"), nullable=False)
    monto = Column(Float, nullable=False)
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    plan = relationship("AbonoPlan", back_populates="movimientos")
