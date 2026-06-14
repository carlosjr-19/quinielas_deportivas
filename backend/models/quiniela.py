from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from db.database import Base

class Quiniela(Base):
    __tablename__ = "quinielas"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo_acceso = Column(String, unique=True, index=True) # ej. QNL-8X2P
    nombre = Column(String, index=True)
    creador_id = Column(Integer, ForeignKey("usuarios.id")) 
    torneo_id = Column(String, ForeignKey("torneos.id"))
    reglas = Column(String, nullable=True)
    puntos_exacto = Column(Integer, default=3)
    puntos_ganador = Column(Integer, default=1)
    bloqueo_activo = Column(Boolean, default=True)
    
    torneo = relationship("Torneo", back_populates="quinielas")
    creador = relationship("Usuario", back_populates="quinielas_creadas")
    usuarios = relationship("UsuarioQuiniela", back_populates="quiniela")
