import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

load_dotenv()

# Railway inyecta la variable DATABASE_URL para PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Railway a veces usa "postgres://" en vez de "postgresql://"
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    # Postgres no requiere check_same_thread
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
else:
    # Obtiene la ruta absoluta de la carpeta 'db' actual para SQLite local
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'quinielas.db')}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
