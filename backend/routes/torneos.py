from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.torneo import Torneo
from models.partido import Partido
from schemas.schemas import Torneo as TorneoSchema, TorneoCreate, Partido as PartidoSchema, PartidoCreate
from typing import List

router = APIRouter()

@router.get("/", response_model=List[TorneoSchema])
def listar_torneos(db: Session = Depends(get_db)):
    """Lista todos los torneos disponibles."""
    return db.query(Torneo).all()

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

