from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from db.database import Base

class UsuarioQuiniela(Base):
    __tablename__ = "usuarios_quiniela"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    quiniela_id = Column(Integer, ForeignKey("quinielas.id"))
    rol = Column(String, default="usuario") # 'admin' o 'usuario'
    puntos_totales = Column(Integer, default=0) # Total de puntos del usuario en la quiniela
    
    usuario = relationship("Usuario", back_populates="quinielas_unidas")
    quiniela = relationship("Quiniela", back_populates="usuarios")
    pronosticos = relationship("Pronostico", back_populates="usuario_quiniela")
