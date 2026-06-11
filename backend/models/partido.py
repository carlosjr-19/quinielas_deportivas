from sqlalchemy import Column, String, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
import datetime
from db.database import Base

class Partido(Base):
    __tablename__ = "partidos"
    
    id = Column(String, primary_key=True, index=True) # ID externo
    torneo_id = Column(String, ForeignKey("torneos.id"))
    equipo_local = Column(String)
    equipo_visitante = Column(String)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    estado = Column(String, default="PENDIENTE") # PENDIENTE, EN_CURSO, FINALIZADO
    goles_local_real = Column(Integer, nullable=True)
    goles_visitante_real = Column(Integer, nullable=True)
    
    torneo = relationship("Torneo", back_populates="partidos")
    pronosticos = relationship("Pronostico", back_populates="partido")
