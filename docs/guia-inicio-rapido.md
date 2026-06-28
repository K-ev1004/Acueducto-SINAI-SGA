# Guía de Inicio Rápido

## Requisitos

| Herramienta | Versión mínima |
|------------|----------------|
| Python | 3.10+ |
| PostgreSQL | 14+ |
| Node.js | 18+ |
| Git | Cualquiera |

## 1. Variables de entorno

```bash
cd backend
copy .env.example .env        # Windows
# Editar .env con valores reales
```

Para generar SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

## 2. Crear base de datos

```sql
CREATE DATABASE sinai_db;
```

## 3. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py reset_all.py  # Crea estructura + datos de ejemplo
python manage.py runserver 0.0.0.0:8000
```

> El backend es un **monolito modular**: 7 apps Django bajo `apps/` en lugar de
> una app `api/` monolítica. Los comandos de gestión (`reset_all.py`, `migrar_excel.py`)
> están en `apps/lecturas/management/commands/` y `apps/configuracion/management/commands/`.

## 4. Frontend

```bash
cd frontend
npm install
npm run dev -- --port 3000
```

Abrir `http://localhost:3000`

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `superadmin` | `Super2025!Admin` | SuperAdmin |
| `admin` | `Admin2025!Secure` | Administrador |
| `admin2` | `Admin22025!Secure` | Administrador 2 |
| `lecturista` | `Lect2025!Turista` | Lecturista |
| `lector2` | `Lect22025!Turista` | Lecturista 2 |

## Tareas programadas

```bash
python manage.py qcluster
```

Ver [Reglas de negocio](REGLAS_DE_NEGOCIO.md#7-tareas-programadas-django-q2) para detalle.
