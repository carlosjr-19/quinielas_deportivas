from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.pronostico import Pronostico
from models.partido import Partido
from schemas.schemas import Pronostico as PronosticoSchema, PronosticoCreate
from typing import List
import datetime

router = APIRouter()

@router.post("/", response_model=PronosticoSchema)
def registrar_pronostico(pronostico_in: PronosticoCreate, db: Session = Depends(get_db)):
    # 1. Obtener el partido para validar su fecha de inicio
    partido = db.query(Partido).filter(Partido.id == pronostico_in.partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
        
    # 2. Validar regla de los 5 minutos de bloqueo
    ahora = datetime.datetime.utcnow()
    limite_tiempo = partido.fecha + datetime.timedelta(minutes=5)
    
    if ahora > limite_tiempo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="El partido ya ha comenzado. No se permiten más pronósticos."
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
        pronostico_existente.insertado_a = ahora
        db.commit()
        db.refresh(pronostico_existente)
        return pronostico_existente
    else:
        # Si es la primera vez que predice este partido
        nuevo_pronostico = Pronostico(
            usuario_quiniela_id=pronostico_in.usuario_quiniela_id,
            partido_id=pronostico_in.partido_id,
            goles_local=pronostico_in.goles_local,
            goles_visitante=pronostico_in.goles_visitante,
            insertado_a=ahora
        )
        db.add(nuevo_pronostico)
        db.commit()
        db.refresh(nuevo_pronostico)
        return nuevo_pronostico

@router.get("/usuario/{usuario_id}", response_model=List[PronosticoSchema])
def listar_pronosticos_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """Obtener todos los pronósticos que ha hecho un usuario específico."""
    return db.query(Pronostico).filter(Pronostico.usuario_quiniela_id == usuario_id).all()

from models.usuario_quiniela import UsuarioQuiniela
from models.usuario import Usuario
from models.quiniela import Quiniela

@router.get("/quiniela/{codigo_acceso}")
def feed_pronosticos_quiniela(codigo_acceso: str, db: Session = Depends(get_db)):
    # Obtener quiniela
    quiniela = db.query(Quiniela).filter(Quiniela.codigo_acceso == codigo_acceso.upper()).first()
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
        
    # Hacer join para obtener los pronosticos, el nombre de usuario y los equipos del partido
    resultados = []
    # Consultamos todos los pronosticos de los miembros de esta quiniela
    pronosticos_db = db.query(Pronostico, Usuario.nombre, Partido.equipo_local, Partido.equipo_visitante)\
        .join(UsuarioQuiniela, Pronostico.usuario_quiniela_id == UsuarioQuiniela.id)\
        .join(Usuario, UsuarioQuiniela.usuario_id == Usuario.id)\
        .join(Partido, Pronostico.partido_id == Partido.id)\
        .filter(UsuarioQuiniela.quiniela_id == quiniela.id)\
        .order_by(Pronostico.insertado_a.desc())\
        .limit(50).all()
        
    for p, u_nombre, eq_local, eq_vis in pronosticos_db:
        resultados.append({
            "id": p.id,
            "usuario": u_nombre,
            "partido": f"{eq_local} vs {eq_vis}",
            "pronostico": f"{p.goles_local} - {p.goles_visitante}",
            "fecha": p.insertado_a.isoformat()
        })
        
    return resultados

