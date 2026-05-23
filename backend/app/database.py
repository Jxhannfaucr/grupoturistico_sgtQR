# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import DATABASE_URL

if not DATABASE_URL:
    raise RuntimeError(
        "Configura la base de datos en backend/.env con DB_HOST, DB_USER, DB_PASSWORD, etc."
    )

connect_args = {}
if "supabase.co" in DATABASE_URL:
    connect_args["sslmode"] = "require"

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

from app.models.usuarios import Usuario
from app.models.bus import Bus
from app.models.viaje import Viaje
from app.models.token import Token
from app.models.asiento import Asiento
from app.models.ticket import Ticket

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()