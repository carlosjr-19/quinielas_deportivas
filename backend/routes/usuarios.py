from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db

# Importamos los modelos y esquemas
from models.quiniela import Quiniela as ModeloQuiniela
from models.usuario_quiniela import UsuarioQuiniela as ModeloUsuarioQuiniela
from schemas.schemas import UsuarioQuiniela, UsuarioQuinielaCreate
from utils.security import get_password_hash, verify_password

router = APIRouter()

@router.post("/unirse", response_model=UsuarioQuiniela)
def unirse_a_quiniela(usuario_in: UsuarioQuinielaCreate, db: Session = Depends(get_db)):
    # 1. Buscar la quiniela por su código de acceso
    codigo = usuario_in.quiniela_codigo.upper()
    quiniela = db.query(ModeloQuiniela).filter(ModeloQuiniela.codigo_acceso == codigo).first()
    
    if not quiniela:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="El código de quiniela no existe."
        )
        
    # 2. Verificar si el usuario ya existe en esta quiniela
    usuario_existente = db.query(ModeloUsuarioQuiniela).filter(
        ModeloUsuarioQuiniela.quiniela_id == quiniela.id,
        ModeloUsuarioQuiniela.nombre == usuario_in.nombre
    ).first()
    
    if usuario_existente:
        # Si ya existe, esto actúa como un "Login". Verificamos el PIN.
        if not verify_password(usuario_in.pin, usuario_existente.pin_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="El nombre de usuario ya está en uso y el PIN es incorrecto."
            )
        # Si el PIN es correcto, devolvemos el usuario (Login exitoso)
        return usuario_existente
        
    # 3. Si no existe, lo creamos como un usuario nuevo para esta quiniela
    nuevo_usuario = ModeloUsuarioQuiniela(
        quiniela_id=quiniela.id,
        nombre=usuario_in.nombre,
        pin_hash=get_password_hash(usuario_in.pin),
        rol="usuario" # Forzamos que sea un usuario regular
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    return nuevo_usuario

