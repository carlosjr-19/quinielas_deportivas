from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base

class UsuarioQuiniela(Base):
    __tablename__ = "usuarios_quiniela"
    
    id = Column(Integer, primary_key=True, index=True)
    quiniela_id = Column(Integer, ForeignKey("quinielas.id"))
    nombre = Column(String, index=True)
    pin_hash = Column(String) 
    rol = Column(String, default="usuario") # 'admin' o 'usuario'
    
    quiniela = relationship("Quiniela", back_populates="usuarios")
    pronosticos = relationship("Pronostico", back_populates="usuario_quiniela")
