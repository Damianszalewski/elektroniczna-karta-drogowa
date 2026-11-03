import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from database import engine, Base
from models import User, Car, RouteTemplate, RoadCard  # noqa
from routers import cars, users, routes, road_cards, auth
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy import inspect, text

Base.metadata.create_all(bind=engine)


def ensure_schema_compatibility():
    """Dodaje kolumny w istniejących bazach bez kasowania dotychczasowych danych."""
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    with engine.begin() as connection:
        user_columns = {column["name"] for column in inspector.get_columns("users")} if "users" in table_names else set()
        if user_columns and "role" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR NOT NULL DEFAULT 'kierowca'"))

        car_columns = {column["name"] for column in inspector.get_columns("cars")} if "cars" in table_names else set()
        if car_columns and "status" not in car_columns:
            connection.execute(text("ALTER TABLE cars ADD COLUMN status VARCHAR NOT NULL DEFAULT 'aktywny'"))

        route_columns = {column["name"] for column in inspector.get_columns("route_templates")} if "route_templates" in table_names else set()
        if "departure_location" not in route_columns:
            connection.execute(text("ALTER TABLE route_templates ADD COLUMN departure_location VARCHAR"))
        if "arrival_location" not in route_columns:
            connection.execute(text("ALTER TABLE route_templates ADD COLUMN arrival_location VARCHAR"))

        trip_columns = {column["name"] for column in inspector.get_columns("road_card_trips")} if "road_card_trips" in table_names else set()
        if trip_columns and "intermediate_points" not in trip_columns:
            connection.execute(text("ALTER TABLE road_card_trips ADD COLUMN intermediate_points VARCHAR"))

        # Sortowanie po dacie utworzenia dla danych już istniejących i nowych.
        for table_name in ("users", "cars", "route_templates", "road_cards"):
            if table_name not in table_names:
                continue
            columns = {column["name"] for column in inspector.get_columns(table_name)}
            if "created_at" in columns:
                continue
            if engine.dialect.name == "postgresql":
                connection.execute(
                    text(
                        f"ALTER TABLE {table_name} "
                        "ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"
                    )
                )
            else:
                # SQLite nie pozwala dodać kolumny z dynamicznym DEFAULT.
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN created_at DATETIME"))


ensure_schema_compatibility()

APP_ENV = os.getenv("APP_ENV", "development").lower()
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:4200,http://127.0.0.1:4200").split(",")
    if origin.strip()
]
allowed_hosts = [host.strip() for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]

app = FastAPI(
    title="Karta Drogowa API",
    version="1.0",
    docs_url=None if APP_ENV == "production" else "/docs",
    redoc_url=None if APP_ENV == "production" else "/redoc",
    openapi_url=None if APP_ENV == "production" else "/openapi.json",
)

if allowed_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

@app.exception_handler(IntegrityError)
async def sqlalchemy_integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=400,
        content={"detail": "Błąd bazy danych: Taki rekord już istnieje lub narusza powiązania kluczy obcych."},
    )
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(cars.router)
app.include_router(users.router)
app.include_router(routes.router)
app.include_router(road_cards.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "API Karty Drogowej jest w pełni gotowe!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response
