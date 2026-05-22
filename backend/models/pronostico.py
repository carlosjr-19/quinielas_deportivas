from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime
from db.database import Base

class Pronostico(Base):
    __tablename__ = "pronosticos"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_quiniela_id = Column(Integer, ForeignKey("usuarios_quiniela.id"))
    partido_id = Column(String, ForeignKey("partidos.id"), nullable=True)
    goles_local = Column(Integer, nullable=True) 
    goles_visitante = Column(Integer, nullable=True)
    texto_libre = Column(String, nullable=True)
    puntos_obtenidos = Column(Integer, default=0) 
    insertado_a = Column(DateTime, default=datetime.datetime.utcnow) 
    
    usuario_quiniela = relationship("UsuarioQuiniela", back_populates="pronosticos")
    partido = relationship("Partido", back_populates="pronosticos")
