from sqlalchemy import Column, Integer, ForeignKey, String, Boolean
from sqlalchemy.orm import relationship
from db.database import Base

class UsuarioQuiniela(Base):
    __tablename__ = "usuarios_quiniela"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    quiniela_id = Column(Integer, ForeignKey("quinielas.id"))
    rol = Column(String, default="usuario") # 'admin' o 'usuario'
    puntos_totales = Column(Integer, default=0) # Total de puntos del usuario en la quiniela
    activo = Column(Boolean, default=True) # False si el usuario abandonó
    
    usuario = relationship("Usuario", back_populates="quinielas_unidas")
    quiniela = relationship("Quiniela", back_populates="usuarios")
    pronosticos = relationship("Pronostico", back_populates="usuario_quiniela")
