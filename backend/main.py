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

# Auto-migración para añadir columnas
try:
    with engine.connect() as conn:
        # Función auxiliar para ejecutar e ignorar si ya existe
        def try_alter(query):
            try:
                conn.execute(text(query))
                conn.commit()
            except Exception:
                conn.rollback() # Vital en postgres para que la sesión pueda seguir

        # 1. Asegurar columna texto_libre
        try_alter("ALTER TABLE pronosticos ADD COLUMN texto_libre VARCHAR")
            
        # 1.5 Asegurar columna activo en usuarios_quiniela
        try_alter("ALTER TABLE usuarios_quiniela ADD COLUMN activo BOOLEAN DEFAULT TRUE")
            
        # 1.6 Asegurar columnas de puntuación en quinielas
        try_alter("ALTER TABLE quinielas ADD COLUMN puntos_exacto INTEGER DEFAULT 3")
        try_alter("ALTER TABLE quinielas ADD COLUMN puntos_ganador INTEGER DEFAULT 1")
            
        # 1.7 Asegurar columnas de goles reales en partidos
        try_alter("ALTER TABLE partidos ADD COLUMN goles_local_real INTEGER")
        try_alter("ALTER TABLE partidos ADD COLUMN goles_visitante_real INTEGER")
        
        # 1.8 Asegurar columnas para lógicas de eliminatorias
        try_alter("ALTER TABLE partidos ADD COLUMN fase VARCHAR")
        try_alter("ALTER TABLE partidos ADD COLUMN avanza_real VARCHAR")
        try_alter("ALTER TABLE pronosticos ADD COLUMN avanza VARCHAR")
            
        # 2. Asegurar que existan los torneos
        try:
            torneo_existe = conn.execute(text("SELECT id FROM torneos WHERE id = 'WC-2026'")).fetchone()
            if not torneo_existe:
                conn.execute(text("INSERT INTO torneos (id, nombre) VALUES ('WC-2026', 'World Cup 2026')"))
                conn.commit()
        except Exception:
            conn.rollback()
            
        try:
            torneo_libre_existe = conn.execute(text("SELECT id FROM torneos WHERE id = 'LIBRE'")).fetchone()
            if not torneo_libre_existe:
                conn.execute(text("INSERT INTO torneos (id, nombre) VALUES ('LIBRE', 'Quiniela Libre')"))
                conn.commit()
        except Exception:
            conn.rollback()
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
