# Calciopolis - Quinielas Deportivas Mundiales

Calciopolis es una plataforma interactiva completa (Full Stack) diseñada para crear, gestionar y participar en quinielas de fútbol con amigos, completamente automatizada y centrada en grandes eventos deportivos (como la Copa Mundial 2026).

## 🚀 Características Principales

- **Quinielas Sociales:** Los usuarios pueden crear quinielas privadas (compartiendo un código único) o explorar quinielas públicas.
- **Predicciones Dinámicas:** Interfaz fluida y responsiva para predecir los resultados de la fase de grupos y eliminatorias.
- **Motor de Sincronización Automática:** La base de datos y la entrega de puntos se retroalimentan automáticamente a partir de un archivo centralizado `world_cup.json`. No necesitas asentar los puntos manualmente.
- **Mundial en Vivo:** Tablas de grupos calculadas en tiempo real y árbol de llaves eliminatorias actualizándose automáticamente.
- **Diseño Responsivo (Mobile-First):** UI diseñada con React y TailwindCSS garantizando accesibilidad desde cualquier dispositivo.

## 🛠️ Stack Tecnológico

**Backend:**
- Python 3.10+
- FastAPI
- SQLAlchemy (con SQLite por defecto)
- Pydantic

**Frontend:**
- React (Vite)
- Tailwind CSS
- React Router DOM

## ⚙️ Instalación Local

Asegúrate de tener instalado **Python 3.10+** y **Node.js**.

### 1. Configuración del Backend

```bash
# Entrar a la carpeta del backend
cd backend

# Crear un entorno virtual
python -m venv venv

# Activar el entorno virtual
# En Windows:
venv\Scripts\activate
# En Mac/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar el servidor local (FastAPI correrá en el puerto 8000)
uvicorn main:app --reload
```

### 2. Configuración del Frontend

Abre otra terminal y ejecuta:

```bash
# Entrar a la carpeta del frontend
cd frontend

# Instalar los paquetes de NPM
npm install

# Iniciar el servidor de desarrollo (Vite correrá en el puerto 3000 o 5173)
npm run dev
```

