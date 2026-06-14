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
    goles_local_real: Optional[int] = None
    goles_visitante_real: Optional[int] = None

class ResultadoPartidoUpdate(BaseModel):
    goles_local_real: int
    goles_visitante_real: int

class PartidoCreate(PartidoBase):
    torneo_id: str

class Partido(PartidoBase):
    torneo_id: str
    class Config:
        orm_mode = True

class UsuarioRegistro(BaseModel):
    nombre: str
    pin: str
    confirm_pin: str

class UsuarioLogin(BaseModel):
    nombre: str
    pin: str

class UsuarioResetPin(BaseModel):
    nombre: str
    nuevo_pin: str

class UsuarioRespuesta(BaseModel):
    id: int
    nombre: str
    class Config:
        orm_mode = True

class QuinielaBase(BaseModel):
    nombre: str
    torneo_id: str
    reglas: Optional[str] = None
    puntos_exacto: int = 3
    puntos_ganador: int = 1
    bloqueo_activo: Optional[bool] = True

class QuinielaCreate(QuinielaBase):
    creador_id: int

class Quiniela(QuinielaBase):
    id: int
    codigo_acceso: str
    creador_id: int
    class Config:
        orm_mode = True

class QuinielaUpdate(BaseModel):
    nombre: Optional[str] = None
    reglas: Optional[str] = None
    puntos_exacto: Optional[int] = None
    puntos_ganador: Optional[int] = None
    bloqueo_activo: Optional[bool] = None

class PuntosUpdate(BaseModel):
    puntos: int

class RolUpdate(BaseModel):
    rol: str

class MiembroResponse(BaseModel):
    usuario_quiniela_id: int
    usuario_id: int
    nombre: str
    rol: str
    puntos_totales: int
    class Config:
        orm_mode = True

class QuinielaPublica(BaseModel):
    id: int
    nombre: str
    codigo_acceso: str
    creador_nombre: str
    participantes: int
    es_miembro: Optional[bool] = False
    class Config:
        orm_mode = True

class UsuarioQuinielaBase(BaseModel):
    rol: str = "usuario"

class UsuarioQuinielaCreate(BaseModel):
    usuario_id: int
    quiniela_codigo: str

class UsuarioQuiniela(UsuarioQuinielaBase):
    id: int
    usuario_id: int
    quiniela_id: int
    class Config:
        orm_mode = True

class PronosticoBase(BaseModel):
    partido_id: Optional[str] = None
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    texto_libre: Optional[str] = None

class PronosticoCreate(PronosticoBase):
    usuario_quiniela_id: int

class Pronostico(PronosticoBase):
    id: int
    usuario_quiniela_id: int
    puntos_obtenidos: int
    insertado_a: datetime.datetime
    class Config:
        orm_mode = True

class PronosticoPuntosUpdate(BaseModel):
    puntos: int

class MensajeCreate(BaseModel):
    contenido: str
    quiniela_codigo: str
    usuario_quiniela_id: int

class ReaccionToggle(BaseModel):
    emoji: str

class ReaccionResponse(BaseModel):
    emoji: str
    count: int
    user_reacted: bool

class FeedItemResponse(BaseModel):
    id: int
    tipo: str
    contenido: Optional[str] = None
    fecha: str
    usuario: Optional[str] = None
    usuario_id: Optional[int] = None
    partido: Optional[str] = None
    pronostico: Optional[str] = None
    pronostico_id: Optional[int] = None
    puntos_obtenidos: Optional[int] = None
    reacciones: List[ReaccionResponse] = []
