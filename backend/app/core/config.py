import os
from urllib.parse import quote_plus


def _build_database_url() -> str:
    """Construye la URL escapando la contraseña (soporta @, #, etc.)."""
    host = os.getenv("DB_HOST")
    if not host:
        return os.getenv("DATABASE_URL", "")

    port = os.getenv("DB_PORT", "5432")
    user = os.getenv("DB_USER", "postgres")
    # quote_plus convierte @ → %40 para que no se confunda con el @ del host.
    # Ej: "clave@1" se ve como "clave%401" en la URL, pero Postgres recibe "clave@1".
    password = quote_plus(os.getenv("DB_PASSWORD", ""))
    name = os.getenv("DB_NAME", "postgres")
    sslmode = os.getenv("DB_SSLMODE", "require")
    
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


DATABASE_URL = _build_database_url()
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-cambiar-en-produccion")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "600"))
