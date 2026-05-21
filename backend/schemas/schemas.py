from pydantic import BaseModel
from typing import List, Optional
import datetime

# --- Pydantic schemas base ---

class TorneoBase(BaseModel):
    id: str
    nombre: str

class TorneoCreate(TorneoBase):
    pass

class Torneo(TorneoBase):
    class Config:
        orm_mode = True

class PartidoBase(BaseModel):
    id: str
    equipo_local: str
    equipo_visitante: str
    fecha: datetime.datetime
    estado: str = "PENDIENTE"

class PartidoCreate(PartidoBase):
    torneo_id: str

class Partido(PartidoBase):
    torneo_id: str
    class Config:
        orm_mode = True

class QuinielaBase(BaseModel):
    nombre: str
    creador_nombre: str
    torneo_id: str
    reglas: Optional[str] = None

class QuinielaCreate(QuinielaBase):
    pin: str # El PIN plano, se hasheará antes de guardar al admin

class Quiniela(QuinielaBase):
    id: int
    codigo_acceso: str
    class Config:
        orm_mode = True

class UsuarioQuinielaBase(BaseModel):
    nombre: str
    rol: str = "usuario"

class UsuarioQuinielaCreate(UsuarioQuinielaBase):
    pin: str
    quiniela_codigo: str

class UsuarioQuiniela(UsuarioQuinielaBase):
    id: int
    quiniela_id: int
    class Config:
        orm_mode = True

class PronosticoBase(BaseModel):
    partido_id: str
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None

class PronosticoCreate(PronosticoBase):
    usuario_quiniela_id: int

class Pronostico(PronosticoBase):
    id: int
    usuario_quiniela_id: int
    puntos_obtenidos: int
    insertado_a: datetime.datetime
    class Config:
        orm_mode = True
