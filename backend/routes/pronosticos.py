from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.pronostico import Pronostico
from models.partido import Partido
from models.usuario_quiniela import UsuarioQuiniela
from models.usuario import Usuario
from models.quiniela import Quiniela
from models.feed import FeedItem
from schemas.schemas import Pronostico as PronosticoSchema, PronosticoCreate, PronosticoPuntosUpdate
from typing import List
import datetime

router = APIRouter()

@router.post("/", response_model=PronosticoSchema)
def registrar_pronostico(pronostico_in: PronosticoCreate, db: Session = Depends(get_db)):
    import zoneinfo
    ahora_utc = datetime.datetime.utcnow()
    ahora_mexico = datetime.datetime.now(zoneinfo.ZoneInfo("America/Mexico_City")).replace(tzinfo=None)
    
    if pronostico_in.partido_id:
        # 1. Obtener el partido para validar su fecha de inicio
        partido = db.query(Partido).filter(Partido.id == pronostico_in.partido_id).first()
        if not partido:
            raise HTTPException(status_code=404, detail="Partido no encontrado")
            
        # 2. Validar regla de los 3 minutos de bloqueo
        limite_tiempo = partido.fecha - datetime.timedelta(minutes=3)
        
        if ahora_utc > limite_tiempo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="El partido comienza en menos de 3 minutos o ya comenzó. No se permiten modificaciones."
            )
            
        # 3. Guardar o actualizar pronóstico (upsert)
        pronostico_existente = db.query(Pronostico).filter(
            Pronostico.usuario_quiniela_id == pronostico_in.usuario_quiniela_id,
            Pronostico.partido_id == pronostico_in.partido_id
        ).first()
        
        if pronostico_existente:
            # Si ya había predicho, simplemente actualizamos sus goles
            pronostico_existente.goles_local = pronostico_in.goles_local
            pronostico_existente.goles_visitante = pronostico_in.goles_visitante
            pronostico_existente.insertado_a = ahora_utc
            db.commit()
            db.refresh(pronostico_existente)
            
            uq = db.query(UsuarioQuiniela).filter(UsuarioQuiniela.id == pronostico_in.usuario_quiniela_id).first()
            if uq:
                u = db.query(Usuario).filter(Usuario.id == uq.usuario_id).first()
                nombre_usr = u.nombre if u else "Alguien"
                nombre_partido = f"{partido.equipo_local} vs {partido.equipo_visitante}" if partido else "un partido"
                evento = FeedItem(
                    quiniela_id=uq.quiniela_id,
                    usuario_quiniela_id=uq.id,
                    tipo="EVENTO",
                    contenido=f"{nombre_usr} ha modificado su pronóstico de {nombre_partido}"
                )
                db.add(evento)
                db.commit()
                
            return pronostico_existente
        else:
            # Si es la primera vez que predice este partido
            nuevo_pronostico = Pronostico(
                usuario_quiniela_id=pronostico_in.usuario_quiniela_id,
                partido_id=pronostico_in.partido_id,
                goles_local=pronostico_in.goles_local,
                goles_visitante=pronostico_in.goles_visitante,
                insertado_a=ahora_utc
            )
            db.add(nuevo_pronostico)
            db.commit()
            db.refresh(nuevo_pronostico)
            
            uq = db.query(UsuarioQuiniela).filter(UsuarioQuiniela.id == pronostico_in.usuario_quiniela_id).first()
            if uq:
                evento = FeedItem(
                    quiniela_id=uq.quiniela_id,
                    usuario_quiniela_id=uq.id,
                    tipo="PRONOSTICO",
                    pronostico_id=nuevo_pronostico.id
                )
                db.add(evento)
                db.commit()
                
            return nuevo_pronostico
    else:
        # Es un pronóstico libre
        if not pronostico_in.texto_libre:
            raise HTTPException(status_code=400, detail="Debe proveer partido_id o texto_libre")
            
        nuevo_pronostico = Pronostico(
            usuario_quiniela_id=pronostico_in.usuario_quiniela_id,
            texto_libre=pronostico_in.texto_libre,
            insertado_a=ahora_utc
        )
        db.add(nuevo_pronostico)
        db.commit()
        db.refresh(nuevo_pronostico)
        
        uq = db.query(UsuarioQuiniela).filter(UsuarioQuiniela.id == pronostico_in.usuario_quiniela_id).first()
        if uq:
            evento = FeedItem(
                quiniela_id=uq.quiniela_id,
                usuario_quiniela_id=uq.id,
                tipo="PRONOSTICO",
                pronostico_id=nuevo_pronostico.id
            )
            db.add(evento)
            db.commit()
            
        return nuevo_pronostico

@router.get("/usuario/{usuario_id}")
def listar_pronosticos_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """Obtener todos los pronósticos que ha hecho un usuario específico, junto con info del partido o texto libre."""
    pronosticos = db.query(Pronostico, Partido)\
        .outerjoin(Partido, Pronostico.partido_id == Partido.id)\
        .filter(Pronostico.usuario_quiniela_id == usuario_id)\
        .all()
    
    # Sort after fetching because outerjoin could have null dates
    pronosticos.sort(key=lambda x: x[1].fecha if x[1] else x[0].insertado_a)
    
    resultados = []
    for pronostico, partido in pronosticos:
        if partido:
            resultados.append({
                "id": pronostico.id,
                "partido_id": partido.id,
                "equipo_local": partido.equipo_local,
                "equipo_visitante": partido.equipo_visitante,
                "goles_local": pronostico.goles_local,
                "goles_visitante": pronostico.goles_visitante,
                "goles_local_real": partido.goles_local_real,
                "goles_visitante_real": partido.goles_visitante_real,
                "estado_partido": partido.estado,
                "puntos_obtenidos": pronostico.puntos_obtenidos,
                "fecha_partido": partido.fecha.isoformat(),
                "insertado_a": pronostico.insertado_a.isoformat() + "Z",
                "texto_libre": pronostico.texto_libre
            })
        else:
            resultados.append({
                "id": pronostico.id,
                "partido_id": None,
                "equipo_local": None,
                "equipo_visitante": None,
                "goles_local": None,
                "goles_visitante": None,
                "puntos_obtenidos": pronostico.puntos_obtenidos,
                "fecha_partido": pronostico.insertado_a.isoformat() + "Z",
                "insertado_a": pronostico.insertado_a.isoformat() + "Z",
                "texto_libre": pronostico.texto_libre
            })
    return resultados

from models.usuario_quiniela import UsuarioQuiniela
from models.usuario import Usuario
from models.quiniela import Quiniela

@router.get("/quiniela/{codigo_acceso}")
def feed_pronosticos_quiniela(codigo_acceso: str, db: Session = Depends(get_db)):
    # Obtener quiniela
    quiniela = db.query(Quiniela).filter(Quiniela.codigo_acceso == codigo_acceso.upper()).first()
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
        
    resultados = []
    pronosticos_db = db.query(Pronostico, Usuario.nombre, Partido)\
        .join(UsuarioQuiniela, Pronostico.usuario_quiniela_id == UsuarioQuiniela.id)\
        .join(Usuario, UsuarioQuiniela.usuario_id == Usuario.id)\
        .outerjoin(Partido, Pronostico.partido_id == Partido.id)\
        .filter(UsuarioQuiniela.quiniela_id == quiniela.id)\
        .order_by(Pronostico.insertado_a.desc())\
        .limit(50).all()
        
    for p, u_nombre, partido in pronosticos_db:
        if partido:
            resultados.append({
                "id": p.id,
                "usuario": u_nombre,
                "partido": f"{partido.equipo_local} vs {partido.equipo_visitante}",
                "pronostico": f"{p.goles_local} - {p.goles_visitante}",
                "fecha": p.insertado_a.isoformat() + "Z",
                "puntos_obtenidos": p.puntos_obtenidos
            })
        else:
            resultados.append({
                "id": p.id,
                "usuario": u_nombre,
                "partido": "Predicción Libre",
                "pronostico": p.texto_libre,
                "fecha": p.insertado_a.isoformat() + "Z",
                "puntos_obtenidos": p.puntos_obtenidos
            })
            
    return resultados

from sqlalchemy import func

@router.put("/{pronostico_id}/puntos")
def actualizar_puntos(pronostico_id: int, puntos_update: PronosticoPuntosUpdate, db: Session = Depends(get_db)):
    pronostico = db.query(Pronostico).filter(Pronostico.id == pronostico_id).first()
    if not pronostico:
        raise HTTPException(status_code=404, detail="Pronóstico no encontrado")
        
    if puntos_update.puntos < 0 or puntos_update.puntos > 5:
        raise HTTPException(status_code=400, detail="Los puntos deben estar entre 0 y 5")
        
    pronostico.puntos_obtenidos = puntos_update.puntos
    pronostico.puntos_obtenidos = puntos_update.puntos
    db.commit()
    
    uq = db.query(UsuarioQuiniela).filter(UsuarioQuiniela.id == pronostico.usuario_quiniela_id).first()
    if uq:
        u = db.query(Usuario).filter(Usuario.id == uq.usuario_id).first()
        nombre_usr = u.nombre if u else "Alguien"
        partido_nombre = "una predicción libre"
        if pronostico.partido_id:
            part = db.query(Partido).filter(Partido.id == pronostico.partido_id).first()
            if part:
                partido_nombre = f"{part.equipo_local} vs {part.equipo_visitante}"
                
        evento = FeedItem(
            quiniela_id=uq.quiniela_id,
            usuario_quiniela_id=uq.id,
            tipo="EVENTO",
            contenido=f"{nombre_usr} ha recibido {puntos_update.puntos} puntos por el pronóstico de {partido_nombre}"
        )
        db.add(evento)
        db.commit()

    # Recalcular total del usuario
    total_puntos = db.query(func.sum(Pronostico.puntos_obtenidos))\
        .filter(Pronostico.usuario_quiniela_id == pronostico.usuario_quiniela_id)\
        .scalar() or 0
        
    usuario_quiniela = db.query(UsuarioQuiniela).filter(UsuarioQuiniela.id == pronostico.usuario_quiniela_id).first()
    if usuario_quiniela:
        usuario_quiniela.puntos_totales = total_puntos
        db.commit()
        
    return {"message": "Puntos actualizados correctamente", "puntos_totales": total_puntos}

@router.delete("/{pronostico_id}")
def eliminar_pronostico(pronostico_id: int, db: Session = Depends(get_db)):
    pronostico = db.query(Pronostico).filter(Pronostico.id == pronostico_id).first()
    if not pronostico:
        raise HTTPException(status_code=404, detail="Pronóstico no encontrado")
        
    usuario_quiniela_id = pronostico.usuario_quiniela_id
    
    uq = db.query(UsuarioQuiniela).filter(UsuarioQuiniela.id == pronostico.usuario_quiniela_id).first()
    if uq:
        u = db.query(Usuario).filter(Usuario.id == uq.usuario_id).first()
        nombre_usr = u.nombre if u else "Alguien"
        partido_nombre = "una predicción libre"
        if pronostico.partido_id:
            part = db.query(Partido).filter(Partido.id == pronostico.partido_id).first()
            if part:
                partido_nombre = f"{part.equipo_local} vs {part.equipo_visitante}"
                
        evento = FeedItem(
            quiniela_id=uq.quiniela_id,
            usuario_quiniela_id=uq.id,
            tipo="EVENTO",
            contenido=f"{nombre_usr} ha eliminado el pronóstico de {partido_nombre}"
        )
        db.add(evento)
        # No hacemos commit aún, lo haremos junto con el delete
    
    db.delete(pronostico)
    db.commit()
    
    # Recalcular total del usuario
    total_puntos = db.query(func.sum(Pronostico.puntos_obtenidos))\
        .filter(Pronostico.usuario_quiniela_id == usuario_quiniela_id)\
        .scalar() or 0
        
    usuario_quiniela = db.query(UsuarioQuiniela).filter(UsuarioQuiniela.id == usuario_quiniela_id).first()
    if usuario_quiniela:
        usuario_quiniela.puntos_totales = total_puntos
        db.commit()
        
    return {"message": "Pronóstico eliminado"}

@router.get("/quiniela/{codigo_acceso}/todas")
def listar_todos_pronosticos(codigo_acceso: str, db: Session = Depends(get_db)):
    quiniela = db.query(Quiniela).filter(Quiniela.codigo_acceso == codigo_acceso.upper()).first()
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
        
    pronosticos_db = db.query(Pronostico, Usuario.nombre, Partido)\
        .join(UsuarioQuiniela, Pronostico.usuario_quiniela_id == UsuarioQuiniela.id)\
        .join(Usuario, UsuarioQuiniela.usuario_id == Usuario.id)\
        .outerjoin(Partido, Pronostico.partido_id == Partido.id)\
        .filter(UsuarioQuiniela.quiniela_id == quiniela.id)\
        .order_by(Pronostico.insertado_a.desc())\
        .all()
        
    resultados = []
    for p, u_nombre, partido in pronosticos_db:
        if partido:
            resultados.append({
                "id": p.id,
                "usuario": u_nombre,
                "partido_id": partido.id,
                "partido": f"{partido.equipo_local} vs {partido.equipo_visitante}",
                "equipo_local": partido.equipo_local,
                "equipo_visitante": partido.equipo_visitante,
                "goles_local": p.goles_local,
                "goles_visitante": p.goles_visitante,
                "estado_partido": partido.estado,
                "goles_local_real": partido.goles_local_real,
                "goles_visitante_real": partido.goles_visitante_real,
                "fecha_partido": partido.fecha.isoformat(),
                "pronostico": f"{p.goles_local} - {p.goles_visitante}",
                "fecha": p.insertado_a.isoformat() + "Z",
                "puntos_obtenidos": p.puntos_obtenidos
            })
        else:
            resultados.append({
                "id": p.id,
                "usuario": u_nombre,
                "partido_id": None,
                "partido": "Predicción Libre",
                "pronostico": p.texto_libre,
                "fecha": p.insertado_a.isoformat() + "Z",
                "puntos_obtenidos": p.puntos_obtenidos
            })
            
    return resultados

