from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from models.partido import Partido
from schemas.schemas import Partido as PartidoSchema
from typing import List
import datetime

router = APIRouter()

@router.get("/proximos", response_model=List[PartidoSchema])
def obtener_proximos_partidos(db: Session = Depends(get_db)):
    """
    Obtiene los próximos 10 partidos que aún no han comenzado,
    ordenados cronológicamente.
    """
    import zoneinfo
    ahora_mexico = datetime.datetime.now(zoneinfo.ZoneInfo("America/Mexico_City")).replace(tzinfo=None)
    
    partidos = db.query(Partido)\
                 .filter(Partido.fecha >= ahora_mexico)\
                 .order_by(Partido.fecha.asc())\
                 .limit(10)\
                 .all()
                 
    return partidos
