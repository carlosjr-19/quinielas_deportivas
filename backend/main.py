from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import models
from db.database import engine

# Importamos los routers
from routes import torneos, quinielas, usuarios, pronosticos, partidos

models.Base.metadata.create_all(bind=engine)

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
