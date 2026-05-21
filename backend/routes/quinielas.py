from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
import random
import string

# Importamos los modelos y esquemas
from models.quiniela import Quiniela as ModeloQuiniela
from models.usuario_quiniela import UsuarioQuiniela as ModeloUsuarioQuiniela
from schemas.schemas import Quiniela, QuinielaCreate
from utils.security import get_password_hash

router = APIRouter()

def generar_codigo_acceso(db: Session, length=4):
    """Genera un código único alfanumérico para la quiniela."""
    while True:
        codigo = "QNL-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        existe = db.query(ModeloQuiniela).filter(ModeloQuiniela.codigo_acceso == codigo).first()
        if not existe:
            return codigo

@router.post("/", response_model=Quiniela)
def crear_quiniela(quiniela_in: QuinielaCreate, db: Session = Depends(get_db)):
    # 1. Generar código único
    codigo = generar_codigo_acceso(db)
    
    # 2. Crear la Quiniela en BD
    nueva_quiniela = ModeloQuiniela(
        codigo_acceso=codigo,
        nombre=quiniela_in.nombre,
        creador_nombre=quiniela_in.creador_nombre,
        torneo_id=quiniela_in.torneo_id,
        reglas=quiniela_in.reglas
    )
    db.add(nueva_quiniela)
    db.commit()
    db.refresh(nueva_quiniela)
    
    # 3. Guardar al creador como 'admin' en UsuarioQuiniela
    pin_hasheado = get_password_hash(quiniela_in.pin)
    admin_usuario = ModeloUsuarioQuiniela(
        quiniela_id=nueva_quiniela.id,
        nombre=quiniela_in.creador_nombre,
        pin_hash=pin_hasheado,
        rol="admin"
    )
    db.add(admin_usuario)
    db.commit()
    
    return nueva_quiniela

@router.get("/{codigo_acceso}", response_model=Quiniela)
def obtener_quiniela(codigo_acceso: str, db: Session = Depends(get_db)):
    quiniela = db.query(ModeloQuiniela).filter(ModeloQuiniela.codigo_acceso == codigo_acceso.upper()).first()
    if not quiniela:
        raise HTTPException(status_code=404, detail="Quiniela no encontrada")
    return quiniela

