# ETAPA 1: Construir React
FROM node:20-alpine as build-stage
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ETAPA 2: Configurar Python y FastAPI
FROM python:3.11-slim
WORKDIR /app

# Instalar dependencias del sistema requeridas para compilar psycopg2
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el código del backend
COPY backend/ ./backend/

# Copiamos los archivos compilados de React desde la etapa 1 a la carpeta del backend
COPY --from=build-stage /app/frontend/dist ./backend/dist

# Exponemos el puerto
EXPOSE 8000

# Usamos Uvicorn para ejecutar la aplicación
# Railway asigna el puerto mediante la variable de entorno $PORT
# Como $PORT puede no estar en desarrollo, le asignamos 8000 por defecto
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
