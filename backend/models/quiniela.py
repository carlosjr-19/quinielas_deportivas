from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base

class Quiniela(Base):
    __tablename__ = "quinielas"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo_acceso = Column(String, unique=True, index=True) # ej. QNL-8X2P
    nombre = Column(String, index=True)
    creador_nombre = Column(String) 
    torneo_id = Column(String, ForeignKey("torneos.id"))
    reglas = Column(String, nullable=True)
    
    torneo = relationship("Torneo", back_populates="quinielas")
    usuarios = relationship("UsuarioQuiniela", back_populates="quiniela")
