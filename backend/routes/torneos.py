from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.torneo import Torneo
from models.partido import Partido
from schemas.schemas import Torneo as TorneoSchema, TorneoCreate, Partido as PartidoSchema, PartidoCreate
from typing import List
import requests
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[TorneoSchema])
def listar_torneos(db: Session = Depends(get_db)):
    """Lista todos los torneos disponibles."""
    return db.query(Torneo).all()

@router.post("/sync")
def sincronizar_torneos(db: Session = Depends(get_db)):
    url = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json"
    response = requests.get(url)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error al obtener JSON externo")
        
    data = response.json()
    torneo_nombre = data.get("name", "World Cup 2026")
    
    # Buscar o crear torneo
    torneo = db.query(Torneo).filter(Torneo.nombre == torneo_nombre).first()
    if not torneo:
        # Generar un ID simple
        torneo_id = "WC-2026"
        torneo = Torneo(id=torneo_id, nombre=torneo_nombre)
        db.add(torneo)
        db.commit()
        db.refresh(torneo)
        
    # Procesar partidos
    partidos_json = data.get("matches", [])
    nuevos = 0
    actualizados = 0
    
    for p in partidos_json:
        # Generar un ID único para el partido
        # Ejemplo: WC-2026-Mexico-SouthAfrica
        t1 = p.get("team1", "").replace(" ", "")
        t2 = p.get("team2", "").replace(" ", "")
        p_id = f"{torneo.id}-{t1}-{t2}"
        
        # Fecha
        # date: "2026-06-11", time: "13:00 UTC-6" (ignoraremos la zona horaria compleja por ahora o la procesamos basico)
        fecha_str = f"{p.get('date')} {p.get('time').split(' ')[0]}"
        try:
            fecha_dt = datetime.strptime(fecha_str, "%Y-%m-%d %H:%M")
        except:
            fecha_dt = datetime.utcnow()
            
        ronda = p.get("round", "")
            
        existente = db.query(Partido).filter(Partido.id == p_id).first()
        if existente:
            existente.fecha = fecha_dt
            # Se podría guardar la ronda en algún lado si existiera la columna
            actualizados += 1
        else:
            nuevo_partido = Partido(
                id=p_id,
                torneo_id=torneo.id,
                equipo_local=p.get("team1"),
                equipo_visitante=p.get("team2"),
                fecha=fecha_dt,
                estado="PENDIENTE"
            )
            db.add(nuevo_partido)
            nuevos += 1
            
    db.commit()
    return {"message": "Sincronización completa", "torneo": torneo.nombre, "nuevos": nuevos, "actualizados": actualizados}

@router.post("/", response_model=TorneoSchema)
def crear_torneo_mock(torneo_in: TorneoCreate, db: Session = Depends(get_db)):
    """(Para Pruebas) Permite registrar un torneo manualmente."""
    nuevo = Torneo(id=torneo_in.id, nombre=torneo_in.nombre)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/{torneo_id}/partidos", response_model=List[PartidoSchema])
def listar_partidos(torneo_id: str, db: Session = Depends(get_db)):
    """Obtiene todos los partidos asociados a un torneo."""
    return db.query(Partido).filter(Partido.torneo_id == torneo_id).all()

@router.post("/partidos", response_model=PartidoSchema)
def crear_partido_mock(partido_in: PartidoCreate, db: Session = Depends(get_db)):
    """(Para Pruebas) Permite registrar un partido manualmente."""
    nuevo = Partido(**partido_in.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

