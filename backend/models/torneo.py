from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from db.database import Base

class Torneo(Base):
    __tablename__ = "torneos"
    
    id = Column(String, primary_key=True, index=True) # ID externo
    nombre = Column(String, index=True)
    
    partidos = relationship("Partido", back_populates="torneo")
    quinielas = relationship("Quiniela", back_populates="torneo")
