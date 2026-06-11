from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
import random
import string

from models.quiniela import Quiniela as ModeloQuiniela
from models.usuario import Usuario as ModeloUsuario
from models.usuario_quiniela import UsuarioQuiniela as ModeloUsuarioQuiniela
from schemas.schemas import Quiniela, QuinielaCreate, UsuarioQuiniela, UsuarioQuinielaCreate, QuinielaPublica, QuinielaUpdate

router = APIRouter()

def generar_codigo_acceso(db: Session):
    while True:
        part1 = ''.join(random.choices(string.ascii_uppercase, k=3))
        part2 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        codigo = f"{part1}-{part2}"
        existe = db.query(ModeloQuiniela).filter(ModeloQuiniela.codigo_acceso == codigo).first()
        if not existe:
            return codigo

from typing import Optional

@router.get("/", response_model=list[QuinielaPublica])
def listar_quinielas(usuario_id: Optional[int] = None, db: Session = Depends(get_db)):
    # Usamos un JOIN para obtener el nombre del creador y contar los participantes
    resultados = []
    quinielas = db.query(ModeloQuiniela).all()
    for q in quinielas:
        creador = db.query(ModeloUsuario).filter(ModeloUsuario.id == q.creador_id).first()
        participantes = db.query(ModeloUsuarioQuiniela).filter(ModeloUsuarioQuiniela.quiniela_id == q.id).count()
        
        es_miembro = False
        if usuario_id:
            existe_membresia = db.query(ModeloUsuarioQuiniela).filter(
                ModeloUsuarioQuiniela.quiniela_id == q.id,
                ModeloUsuarioQuiniela.usuario_id == usuario_id,
                ModeloUsuarioQuiniela.activo == True
            ).first()
            if existe_membresia:
                es_miembro = True
                
        resultados.append({
            "id": q.id,
            "nombre": q.nombre,
            "codigo_acceso": q.codigo_acceso,
            "creador_nombre": creador.nombre if creador else "Desconocido",
            "participantes": participantes,
            "es_miembro": es_miembro
        })
    return resultados

@router.post("/", response_model=Quiniela)
def crear_quiniela(quiniela_in: QuinielaCreate, db: Session = Depends(get_db)):
    # 1. Generar código
    codigo = generar_codigo_acceso(db)
    
    # 2. Verificar que creador existe
    creador = db.query(ModeloUsuario).filter(ModeloUsuario.id == quiniela_in.creador_id).first()
    if not creador:
        raise HTTPException(status_code=404, detail="Usuario creador no encontrado")
    
    # 3. Crear Quiniela
    nueva_quiniela = ModeloQuiniela(
        codigo_acceso=codigo,
        nombre=quiniela_in.nombre,
        creador_id=quiniela_in.creador_id,
        torneo_id=quiniela_in.torneo_id,
        reglas=quiniela_in.reglas,
        puntos_exacto=quiniela_in.puntos_exacto,
        puntos_ganador=quiniela_in.puntos_ganador
    )
    db.add(nueva_quiniela)
    db.commit()
    db.refresh(nueva_quiniela)
    
    # 4. Asignar admin
    admin_usuario = ModeloUsuarioQuiniela(
        usuario_id=creador.id,
        quiniela_id=nueva_quiniela.id,
        rol="admin"
    )
    db.add(admin_usuario)
    db.commit()
    
    return nueva_quiniela

@router.post("/unirse", response_model=UsuarioQuiniela)
def unirse_a_quiniela(union_in: UsuarioQuinielaCreate, db: Session = Depends(get_db)):
    codigo = union_in.quiniela_codigo.upper() if union_in.quiniela_codigo else None
    
    if codigo:
        quiniela = db.query(ModeloQuiniela).filter(ModeloQuiniela.codigo_acceso == codigo).first()
    else:
        raise HTTPException(status_code=400, detail="Debe proveer un código de quiniela")
        
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
        
    usuario = db.query(ModeloUsuario).filter(ModeloUsuario.id == union_in.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    existe = db.query(ModeloUsuarioQuiniela).filter(
        ModeloUsuarioQuiniela.quiniela_id == quiniela.id,
        ModeloUsuarioQuiniela.usuario_id == usuario.id
    ).first()
    
    if existe:
        if not existe.activo:
            existe.activo = True
            db.commit()
            db.refresh(existe)
        return existe # Ya está unido o se volvió a unir
        
    nuevo_miembro = ModeloUsuarioQuiniela(
        usuario_id=usuario.id,
        quiniela_id=quiniela.id,
        rol="usuario"
    )
    db.add(nuevo_miembro)
    db.commit()
    db.refresh(nuevo_miembro)
    
    return nuevo_miembro

@router.get("/{codigo_acceso}", response_model=Quiniela)
def obtener_quiniela(codigo_acceso: str, db: Session = Depends(get_db)):
    quiniela = db.query(ModeloQuiniela).filter(ModeloQuiniela.codigo_acceso == codigo_acceso.upper()).first()
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
    return quiniela

@router.put("/{codigo_acceso}", response_model=Quiniela)
def actualizar_quiniela(codigo_acceso: str, quiniela_in: QuinielaUpdate, db: Session = Depends(get_db)):
    quiniela = db.query(ModeloQuiniela).filter(ModeloQuiniela.codigo_acceso == codigo_acceso.upper()).first()
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
        
    if quiniela_in.nombre is not None:
        quiniela.nombre = quiniela_in.nombre
    if quiniela_in.reglas is not None:
        quiniela.reglas = quiniela_in.reglas
    if quiniela_in.puntos_exacto is not None:
        quiniela.puntos_exacto = quiniela_in.puntos_exacto
    if quiniela_in.puntos_ganador is not None:
        quiniela.puntos_ganador = quiniela_in.puntos_ganador
        
    db.commit()
    db.refresh(quiniela)
    return quiniela

from schemas.schemas import MiembroResponse, PuntosUpdate, RolUpdate

@router.get("/{codigo_acceso}/miembros", response_model=list[MiembroResponse])
def obtener_miembros(codigo_acceso: str, db: Session = Depends(get_db)):
    quiniela = db.query(ModeloQuiniela).filter(ModeloQuiniela.codigo_acceso == codigo_acceso.upper()).first()
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
        
    miembros_db = db.query(ModeloUsuarioQuiniela).filter(ModeloUsuarioQuiniela.quiniela_id == quiniela.id).all()
    resultado = []
    for m in miembros_db:
        usr = db.query(ModeloUsuario).filter(ModeloUsuario.id == m.usuario_id).first()
        # En la DB, usamos puntos_totales
        pt = getattr(m, 'puntos_totales', 0)
        resultado.append({
            "usuario_quiniela_id": m.id,
            "usuario_id": m.usuario_id,
            "nombre": usr.nombre if usr else "Desconocido",
            "rol": m.rol,
            "puntos_totales": pt
        })
    # Ordenar por puntos (descendente)
    resultado.sort(key=lambda x: x["puntos_totales"], reverse=True)
    return resultado

@router.delete("/{codigo_acceso}/miembros/{usuario_quiniela_id}")
def expulsar_miembro(codigo_acceso: str, usuario_quiniela_id: int, db: Session = Depends(get_db)):
    # Aquí podríamos validar si el que lo llama es admin, pero por simplificación lo hace el front
    miembro = db.query(ModeloUsuarioQuiniela).filter(ModeloUsuarioQuiniela.id == usuario_quiniela_id).first()
    if not miembro:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    if miembro.rol == "admin":
        raise HTTPException(status_code=400, detail="No puedes expulsar al creador")
        
    db.delete(miembro)
    db.commit()
    return {"message": "Miembro expulsado correctamente"}

@router.put("/{codigo_acceso}/miembros/{usuario_quiniela_id}/puntos")
def modificar_puntos(codigo_acceso: str, usuario_quiniela_id: int, puntos_in: PuntosUpdate, db: Session = Depends(get_db)):
    miembro = db.query(ModeloUsuarioQuiniela).filter(ModeloUsuarioQuiniela.id == usuario_quiniela_id).first()
    if not miembro:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
        
    setattr(miembro, 'puntos_totales', puntos_in.puntos)
    db.commit()
    return {"message": "Puntos actualizados"}

@router.put("/{codigo_acceso}/miembros/{usuario_quiniela_id}/rol")
def modificar_rol(codigo_acceso: str, usuario_quiniela_id: int, rol_in: RolUpdate, db: Session = Depends(get_db)):
    miembro = db.query(ModeloUsuarioQuiniela).filter(ModeloUsuarioQuiniela.id == usuario_quiniela_id).first()
    if not miembro:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
        
    if miembro.rol == "admin":
        raise HTTPException(status_code=400, detail="No se puede cambiar el rol del creador")
        
    if rol_in.rol not in ["usuario", "socio"]:
        raise HTTPException(status_code=400, detail="Rol inválido")
        
    setattr(miembro, 'rol', rol_in.rol)
    db.commit()
    return {"message": f"Rol actualizado a {rol_in.rol}"}

from models.feed import FeedItem, Reaccion
from models.pronostico import Pronostico

@router.delete("/{codigo_acceso}")
def eliminar_quiniela(codigo_acceso: str, usuario_id: int, db: Session = Depends(get_db)):
    quiniela = db.query(ModeloQuiniela).filter(ModeloQuiniela.codigo_acceso == codigo_acceso.upper()).first()
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
        
    if quiniela.creador_id != usuario_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta quiniela")

    # 1. Eliminar Reacciones relacionadas a esta quiniela (via feed_item)
    feed_items = db.query(FeedItem.id).filter(FeedItem.quiniela_id == quiniela.id).subquery()
    db.query(Reaccion).filter(Reaccion.feed_item_id.in_(feed_items)).delete(synchronize_session=False)
    
    # 2. Eliminar FeedItems
    db.query(FeedItem).filter(FeedItem.quiniela_id == quiniela.id).delete(synchronize_session=False)
    
    # 3. Eliminar Pronosticos
    usuarios_q = db.query(ModeloUsuarioQuiniela.id).filter(ModeloUsuarioQuiniela.quiniela_id == quiniela.id).subquery()
    db.query(Pronostico).filter(Pronostico.usuario_quiniela_id.in_(usuarios_q)).delete(synchronize_session=False)
    
    # 4. Eliminar UsuariosQuiniela
    db.query(ModeloUsuarioQuiniela).filter(ModeloUsuarioQuiniela.quiniela_id == quiniela.id).delete(synchronize_session=False)
    
    # 5. Eliminar Quiniela
    db.delete(quiniela)
    db.commit()
    return {"message": "Quiniela eliminada correctamente"}

@router.put("/{codigo_acceso}/salir")
def salir_quiniela(codigo_acceso: str, usuario_id: int, db: Session = Depends(get_db)):
    quiniela = db.query(ModeloQuiniela).filter(ModeloQuiniela.codigo_acceso == codigo_acceso.upper()).first()
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
        
    miembro = db.query(ModeloUsuarioQuiniela).filter(
        ModeloUsuarioQuiniela.quiniela_id == quiniela.id,
        ModeloUsuarioQuiniela.usuario_id == usuario_id
    ).first()
    
    if not miembro:
        raise HTTPException(status_code=404, detail="No eres miembro de esta quiniela")
        
    if miembro.rol == 'admin':
        raise HTTPException(status_code=400, detail="El creador no puede salir, solo eliminar la quiniela")
        
    miembro.activo = False
    db.commit()
    return {"message": "Has salido de la quiniela"}
