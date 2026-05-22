from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from db.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True)
    pin_hash = Column(String) 
    
    # Quinielas que este usuario ha creado (Dueño)
    quinielas_creadas = relationship("Quiniela", back_populates="creador")
    
    # Relación con las quinielas a las que se ha unido (Miembro/Admin)
    quinielas_unidas = relationship("UsuarioQuiniela", back_populates="usuario")
