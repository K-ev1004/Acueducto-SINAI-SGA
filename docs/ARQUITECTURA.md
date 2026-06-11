# Arquitectura del Sistema — Sinai SGA

## Visión General

Sistema web de gestión de acueducto para ~113 suscriptores.
Arquitectura **monolito con frontend separado** (SPA + API REST).

---

## 1. Stack Tecnológico

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.13 | Lenguaje |
| Django | 5.0.4 | Framework web |
| Django REST Framework | 3.15.1 | API REST |
| SimpleJWT | 5.4.0 | Autenticación JWT con blacklist |
| Django CORS Headers | 4.4.0 | CORS para SPA |
| Django Q2 | ~1.x | Tareas programadas (usa PostgreSQL, sin Redis) |
| DRF Spectacular | - | Documentación Swagger/OpenAPI |
| Psycopg2 | 2.9.9 | Driver PostgreSQL |
| **xhtml2pdf** | 0.2.17 | Generación de PDFs (reemplazó a WeasyPrint) |
| Matplotlib | 3.9.2 | Gráficos de consumo en PDFs individuales |
| Python-dotenv | 1.0.1 | Variables de entorno |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.3.1 | UI framework |
| TypeScript | - | Tipado estático |
| Vite | 6.3.5 | Build tool |
| Tailwind CSS | 4.1.12 | Estilos utilitarios |
| React Router | 7.13.0 | Rutas SPA |
| Recharts | 2.15.2 | Gráficos Dashboard |
| Lucide React | 0.487.0 | Iconos |

### Base de Datos
| Tecnología | Propósito |
|------------|-----------|
| PostgreSQL | Base de datos principal |
| Django ORM | Mapeo objeto-relacional |
| Migraciones Django | Control de versiones de esquema |

---

## 2. Estructura del Proyecto

```
sinai-sga-project/
├── backend/                         # Django REST API
│   ├── core/
│   │   ├── settings.py              # Settings con env vars
│   │   ├── urls.py                  # URLs globales
│   │   └── wsgi.py                  # WSGI para producción
│   ├── api/                         # Aplicación principal
│   │   ├── models.py                # 6 modelos: Suscriptor, PeriodoLectura,
│   │   │                            #   Lectura, Factura, Pago, ConfiguracionGeneral
│   │   ├── views.py                 # Todos los endpoints REST (~930 líneas)
│   │   ├── views_pdf.py             # Generación PDF (factura + recibo, lote)
│   │   ├── views_email.py           # Envío de emails
│   │   ├── views_auth.py            # Login JWT personalizado
│   │   ├── serializers.py           # Serializadores DRF
│   │   ├── urls.py                  # ~20 endpoints
│   │   ├── admin.py                 # Panel admin Django
│   │   ├── tasks.py                 # Tareas programadas (Django Q2)
│   │   ├── signals.py               # Señales (validación creación de usuarios)
│   │   ├── management/commands/     # migrar_excel.py, reset_all.py
│   │   ├── templates/
│   │   │   ├── facturas/            # factura_pdf.html, recibo_pago.html
│   │   │   └── emails/              # factura.html, recordatorio.html
│   │   ├── migrations/              # 7 migrations
│   │   └── static/                  # Logo, imágenes
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                        # React SPA
│   ├── src/
│   │   ├── main.tsx                 # Entry point
│   │   ├── app/
│   │   │   ├── App.tsx              # Router principal
│   │   │   └── components/
│   │   │       ├── Login.tsx        # Login JWT
│   │   │       ├── ModuloAdministrador.tsx  # ~1507 líneas (por dividir)
│   │   │       ├── ModuloLecturista.tsx     # Panel lecturista
│   │   │       └── VistaDashboard.tsx       # Dashboard con Recharts
│   │   └── services/
│   │       ├── api.ts               # Cliente fetch con JWT
│   │       └── auth.ts              # Manejo de tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── docs/                            # Documentación
│   ├── index.md                     # Hub de documentación
│   ├── guia-inicio-rapido.md        # Setup
│   ├── REGLAS_DE_NEGOCIO.md         # Reglas de negocio
│   ├── ARQUITECTURA.md              # Este documento
│   ├── endpoints-api.md             # Referencia API
│   ├── modelos-de-datos.md          # Modelos
│   ├── archivo/                     # Documentos históricos
│   │   └── PROJECT_CONSTRAINTS.md   # Diseño original (v1.0)
│
├── .env.example                     # Variables de entorno de ejemplo
├── SECURITY.md                      # Política de seguridad
└── README.md                        # Quickstart + link a docs/
```

---

## 3. Base de Datos — Modelo Relacional

```
Suscriptor (1) ──── (N) Lectura (N) ──── (1) PeriodoLectura
    │                                        │
    └──── (N) Factura ──── (1) ──────────────┘
                │
                └──── (N) Pago

ConfiguracionGeneral (singleton, pk=1)
```

Detalle de campos en [`docs/modelos-de-datos.md`](modelos-de-datos.md).

---

## 4. API REST

~20 endpoints organizados en: Autenticación, Suscriptores, Lecturas, Facturas,
Períodos, Pagos, Planilla de Cobro, Configuración, Dashboard.

Detalle completo en [`docs/endpoints-api.md`](endpoints-api.md).

---

## 5. Flujo de Datos

```
DÍA 26 → Período se crea automáticamente (tarea 00:00)
DÍAS 26-31 → Lecturista registra lecturas
CIERRE → Admin cierra período (1-click, requiere 100% lecturas)
  └→ Calcula consumo = lectura_actual - lectura_anterior (período cerrado previo)
  └→ Calcula montos (tarifa_m3 × consumo + cargo_aseo - subsidio)
  └→ Crea facturas con vencimiento a 15 días hábiles
PAGOS → Admin cobra desde planilla unificada
  └→ FIFO, sobrante → abono
VENCIMIENTO → Tarea 9:00 AM marca facturas como VENCIDA
CORTE → 3+ meses de mora → tarea 10:00 AM cambia a CORTADO
```

Detalle completo en [`docs/REGLAS_DE_NEGOCIO.md`](REGLAS_DE_NEGOCIO.md).

---

## 6. Seguridad

### Autenticación
- JWT via SimpleJWT: access token (1h), refresh token (1d) con rotación + blacklist
- Login personalizado que valida grupo de usuario

### Autorización (RBAC)
| Rol | Máx | Permisos |
|-----|-----|----------|
| SuperAdmin | 2 | CRUD completo, corte/reconexión, periodos, usuarios |
| Administrador | 2 | Suscriptores, facturas, pagos, dashboard |
| Lecturista | 2 | Lecturas, pagos/abonos, dashboard |

### Rate Limiting
- Anónimos: 5 req/min
- Autenticados: 100 req/min

### Headers de Seguridad (producción)
- X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection: 1
- HSTS (1 año), Cookies Secure + HttpOnly + SameSite

### CORS
- Solo origen del frontend configurable via `FRONTEND_URL`

---

## 7. Tareas Programadas (Django Q2)

Se ejecutan con `python manage.py qcluster`.

| Horario | Función | Acción |
|---------|---------|--------|
| 00:00 | `crear_periodo_si_aplica` | Crea período si es día 26+ |
| 08:00 | `verificar_vencimientos` | Recordatorio email 7 días antes |
| 09:00 | `verificar_vencidas` | Facturas PENDIENTE → VENCIDA |
| 10:00 | `verificar_cortes` | 3+ meses mora → CORTADO |

---

## 8. Decisiones Técnicas

| Decisión | Alternativa | Por qué |
|----------|-------------|---------|
| **PostgreSQL** | SQLite, MySQL | Integridad referencial, JSON fields, concurrencia |
| **Django Q2** | Celery + Redis | Sin dependencia extra, misma BD, suficiente para 113 suscriptores |
| **xhtml2pdf** | WeasyPrint, ReportLab | WeasyPrint requiere GTK en Windows (no disponible); xhtml2pdf es Python puro |
| **Matplotlib (solo individual)** | Chart.js server-side | Gráficos embebidos en PDFs individuales; en lote no se incluyen por performance |
| **JWT** | Sesiones Django | Stateless, ideal para SPA + API separados |
| **React + Vite** | Django Templates | Componentes reutilizables, Tailwind CSS |
| **1 lectura por período** | 2 lecturas (inicial/final) | Simplifica trabajo en campo; anterior se obtiene del período previo |
| **Período automático** | Creación manual | Elimina fricción; sistema se anticipa al usuario |
| **Planilla de cobro unificada** | Pagos separados | Flujo más rápido para cobrar múltiples suscriptores |
