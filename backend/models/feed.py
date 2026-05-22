from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime
from db.database import Base

class FeedItem(Base):
    __tablename__ = "feed_items"
    
    id = Column(Integer, primary_key=True, index=True)
    quiniela_id = Column(Integer, ForeignKey("quinielas.id"))
    usuario_quiniela_id = Column(Integer, ForeignKey("usuarios_quiniela.id"), nullable=True) # Podría ser NULL si es un anuncio global
    tipo = Column(String) # 'PRONOSTICO', 'MENSAJE', 'EVENTO'
    contenido = Column(String, nullable=True) # Texto del mensaje o descripción del evento
    pronostico_id = Column(Integer, ForeignKey("pronosticos.id", ondelete="CASCADE"), nullable=True)
    creado_a = Column(DateTime, default=datetime.datetime.utcnow)
    
    usuario_quiniela = relationship("UsuarioQuiniela")
    pronostico = relationship("Pronostico")
    reacciones = relationship("Reaccion", back_populates="feed_item", cascade="all, delete-orphan")


class Reaccion(Base):
    __tablename__ = "reacciones"
    
    id = Column(Integer, primary_key=True, index=True)
    feed_item_id = Column(Integer, ForeignKey("feed_items.id", ondelete="CASCADE"))
    usuario_quiniela_id = Column(Integer, ForeignKey("usuarios_quiniela.id"))
    emoji = Column(String) # 🔥🤡🤣💯💩
    creado_a = Column(DateTime, default=datetime.datetime.utcnow)
    
    feed_item = relationship("FeedItem", back_populates="reacciones")
