# 🏗️ Sinai SGA (Sistema de Gestión de Acueducto)

![Django](https://img.shields.io/badge/Django-5.0-green)
![DRF](https://img.shields.io/badge/DRF-API-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-orange)
![React](https://img.shields.io/badge/React-18+-61DAFB)
![JWT](https://img.shields.io/badge/Auth-JWT-red)
![Security](https://img.shields.io/badge/Security-Audited-brightgreen)

Sistema de gestión para empresas de acueducto que permite el registro de suscriptores, toma de lecturas de medidores, facturación mensual, pagos y abonos, y corte/reconexión de servicio por mora.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#️-arquitectura)
- [Requisitos Previos](#️-requisitos-previos)
- [🔥 INICIAR EL PROYECTO (Paso a Paso)](#️-iniciando-el-proyecto)
- [Variables de Entorno](#-variables-de-entorno)
- [Estructura del Proyecto](#️-estructura-del-proyecto)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Roles y Permisos](#-roles-y-permisos)
- [Seguridad](#️-seguridad)
- [Autenticación JWT](#-autenticación-jwt)
- [Flujo de Facturación](#-flujo-de-facturación)
- [Modelos de Datos](#-modelos-de-datos)
- [Auditoría de Seguridad](#-auditoría-de-seguridad)
- [Créditos](#-créditos)

---

## ✨ Características

- 📦 Gestión de suscriptores con medidores individuales
- 📊 Toma de lecturas mensuales por lecturista con registro de fecha y hora
- 💰 Facturación automática por períodos (cierre de período genera todas las facturas)
- 💳 Registro de pagos y abonos con método de pago y comentario
- 🔌 Corte automático de servicio por mora de 3 meses consecutivos
- 🔌 Reconexión de servicio tras pago
- 👥 Sistema de roles: SuperAdmin, Admin, Lecturista (máx 2 de cada uno, 6 total)
- 📈 Historial completo de lecturas, facturas y pagos
- 🎯 Dashboard con estadísticas generales del sistema
- 🔐 Autenticación JWT con tokens de acceso y refresco
- 🛡️ Seguridad de nivel empresarial (auditoría de caja blanca aplicada)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)         │
│  📊 Dashboard │ 👥 Suscriptores │ 💰 Facturación       │
│  📋 Pagos     │ 📖 Lecturas    │ ⚙️ Configuración     │
│  └──────────────────────┬──────────────────────────────┘
│                         │ HTTPS
└─────────────────────────┼──────────────────────────────┘
                          │
┌─────────────────────────┴──────────────────────────────┐
│          BACKEND (Django 6.0 + DRF + PostgreSQL)        │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  API REST   │  │  Auth JWT    │  │  Seguridad     │  │
│  │  Endpoints  │  │  Tokens      │  │  CORS/Headers  │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────────┘  │
│         │                │                               │
│  ┌──────┴────────────────┴──────────────┐               │
│  │         PostgreSQL Database           │               │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ │               │
│  │  │ Users    │ │Suscripto-│ │Facturas│ │               │
│  │  │ auth     │ │res       │ │Pagos   │ │               │
│  │  │          │ │Lecturas  │ │Periodos│ │               │
│  │  └──────────┘ └──────────┘ └────────┘ │               │
│  └───────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Requisitos Previos

| Herramienta | Versión Mínima | Descarga |
|------------|----------------|----------|
| Python | 3.10+ | https://python.org |
| PostgreSQL | 14+ | https://postgresql.org |
| Node.js | 18+ | https://nodejs.org |
| Git | Cualquiera | https://git-scm.com |

---

## 🔥 INICIANDO EL PROYECTO

> **IMPORTANTE:** Siempre inicia el **backend primero**, luego el **frontend**.

### PASO 1: Configurar variables de entorno

```bash
# Entra al directorio del backend
cd backend

# Copia el archivo de ejemplo
copy .env.example .env        # Windows
cp .env.example .env          # Linux/Mac

# Edita .env con tus valores reales:
# - DJANGO_SECRET_KEY: genera una clave segura
# - DB_PASSWORD: tu contraseña de PostgreSQL
# - ALLOWED_HOSTS: tu dominio o IP del VPS
```

**Para generar una SECRET_KEY segura:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

### PASO 2: Crear base de datos en PostgreSQL

```sql
-- Conéctate a PostgreSQL y ejecuta:
CREATE DATABASE sinai_db;
-- Usa el usuario y contraseña que configuraste en .env
```

### PASO 3: Instalar dependencias del backend

```bash
cd backend

# Crear entorno virtual (si no existe)
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar paquetes
pip install -r requirements.txt
```

### PASO 4: Aplicar migraciones y crear datos de prueba

```bash
# Aplicar migraciones de la base de datos
python manage.py migrate

# Crear estructura completa con datos de ejemplo
# (usuarios, grupos, suscriptores, lecturas, facturas)
python reset_all.py
```

### PASO 5: 🔥 INICIAR EL BACKEND

```bash
python manage.py runserver 0.0.0.0:8000
```

Deberías ver:
```
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.
```

**Verificar que funciona:**
- Abre `http://127.0.0.1:8000/api/` → Debería mostrar la raíz de la API
- Abre `http://127.0.0.1:8000/api/docs/` → Documentación Swagger
- Abre `http://127.0.0.1:8000/admin/` → Panel de administración Django

> ⚠️ **DEJA ESTA TERMINAL ABIERTA.** El backend debe estar corriendo.

### PASO 6: Instalar dependencias del frontend

```bash
# Abre otra terminal (NO cierres la del backend)
cd frontend

# Instala las dependencias
npm install
```

### PASO 7: 🔥 INICIAR EL FRONTEND

```bash
npm run dev -- --port 3000
```

Deberías ver:
```
  VITE v6.x.x  ready in XXX ms
  ➜  Local:   http://localhost:3000/
```

### PASO 8: Abrir el navegador

Ve a: **http://localhost:3000**

Verás la pantalla de login. Usa las credenciales de abajo.

---

## 🔐 Credenciales de Prueba

| Usuario | Contraseña | Rol | Acceso a |
|---------|-----------|-----|----------|
| `superadmin` | `Super2025!Admin` | SuperAdmin | Todo |
| `admin` | `Admin2025!Secure` | Administrador | Dashboard, suscriptores, lecturas, pagos, facturas |
| `admin2` | `Admin22025!Secure` | Administrador 2 | Ídem admin |
| `lecturista` | `Lect2025!Turista` | Lecturista | Dashboard, lecturas, pagos |
| `lector2` | `Lect22025!Turista` | Lecturista 2 | Ídem lecturista |

### Endpoints de prueba rápida (curl)

```bash
# Login
curl -X POST http://127.0.0.1:8000/api/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"Admin2025!Secure\"}"

# Ver suscriptores (reemplaza TOKEN)
curl http://127.0.0.1:8000/api/suscriptores/ ^
  -H "Authorization: Bearer TOKEN"

# Dashboard
curl http://127.0.0.1:8000/api/dashboard/ ^
  -H "Authorization: Bearer TOKEN"

# Documentación Swagger
# Abre en navegador:
# http://127.0.0.1:8000/api/docs/
```

---

## 📝 Modelos de Datos

### `Suscriptor`
```
┌──────────────────┬──────────────┬──────────────────────────────┐
│ Campo            │ Tipo         │ Descripción                  │
├──────────────────┼──────────────┼──────────────────────────────┤
│ id               │ AutoField    │ ID único (auto)              │
│ nombre           │ CharField(100)│ Nombre completo             │
│ medidor_id       │ CharField(50)│ ID del medidor (ÚNICO)       │
│ direccion        │ CharField(255)│ Dirección del suscriptor    │
│ telefono         │ CharField(20) │ Teléfono de contacto        │
│ estado_servicio  │ CharField(20)│ ACTIVO/CORTADO/SUSPENDIDO    │
│ mes_deuda_continua│ Integer     │ Meses consecutivos sin pago  │
│ creado_en        │ DateTime     │ Fecha de creación (auto)     │
└──────────────────┴──────────────┴──────────────────────────────┘
```

### `PeriodoLectura`
```
┌──────────────────┬──────────────┬──────────────────────────────┐
│ Campo            │ Tipo         │ Descripción                  │
├──────────────────┼──────────────┼──────────────────────────────┤
│ id               │ AutoField    │ ID único (auto)              │
│ mes              │ PositiveInt  │ Mes (1-12)                   │
│ anio             │ PositiveInt  │ Año                          │
│ estado           │ CharField(20)│ ABIERTO/CERRADO              │
│ fecha_creacion   │ DateTime     │ Fecha de creación (auto)     │
│ fecha_cierre     │ DateTime     │ Fecha de cierre (nullable)   │
└──────────────────┴──────────────┴──────────────────────────────┘
Unique Together: (mes, anio)
```

### `Lectura`
```
┌──────────────────┬──────────────┬──────────────────────────────┐
│ Campo            │ Tipo         │ Descripción                  │
├──────────────────┼──────────────┼──────────────────────────────┤
│ id               │ AutoField    │ ID único (auto)              │
│ suscriptor       │ FK→Suscriptor│ Suscriptor relacionado       │
│ valor            │ Float        │ Valor del medidor            │
│ fecha_lectura    │ DateTime     │ Fecha/hora de la lectura     │
│ lecturista       │ FK→User      │ Quién tomó la lectura        │
└──────────────────┴──────────────┴──────────────────────────────┘
```

### `Factura`
```
┌──────────────────┬──────────────┬──────────────────────────────┐
│ Campo            │ Tipo         │ Descripción                  │
├──────────────────┼──────────────┼──────────────────────────────┤
│ id               │ AutoField    │ ID único (auto)              │
│ suscriptor       │ FK→Suscriptor│ Suscriptor relacionado       │
│ periodo          │ FK→PeriodoLec│ Período de la factura        │
│ monto            │ Decimal(10,2)│ Total a pagar                │
│ monto_pagado     │ Decimal(10,2)│ Monto pagado acumulado       │
│ abonos           │ Decimal(10,2)│ Abonos realizados            │
│ consumo          │ Float        │ Consumo en m³                │
│ estado           │ CharField(20)│ PENDIENTE/PAGADA/VENCIDA     │
│ fecha_generacion │ DateTime     │ Fecha de generación (auto)   │
└──────────────────┴──────────────┴──────────────────────────────┘
```

### `Pago`
```
┌──────────────────┬──────────────┬──────────────────────────────┐
│ Campo            │ Tipo         │ Descripción                  │
├──────────────────┼──────────────┼──────────────────────────────┤
│ id               │ AutoField    │ ID único (auto)              │
│ suscriptor       │ FK→Suscriptor│ Suscriptor relacionado       │
│ monto            │ Decimal(10,2)│ Monto del pago/abono         │
│ tipo             │ CharField(10)│ PAGO/ABONO                   │
│ metodo_pago      │ CharField(20)│ EFECTIVO/TRANSFERENCIA/OTRO  │
│ comentario       │ TextField    │ Nota del registrador         │
│ registrado_por   │ FK→User      │ Quién registró el pago       │
│ fecha_pago       │ DateTime     │ Fecha del pago (auto)        │
└──────────────────┴──────────────┴──────────────────────────────┘
```

---

## 💫 Roles y Permisos

| Rol | Máximo | Permisos |
|-----|--------|----------|
| **SuperAdmin** | 2 | CRUD completo, corte/reconexión, periodos, dashboard |
| **Administrador** | 2 | CRUD completo, ver dashboard, periodos, facturas |
| **Lecturista** | 2 | Registrar lecturas, pagos/abonos, ver suscriptores, dashboard |

### Permisos por Endpoint

| Endpoint | Lecturista | Admin | SuperAdmin |
|----------|:---------:|:-----:|:----------:|
| `GET /api/` | ✅ | ✅ | ✅ |
| `POST /api/login/` | ✅ | ✅ | ✅ |
| `GET /api/suscriptores/` | ✅ | ✅ | ✅ |
| `POST /api/suscriptores/` | ✅ | ✅ | ✅ |
| `PUT /api/suscriptores/<id>/` | ✅ | ✅ | ✅ |
| `DELETE /api/suscriptores/<id>/` | ❌ | ❌ | ✅ |
| `POST /api/suscriptores/<id>/cortar/` | ❌ | ❌ | ✅ |
| `POST /api/suscriptores/<id>/reconectar/` | ❌ | ❌ | ✅ |
| `POST /api/lecturas/` | ✅ | ✅ | ✅ |
| `GET /api/lecturas/historial/` | ✅ | ✅ | ✅ |
| `POST /api/pagos/` | ✅ | ✅ | ✅ |
| `GET /api/pagos/historial/` | ✅ | ✅ | ✅ |
| `GET /api/facturas/` | ❌ | ✅ | ✅ |
| `POST /api/facturas/generar/` | ❌ | ❌ | ✅ |
| `GET /api/periodos/` | ❌ | ✅ | ✅ |
| `POST /api/periodos/` | ❌ | ❌ | ✅ |
| `GET /api/dashboard/` | ✅ | ✅ | ✅ |

---

## 🛡️ Seguridad

### Implementada (Auditoría de caja blanca completada)

| Medida | Estado | Descripción |
|--------|--------|-------------|
| **JWT Authentication** | ✅ | Tokens de acceso (1h) y refresco (1d) con rotación |
| **Token Blacklisting** | ✅ | Tokens usados se invalidan para logout efectivo |
| **CORS Restringido** | ✅ | Solo orígenes específicos (sin wildcard `*`) |
| **Rate Limiting** | ✅ | 5 req/min anónimo, 100 req/min autenticado |
| **XSS Protection** | ✅ | Filtros del navegador activados |
| **Clickjacking Protection** | ✅ | `X-Frame-Options: DENY` |
| **SSL Redirect** | ✅ | Redirección automática a HTTPS en producción |
| **HSTS** | ✅ | Strict Transport Security (1 año) |
| **Secure Cookies** | ✅ | HttpOnly, Secure, SameSite |
| **Input Validation** | ✅ | Rango de valores, tipos numéricos, campos requeridos |
| **Sensitive Data in .env** | ✅ | SECRET_KEY, DB_PASSWORD fuera del código |
| **Git Ignore** | ✅ | `.env`, certificados, logs ignorados |
| **Límite de Usuarios** | ✅ | Máx 2 admins, 2 lecturistas, 2 superadmin |
| **Registro de auditoría** | ✅ | Lecturas y pagos registran quién y cuándo |

### Vulnerabilidades Remedidas (Auditoría Caja Blanca)

| ID | Severidad | Vulnerabilidad | Estado |
|----|-----------|----------------|--------|
| V001 | 🔴 CRÍTICO | SECRET_KEY hardcodeada | ✅ Corregido |
| V002 | 🔴 CRÍTICO | DB credentials expuestas | ✅ Corregido |
| V003 | 🔴 CRÍTICO | CORS Allow All Origins | ✅ Corregido |
| V004 | 🔴 CRÍTICO | Pago sin validación de monto | ✅ Corregido |
| V005 | 🔴 CRÍTICO | Lectura sin validación de rango | ✅ Corregido |
| V006 | 🔴 CRÍTICO | Endpoint IoT sin autenticación | ✅ Corregido |
| V007 | 🟠 ALTO | JWT sin rotación de tokens | ✅ Corregido |
| V008 | 🟠 ALTO | Sin rate limiting | ✅ Corregido |
| V009 | 🟠 ALTO | Sin headers de seguridad | ✅ Corregido |
| V010 | 🟠 ALTO | Sin límite de usuarios | ✅ Corregido |
| V011 | 🟡 MEDIO | DEBUG=True | ✅ Corregido |
| V012 | 🟡 MEDIO | ALLOWED_HOSTS vacío | ✅ Corregido |

---

## 🔐 Autenticación JWT

### Flujo de Autenticación

```
1. El cliente envía username/password a POST /api/login/
2. El servidor responde con access token (1h) y refresh token (1d)
3. El cliente incluye en cada request:
   Authorization: Bearer <token_acceso>
4. Cuando el access token expira:
   POST /api/login/refresh/ con el refresh token
5. Se obtiene un nuevo access token (el viejo se invalida)
```

| Token | Duración | Propósito |
|-------|----------|-----------|
| **Access Token** | 1 hora | Autenticación en cada request |
| **Refresh Token** | 24 horas | Renovar access token sin re-login |

---

## 💰 Flujo de Facturación

### Diagrama

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. Crear     │     │ 2. Registrar │     │ 3. Registrar │
│  Período de  │────▶│  Lecturas    │────▶│  Pagos/      │
│  Lectura     │     │  (por mes)   │     │  Abonos      │
│  (mes X)     │     │              │     │  (mensuales) │
└──────────────┘     └──────────────┘     └───────┬──────┘
                                                   │
                                                   ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 6. Corte de  │     │ 5. Pago de  │     │ 4. Cerrar   │
│  Servicio    │◀────│  Factura     │◀────│  Período y   │
│  (>3 meses   │     │              │     │  Generar     │
│  mora)       │     │              │     │  Facturas    │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Pasos

1. **Crear Período de Lectura**: Admin/SuperAdmin crea un nuevo período (mes/año)
2. **Registrar Lecturas**: La lecturista visita cada suscriptor y registra la lectura del medidor
3. **Registrar Pagos/Abonos**: Se registran pagos completos o abonos parciales con método de pago y comentario
4. **Cerrar Período y Generar Facturas**: Al final del mes, el admin cierra el período y el sistema genera automáticamente todas las facturas
5. **Pago de Factura**: El suscriptor paga su factura (puede ser total o parcial/abono)
6. **Corte de Servicio**: Si un suscriptor tiene 3+ meses consecutivos sin pago, se activa la opción de cortar servicio
7. **Reconexión**: Una vez pagado, el admin puede reconectar el servicio

### Fórmula de Facturación

```
Consumo del período = Última lectura - Primera lectura del período
Valor consumo = Consumo × Tarifa base ($1,500/m³)
Total a pagar = Valor consumo + Cargo fijo de aseo ($7,000)
Saldo pendiente = Monto facturado - Pagos realizados - Abonos
```

### Corte Automático por Mora

```
Si mes_deuda_continua >= 3:
    estado_servicio = 'CORTADO'

Para reconectar:
    estado_servicio = 'ACTIVO'
    mes_deuda_continua = 0
```

---

## 📊 Endpoints de la API

### Autenticación
```
POST   /api/login/              → Obtener tokens JWT
POST   /api/login/refresh/      → Refrescar access token
```

### Suscriptores
```
GET    /api/suscriptores/       → Listar todos
POST   /api/suscriptores/       → Crear nuevo
GET    /api/suscriptores/<id>/  → Detalle completo
PUT    /api/suscriptores/<id>/  → Actualizar
DELETE /api/suscriptores/<id>/  → Eliminar (solo superadmin)
POST   /api/suscriptores/<id>/cortar/      → Cortar servicio
POST   /api/suscriptores/<id>/reconectar/  → Reconectar servicio
```

### Lecturas
```
POST   /api/lecturas/           → Registrar lectura
GET    /api/lecturas/historial/  → Historial (filtros: mes, anio, medidor_id)
```

### Pagos y Abonos
```
POST   /api/pagos/              → Registrar pago o abono
GET    /api/pagos/historial/     → Historial de pagos
```

### Facturas
```
GET    /api/facturas/           → Listar facturas (filtros: estado, medidor_id)
POST   /api/facturas/generar/   → Generar facturas (cierre de período)
```

### Períodos
```
GET    /api/periodos/           → Listar todos los períodos
POST   /api/periodos/           → Crear nuevo período
```

### Dashboard
```
GET    /api/dashboard/          → Resumen general del sistema
```

### Documentación
```
GET    /api/docs/               → Swagger UI (documentación interactiva)
GET    /api/schema/             → OpenAPI Schema (JSON)
```

### Ejemplo de Requests (curl)

```bash
# Login (CMD Windows)
curl -X POST http://127.0.0.1:8000/api/login/ -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"Admin2025!Secure\"}"

# Registrar suscriptor
curl -X POST http://127.0.0.1:8000/api/suscriptores/ -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\"nombre\":\"Juan Perez\",\"medidor_id\":\"MED001\",\"direccion\":\"Calle 10\"}"

# Registrar lectura
curl -X POST http://127.0.0.1:8000/api/lecturas/ -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\"medidor_id\":\"MED001\",\"valor\":1540}"

# Registrar pago
curl -X POST http://127.0.0.1:8000/api/pagos/ -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\"medidor_id\":\"MED001\",\"monto\":50000,\"metodo_pago\":\"EFECTIVO\",\"comentario\":\"Pago en efectivo\"}"

# Generar facturas de un período
curl -X POST http://127.0.0.1:8000/api/facturas/generar/ -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\"mes\":8,\"anio\":2026,\"tarifa\":1500}"
```

---

## 🧪 Testing

```bash
cd backend
python manage.py test api
```

---

## 🚢 Despliegue en Producción (VPS)

### Checklist Obligatorio

| Tarea | Comando/Ejemplo |
|-------|----------------|
| Cambiar `SECRET_KEY` | `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| Establecer `DEBUG=False` | En `.env`: `DEBUG=False` |
| Configurar `ALLOWED_HOSTS` | `ALLOWED_HOSTS=tudominio.com,www.tudominio.com` |
| Usar HTTPS | Nginx + Let's Encrypt o Certbot |
| Contraseña PostgreSQL segura | Cambiar `DB_PASSWORD` en `.env` |
| Backups automáticos | `pg_dump` programado con cron |
| Firewall | Solo puertos 80 y 443 abiertos |
| Monitoreo | Logs centralizados, alertas |

### Stack Recomendado para Producción

```
Internet
  └── Nginx (reverse proxy + SSL/TLS)
        └── Gunicorn (servidor WSGI)
              └── Django (Sinai SGA API)
        └── Frontend (React SPA compilado)
  └── PostgreSQL (base de datos)
```

### Despliegue con Gunicorn + Nginx

```bash
# Instalar Gunicorn
pip install gunicorn

# Ejecutar con Gunicorn (4 workers)
gunicorn --workers 4 --bind 0.0.0.0:8000 core.wsgi:application

# Configuración Nginx (/etc/nginx/sites-available/sinai-sga)
# server {
#     listen 80;
#     server_name tudominio.com;
#     return 301 https://$server_name$request_uri;
# }
#
# server {
#     listen 443 ssl;
#     server_name tudominio.com;
#
#     ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
#
#     location /api/ {
#         proxy_pass http://127.0.0.1:8000;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#     }
#
#     location / {
#         root /ruta/al/frontend/build;
#         try_files $uri $uri/ /index.html;
#     }
# }
```

---

## 🔍 Auditoría de Seguridad

Este proyecto fue sometido a una auditoría de **caja blanca** que identificó y remedió **13 vulnerabilidades**, incluyendo:

- Credenciales hardcodeadas (SECRET_KEY, DB passwords)
- CORS abierto a todos los orígenes
- Falta de validación en pagos y lecturas
- Tokens JWT sin rotación
- Sin rate limiting
- Sin headers de seguridad
- Control de límites de usuarios

Documentación completa de la auditoría disponible en los archivos del proyecto.

Ver también: [`SECURITY.md`](./SECURITY.md)

---

## 📜 Licencia

Proyecto privado de la Empresa de Servicios Públicos de Acueducto. Todos los derechos reservados.

---

## ✨ Créditos

- **Auditoría de Seguridad**: Equipo de Ciberseguridad Senior
- **Backend**: Django 6.0 + Django REST Framework + PostgreSQL
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Autenticación**: Simple JWT con token blacklist
- **Seguridad**: OWASP API Top 10 mitigado