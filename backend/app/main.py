from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.viajes import router as viajes_router
from app.routes.buses import router as buses_router
from app.routes.token import router as token_router
from app.routes.ticket import router as ticket_router
from app.api.routes import usuarios


app = FastAPI(
    title="Grupo Turistico SGT-QR",
    description="API para el Grupo Turistico SGT-QR",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restringir al dominio del frontend en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")

app.include_router(viajes_router, prefix="/api")

app.include_router(buses_router, prefix="/api")

app.include_router(token_router, prefix="/api")

app.include_router(ticket_router, prefix="/api")

api_router.include_router(usuarios.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "Backend SGT-QR operando correctamente"}


@app.get("/health/db")
def health_db():
    """Comprueba conexión a Postgres (sin exponer credenciales)."""
    import os

    from sqlalchemy import text
    from sqlalchemy.exc import OperationalError

    from app.database import engine

    host = os.getenv("DB_HOST", "desde DATABASE_URL")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"database": "ok", "host": host}
    except OperationalError as e:
        return {"database": "error", "host": host, "detail": str(e).split("\n")[0]}
