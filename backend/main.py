from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import models
from db.database import engine

# Importamos los routers
from routes import torneos, quinielas, usuarios, pronosticos, partidos, feed

from sqlalchemy import text

models.Base.metadata.create_all(bind=engine)

# Auto-migración para añadir texto_libre y el torneo inicial
try:
    with engine.connect() as conn:
        # 1. Asegurar columna texto_libre
        try:
            conn.execute(text("ALTER TABLE pronosticos ADD COLUMN texto_libre VARCHAR"))
            conn.commit()
        except Exception:
            pass # Ya existe
            
        # 1.5 Asegurar columna activo en usuarios_quiniela
        try:
            conn.execute(text("ALTER TABLE usuarios_quiniela ADD COLUMN activo BOOLEAN DEFAULT TRUE"))
            conn.commit()
        except Exception:
            pass # Ya existe
            
        # 2. Asegurar que existan los torneos
        torneo_existe = conn.execute(text("SELECT id FROM torneos WHERE id = 'WC-2026'")).fetchone()
        if not torneo_existe:
            conn.execute(text("INSERT INTO torneos (id, nombre) VALUES ('WC-2026', 'World Cup 2026')"))
            conn.commit()
            
        torneo_libre_existe = conn.execute(text("SELECT id FROM torneos WHERE id = 'LIBRE'")).fetchone()
        if not torneo_libre_existe:
            conn.execute(text("INSERT INTO torneos (id, nombre) VALUES ('LIBRE', 'Quiniela Libre')"))
            conn.commit()
except Exception as e:
    pass

app = FastAPI(title="Quinielas API")

# Configurar CORS para permitir que React se conecte (útil en dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluimos los routers
app.include_router(torneos.router, prefix="/api/torneos", tags=["Torneos"])
app.include_router(quinielas.router, prefix="/api/quinielas", tags=["Quinielas"])
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["Usuarios"])
app.include_router(pronosticos.router, prefix="/api/pronosticos", tags=["Pronosticos"])
app.include_router(partidos.router, prefix="/api/partidos", tags=["Partidos"])
app.include_router(feed.router, prefix="/api/feed", tags=["Feed"])

# Montar React compilado (dist) si existe
frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        file_path = os.path.join(frontend_dist, catchall)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"message": "Bienvenido a la API de Quinielas (El frontend de React no está compilado en /dist)"}
