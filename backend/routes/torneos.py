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
    import os
    import json
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, "db", "world_cup.json")
    
    # Usar directamente el JSON local sin descargar desde GitHub
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e_local:
            raise HTTPException(status_code=500, detail=f"Error al leer JSON local: {str(e_local)}")
    else:
        raise HTTPException(status_code=500, detail=f"No se encontró el JSON local en {json_path}")
        
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
    
    for i, p in enumerate(partidos_json):
        # Generar un ID único por su posición en el torneo (slot), no por los equipos.
        # Esto evitará duplicados cuando cambies los nombres de los equipos en el futuro.
        p_id = f"{torneo.id}-match-{i+1}"
        
        # Fecha
        # La fecha y hora en el JSON ya están en formato de México
        fecha_str = f"{p.get('date')} {p.get('time').split(' ')[0]}"
        try:
            fecha_dt = datetime.strptime(fecha_str, "%Y-%m-%d %H:%M")
        except:
            fecha_dt = datetime.utcnow()
            
        ronda = p.get("round", "")
            
        # Manejo del marcador en caso de existir
        score = p.get("score")
        goles_local = None
        goles_visitante = None
        estado_nuevo = "PENDIENTE"
        if score and "ft" in score:
            goles_local = score["ft"][0]
            goles_visitante = score["ft"][1]
            estado_nuevo = "FINALIZADO"
            
        existente = db.query(Partido).filter(Partido.id == p_id).first()
        if existente:
            existente.fecha = fecha_dt
            existente.equipo_local = p.get("team1")
            existente.equipo_visitante = p.get("team2")
            existente.fase = ronda
            
            # Si en el JSON dice que terminó, pero en la BD no, o si el resultado cambió
            if estado_nuevo == "FINALIZADO" and (existente.estado != "FINALIZADO" or existente.goles_local_real != goles_local or existente.goles_visitante_real != goles_visitante):
                existente.goles_local_real = goles_local
                existente.goles_visitante_real = goles_visitante
                existente.estado = "FINALIZADO"
                
                # Para evitar dependencias circulares, importamos localmente
                from routes.partidos import calcular_puntos_partido
                calcular_puntos_partido(db, existente)
                
            actualizados += 1
        else:
            nuevo_partido = Partido(
                id=p_id,
                torneo_id=torneo.id,
                equipo_local=p.get("team1"),
                equipo_visitante=p.get("team2"),
                fecha=fecha_dt,
                estado=estado_nuevo,
                goles_local_real=goles_local,
                goles_visitante_real=goles_visitante,
                fase=ronda
            )
            db.add(nuevo_partido)
            if estado_nuevo == "FINALIZADO":
                db.commit() # Asegurar que esté guardado para los pronósticos
                from routes.partidos import calcular_puntos_partido
                calcular_puntos_partido(db, nuevo_partido)
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
    partidos = db.query(Partido).filter(Partido.torneo_id == torneo_id).all()
    
    # Auto-sincronizar si es el mundial y no hay partidos cargados
    if not partidos and torneo_id == "WC-2026":
        try:
            sincronizar_torneos(db)
            partidos = db.query(Partido).filter(Partido.torneo_id == torneo_id).all()
        except Exception:
            pass
            
    return partidos

@router.post("/partidos", response_model=PartidoSchema)
def crear_partido_mock(partido_in: PartidoCreate, db: Session = Depends(get_db)):
    """(Para Pruebas) Permite registrar un partido manualmente."""
    nuevo = Partido(**partido_in.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/{torneo_id}/estadisticas")
def obtener_estadisticas(torneo_id: str):
    """Devuelve la tabla de grupos y los últimos resultados procesando el archivo JSON."""
    import json
    import os
    
    # Actualmente solo soportamos el mundial hardcodeado para esta lógica
    if torneo_id != "WC-2026":
        return {"grupos": [], "ultimos_resultados": []}
        
    json_path = os.path.join(os.path.dirname(__file__), "..", "db", "world_cup.json")
    if not os.path.exists(json_path):
        return {"grupos": [], "ultimos_resultados": []}
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    partidos_json = data.get("matches", [])
    
    from utils.world_cup_logic import calcular_posiciones_grupos
    grupos_ordenados = calcular_posiciones_grupos(partidos_json)
    
    # Init ultimos_resultados (sean de grupo o eliminatoria)
    ultimos_resultados = []
    for p in partidos_json:
        t1 = p.get("team1", "")
        t2 = p.get("team2", "")
        score = p.get("score")
        if score and "ft" in score:
            gl = score["ft"][0]
            gv = score["ft"][1]
            # Solo equipos que parezcan reales
            if len(t1) > 2 and "/" not in t1 and len(t2) > 2 and "/" not in t2:
                fecha_str = f"{p.get('date', '')} {p.get('time', '').split(' ')[0]}".strip()
                try:
                    fecha_dt = datetime.strptime(fecha_str, "%Y-%m-%d %H:%M")
                except:
                    try:
                        fecha_dt = datetime.strptime(p.get('date', ''), "%Y-%m-%d")
                    except:
                        fecha_dt = datetime.min
                        
                ultimos_resultados.append({
                    "equipo_local": t1,
                    "equipo_visitante": t2,
                    "goles_local": gl,
                    "goles_visitante": gv,
                    "fecha": p.get("date"),
                    "ronda": p.get("round", ""),
                    "_fecha_dt": fecha_dt
                })
    
    # Ordenar resultados cronológicamente (más recientes primero)
    ultimos_resultados.sort(key=lambda x: x.get("_fecha_dt", datetime.min), reverse=True)
    # Limpiar clave de ordenación
    for r in ultimos_resultados:
        r.pop("_fecha_dt", None)
        
    ultimos_resultados = ultimos_resultados[:4]
    
    # Extraer fases eliminatorias
    eliminatorias = {}
    rondas_eliminatorias = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Match for third place", "Final"]
    
    for r in rondas_eliminatorias:
        eliminatorias[r] = []
        
    for p in partidos_json:
        ronda = p.get("round", "")
        if ronda in rondas_eliminatorias:
            score = p.get("score")
            gl = score["ft"][0] if score and "ft" in score else None
            gv = score["ft"][1] if score and "ft" in score else None
            
            eliminatorias[ronda].append({
                "equipo_local": p.get("team1"),
                "equipo_visitante": p.get("team2"),
                "goles_local": gl,
                "goles_visitante": gv,
                "fecha": p.get("date"),
                "hora": p.get("time")
            })
            
    return {
        "grupos": grupos_ordenados,
        "ultimos_resultados": ultimos_resultados,
        "eliminatorias": eliminatorias
    }

