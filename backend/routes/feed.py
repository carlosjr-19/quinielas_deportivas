from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.feed import FeedItem, Reaccion
from models.pronostico import Pronostico
from models.usuario_quiniela import UsuarioQuiniela
from models.usuario import Usuario
from models.partido import Partido
from models.quiniela import Quiniela
from schemas.schemas import MensajeCreate, ReaccionToggle, FeedItemResponse
from typing import List
import datetime

router = APIRouter()

@router.post("/mensaje")
def publicar_mensaje(mensaje_in: MensajeCreate, db: Session = Depends(get_db)):
    if len(mensaje_in.contenido) > 100:
        raise HTTPException(status_code=400, detail="El mensaje no puede exceder los 100 caracteres")
        
    quiniela = db.query(Quiniela).filter(Quiniela.codigo_acceso == mensaje_in.quiniela_codigo.upper()).first()
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
        
    nuevo_feed = FeedItem(
        quiniela_id=quiniela.id,
        usuario_quiniela_id=mensaje_in.usuario_quiniela_id,
        tipo="MENSAJE",
        contenido=mensaje_in.contenido
    )
    db.add(nuevo_feed)
    db.commit()
    return {"message": "Mensaje publicado"}

@router.post("/{feed_item_id}/reaccionar")
def toggle_reaccion(feed_item_id: int, reaccion_in: ReaccionToggle, usuario_quiniela_id: int, db: Session = Depends(get_db)):
    emojis_permitidos = ["🔥", "🤡", "🤣", "💯", "💩"]
    if reaccion_in.emoji not in emojis_permitidos:
        raise HTTPException(status_code=400, detail="Emoji no permitido")
        
    item = db.query(FeedItem).filter(FeedItem.id == feed_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="FeedItem no encontrado")
        
    # Verificar si ya reaccionó con este emoji
    reaccion_existente = db.query(Reaccion).filter(
        Reaccion.feed_item_id == feed_item_id,
        Reaccion.usuario_quiniela_id == usuario_quiniela_id,
        Reaccion.emoji == reaccion_in.emoji
    ).first()
    
    if reaccion_existente:
        # Toggle: quitar reacción
        db.delete(reaccion_existente)
        db.commit()
        return {"message": "Reacción eliminada"}
    else:
        # Añadir reacción
        nueva_reaccion = Reaccion(
            feed_item_id=feed_item_id,
            usuario_quiniela_id=usuario_quiniela_id,
            emoji=reaccion_in.emoji
        )
        db.add(nueva_reaccion)
        db.commit()
        return {"message": "Reacción añadida"}

@router.get("/quiniela/{codigo_acceso}", response_model=List[FeedItemResponse])
def obtener_feed(codigo_acceso: str, usuario_quiniela_id: int, db: Session = Depends(get_db)):
    quiniela = db.query(Quiniela).filter(Quiniela.codigo_acceso == codigo_acceso.upper()).first()
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
        
    items = db.query(FeedItem).filter(FeedItem.quiniela_id == quiniela.id)\
        .order_by(FeedItem.creado_a.desc()).limit(50).all()
        
    resultados = []
    for item in items:
        # Obtener nombre del usuario si aplica
        usuario_nombre = None
        if item.usuario_quiniela_id:
            uq = db.query(UsuarioQuiniela).filter(UsuarioQuiniela.id == item.usuario_quiniela_id).first()
            if uq:
                u = db.query(Usuario).filter(Usuario.id == uq.usuario_id).first()
                usuario_nombre = u.nombre if u else "Desconocido"
                
        # Obtener pronóstico si aplica
        partido_nombre = None
        pronostico_texto = None
        puntos_obt = None
        if item.tipo == "PRONOSTICO" and item.pronostico_id:
            p = db.query(Pronostico).filter(Pronostico.id == item.pronostico_id).first()
            if p:
                puntos_obt = p.puntos_obtenidos
                if p.partido_id:
                    partido = db.query(Partido).filter(Partido.id == p.partido_id).first()
                    partido_nombre = f"{partido.equipo_local} vs {partido.equipo_visitante}" if partido else "Partido"
                    pronostico_texto = f"{p.goles_local} - {p.goles_visitante}"
                else:
                    partido_nombre = "Predicción Libre"
                    pronostico_texto = p.texto_libre

        # Obtener reacciones
        emojis_permitidos = ["🔥", "🤡", "🤣", "💯", "💩"]
        reacciones_response = []
        for em in emojis_permitidos:
            count = db.query(Reaccion).filter(Reaccion.feed_item_id == item.id, Reaccion.emoji == em).count()
            user_reacted = db.query(Reaccion).filter(
                Reaccion.feed_item_id == item.id,
                Reaccion.usuario_quiniela_id == usuario_quiniela_id,
                Reaccion.emoji == em
            ).first() is not None
            
            reacciones_response.append({
                "emoji": em,
                "count": count,
                "user_reacted": user_reacted
            })

        resultados.append({
            "id": item.id,
            "tipo": item.tipo,
            "contenido": item.contenido,
            "fecha": item.creado_a.isoformat() + "Z",
            "usuario": usuario_nombre,
            "usuario_id": item.usuario_quiniela_id,
            "partido": partido_nombre,
            "pronostico": pronostico_texto,
            "pronostico_id": item.pronostico_id,
            "puntos_obtenidos": puntos_obt,
            "reacciones": reacciones_response
        })
        
    return resultados
