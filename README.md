# Sinai SGA (Sistema de Gestión de Acueducto)

Este proyecto es un Sistema de Gestión para Acueductos, dividido en un **Backend** (Django) y un **Frontend** (React + Vite).

---

## 📋 Requisitos Previos

Antes de instalar, asegúrate de tener:
- **Python 3.10+**
- **Node.js (LTS)**
- **PostgreSQL** instalado y corriendo.
- Una base de datos creada llamada `sinai_db`.

---

## 🛠️ Instalación y Configuración Inicial

Si acabas de clonar este repositorio, sigue estos pasos:

### 1. Configurar el Backend (Django)
1. Abre una terminal en la carpeta `backend`.
2. Crea y activa un entorno virtual:
   ```bash
   python -m venv venv
   # En Windows:
   .\venv\Scripts\activate
   # En Mac/Linux:
   source venv/bin/activate
   ```
3. Instala las librerías:
   ```bash
   pip install -r requirements.txt
   ```
4. Aplica las migraciones:
   ```bash
   python manage.py migrate
   ```

### 2. Configurar el Frontend (React)
1. Abre **otra** terminal en la carpeta `frontend`.
2. Instala los paquetes:
   ```bash
   npm install
   ```

---

## 🚀 Cómo ejecutar el proyecto

Para que la aplicación funcione, **ambos servidores deben estar corriendo**.

### Paso 1: Iniciar el Backend
En la terminal del backend (con el entorno activado):
```bash
python manage.py runserver
```

### Paso 2: Iniciar el Frontend
En la terminal del frontend:
```bash
npm run dev
```

### Paso 3: Acceder
Abre tu navegador en: **`http://localhost:5173/`**

---

## 👤 Cuentas de Prueba
- **Súper Admin:** `superadmin` / `admin123`
- **Administrador:** `admin` / `admin123`
- **Lecturista:** `lecturista` / `admin123`

---

## 🛠️ Comandos de Mantenimiento

**Crear un nuevo Súper Administrador:**
```bash
python manage.py createsuperuser
```

**Actualizar Base de Datos tras cambios en modelos:**
```bash
python manage.py makemigrations
python manage.py migrate
```