from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db

from models.usuario import Usuario as ModeloUsuario
from models.quiniela import Quiniela as ModeloQuiniela
from models.usuario_quiniela import UsuarioQuiniela as ModeloUsuarioQuiniela
from schemas.schemas import UsuarioRegistro, UsuarioLogin, UsuarioRespuesta, Quiniela
from utils.security import get_password_hash, verify_password

router = APIRouter()

@router.post("/registro", response_model=UsuarioRespuesta)
def registrar_usuario(usuario_in: UsuarioRegistro, db: Session = Depends(get_db)):
    # 1. Validar PIN
    if usuario_in.pin != usuario_in.confirm_pin:
        raise HTTPException(status_code=400, detail="Los PIN no coinciden")
    if not (usuario_in.pin.isdigit() and 4 <= len(usuario_in.pin) <= 6):
        raise HTTPException(status_code=400, detail="El PIN debe tener entre 4 y 6 dígitos")
        
    # 2. Verificar existencia
    existe = db.query(ModeloUsuario).filter(ModeloUsuario.nombre == usuario_in.nombre).first()
    if existe:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")
        
    # 3. Crear usuario
    nuevo_usuario = ModeloUsuario(
        nombre=usuario_in.nombre,
        pin_hash=get_password_hash(usuario_in.pin)
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@router.post("/login", response_model=UsuarioRespuesta)
def login_usuario(usuario_in: UsuarioLogin, db: Session = Depends(get_db)):
    usuario = db.query(ModeloUsuario).filter(ModeloUsuario.nombre == usuario_in.nombre).first()
    if not usuario or not verify_password(usuario_in.pin, usuario.pin_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return usuario

from schemas.schemas import UsuarioResetPin

@router.post("/olvido-pin", response_model=UsuarioRespuesta)
def reset_pin(usuario_in: UsuarioResetPin, db: Session = Depends(get_db)):
    usuario = db.query(ModeloUsuario).filter(ModeloUsuario.nombre == usuario_in.nombre).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if not (usuario_in.nuevo_pin.isdigit() and 4 <= len(usuario_in.nuevo_pin) <= 6):
        raise HTTPException(status_code=400, detail="El PIN debe tener entre 4 y 6 dígitos")
        
    usuario.pin_hash = get_password_hash(usuario_in.nuevo_pin)
    db.commit()
    db.refresh(usuario)
    return usuario

from pydantic import BaseModel

class UsuarioUpdate(BaseModel):
    nombre: str
    pin_actual: str
    nuevo_pin: str

@router.put("/{usuario_id}/configuracion", response_model=UsuarioRespuesta)
def actualizar_configuracion(usuario_id: int, config_in: UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(ModeloUsuario).filter(ModeloUsuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if not verify_password(config_in.pin_actual, usuario.pin_hash):
        raise HTTPException(status_code=401, detail="PIN actual incorrecto")
        
    if config_in.nombre != usuario.nombre:
        existe = db.query(ModeloUsuario).filter(ModeloUsuario.nombre == config_in.nombre).first()
        if existe:
            raise HTTPException(status_code=400, detail="El nombre ya está en uso")
        usuario.nombre = config_in.nombre
        
    if config_in.nuevo_pin:
        if not (4 <= len(config_in.nuevo_pin) <= 6 and config_in.nuevo_pin.isdigit()):
            raise HTTPException(status_code=400, detail="El nuevo PIN debe tener entre 4 y 6 dígitos numéricos")
        usuario.pin_hash = get_password_hash(config_in.nuevo_pin)
        
    db.commit()
    db.refresh(usuario)
    return usuario

@router.get("/{usuario_id}/dashboard")
def dashboard_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(ModeloUsuario).filter(ModeloUsuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # Creadas
    creadas = db.query(ModeloQuiniela).filter(ModeloQuiniela.creador_id == usuario_id).all()
    
    # Unidas
    uniones = db.query(ModeloUsuarioQuiniela).filter(
        ModeloUsuarioQuiniela.usuario_id == usuario_id,
        ModeloUsuarioQuiniela.activo == True
    ).all()
    quinielas_unidas = [u.quiniela for u in uniones]
    
    return {
        "dueño_de": creadas,
        "miembro_de": quinielas_unidas
    }

