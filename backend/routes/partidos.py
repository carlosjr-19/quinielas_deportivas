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

from schemas import schemas

@router.put("/{partido_id}/resultado", response_model=PartidoSchema)
def actualizar_resultado_partido(partido_id: str, resultado: schemas.ResultadoPartidoUpdate, db: Session = Depends(get_db)):
    """
    Actualiza el resultado de un partido, lo marca como FINALIZADO y asigna
    automáticamente los puntos a todos los pronósticos asociados,
    utilizando las reglas de puntuación de la quiniela correspondiente.
    """
    partido = db.query(Partido).filter(Partido.id == partido_id).first()
    from fastapi import HTTPException
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
        
    partido.goles_local_real = resultado.goles_local_real
    partido.goles_visitante_real = resultado.goles_visitante_real
    partido.estado = "FINALIZADO"
    
    # Evaluar resultado real
    empate_real = partido.goles_local_real == partido.goles_visitante_real
    gana_local_real = partido.goles_local_real > partido.goles_visitante_real
    gana_visitante_real = partido.goles_local_real < partido.goles_visitante_real
    
    # Procesar pronósticos
    from models.pronostico import Pronostico
    from models.usuario_quiniela import UsuarioQuiniela
    from models.quiniela import Quiniela
    
    pronosticos = db.query(Pronostico).filter(Pronostico.partido_id == partido_id).all()
    
    for pronostico in pronosticos:
        # Obtener reglas de puntuación de la quiniela a la que pertenece este pronóstico
        # El pronóstico tiene usuario_quiniela_id, el cual tiene quiniela_id
        uq = db.query(UsuarioQuiniela).filter(UsuarioQuiniela.id == pronostico.usuario_quiniela_id).first()
        if not uq:
            continue
            
        quiniela = db.query(Quiniela).filter(Quiniela.id == uq.quiniela_id).first()
        if not quiniela:
            continue
            
        puntos_exacto = quiniela.puntos_exacto if quiniela.puntos_exacto is not None else 3
        puntos_ganador = quiniela.puntos_ganador if quiniela.puntos_ganador is not None else 1
        
        pts_obtenidos = 0
        if pronostico.goles_local is not None and pronostico.goles_visitante is not None:
            # Coincidencia exacta
            if pronostico.goles_local == partido.goles_local_real and pronostico.goles_visitante == partido.goles_visitante_real:
                pts_obtenidos = puntos_exacto
            else:
                # Coincidencia de ganador o empate
                empate_pron = pronostico.goles_local == pronostico.goles_visitante
                gana_local_pron = pronostico.goles_local > pronostico.goles_visitante
                gana_visitante_pron = pronostico.goles_local < pronostico.goles_visitante
                
                if (empate_real and empate_pron) or (gana_local_real and gana_local_pron) or (gana_visitante_real and gana_visitante_pron):
                    pts_obtenidos = puntos_ganador
                    
        # Actualizar los puntos
        puntos_actuales = pronostico.puntos_obtenidos if pronostico.puntos_obtenidos is not None else 0
        diferencia_puntos = pts_obtenidos - puntos_actuales
        pronostico.puntos_obtenidos = pts_obtenidos
        uq.puntos_totales += diferencia_puntos
        
    db.commit()
    db.refresh(partido)
    return partido
