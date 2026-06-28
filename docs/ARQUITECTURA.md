# Arquitectura del Sistema — Sinai SGA

## Visión General

Sistema web de gestión de acueducto para ~113 suscriptores.
Arquitectura **monolito modular** (SPA + API REST, backend dividido en 7 apps por dominio).

---

## 1. Stack Tecnológico

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.13 | Lenguaje |
| Django | 6.0.4 | Framework web |
| Django REST Framework | 3.15.1 | API REST |
| SimpleJWT | 5.4.0 | Autenticación JWT con blacklist |
| Django CORS Headers | 4.4.0 | CORS para SPA |
| Django Q2 | ~1.x | Tareas programadas (usa PostgreSQL, sin Redis) |
| DRF Spectacular | - | Documentación Swagger/OpenAPI |
| Psycopg2 | 2.9.9 | Driver PostgreSQL |
| **xhtml2pdf** | 0.2.17 | Generación de PDFs |
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
├── backend/                         # Django REST API (monolito modular)
│   ├── core/                        # Configuración central
│   │   ├── settings.py              # Settings con env vars
│   │   ├── urls.py                  # URLs globales (include a cada app)
│   │   └── wsgi.py                  # WSGI para producción
│   ├── apps/                        # 7 módulos por dominio
│   │   ├── suscriptores/            # CRUD suscriptores, corte/reconexión
│   │   ├── lecturas/                # Lecturas, períodos, tareas programadas
│   │   ├── facturas/                # Facturas, PDF, email
│   │   ├── pagos/                   # Pagos, planilla cobro, recibo PDF
│   │   ├── configuracion/           # Tarifas, datos empresa
│   │   ├── usuarios/                # Auth JWT, validadores, señales
│   │   └── dashboard/               # KPIs, histórico, top deudores
│   ├── templates/                   # Templates HTML compartidos
│   │   ├── facturas/                # factura_pdf.html, recibo_pago.html
│   │   └── emails/                  # factura.html, recordatorio.html, vencida.html
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
│   │   │       ├── ModuloAdministrador.tsx  # Orquestador (~120 líneas)
│   │   │       ├── ModuloLecturista.tsx     # Panel lecturista
│   │   │       ├── VistaDashboard.tsx       # Dashboard con Recharts
│   │   │       ├── shared/                  # Componentes reutilizables
│   │   │       │   ├── ModalConfirmar.tsx
│   │   │       │   ├── ModalExito.tsx
│   │   │       │   ├── ModalCarga.tsx       # z-[60] bloqueante
│   │   │       │   └── TablaGenerica.tsx
│   │   │       └── vistas/                  # Vistas modulares
│   │   │           ├── VistaInicio.tsx      # KPIs, período actual
│   │   │           ├── VistaSuscriptores.tsx
│   │   │           ├── VistaLecturas.tsx    # Filtro mes/año
│   │   │           ├── VistaFacturacion.tsx # Filtro período
│   │   │           ├── VistaCobrosPagos.tsx # Planilla + pago rápido
│   │   │           └── VistaConfiguracion.tsx
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
│   └── archivo/                     # Documentos históricos
│       └── PROJECT_CONSTRAINTS.md   # Diseño original (v1.0)
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

Los modelos Django se mapean a tablas existentes via `db_table`:
| App | Modelo | Tabla real |
|-----|--------|------------|
| `suscriptores` | Suscriptor | `api_suscriptor` |
| `lecturas` | PeriodoLectura, Lectura | `api_periodolectura`, `api_lectura` |
| `facturas` | Factura | `api_factura` |
| `pagos` | Pago | `api_pago` |
| `configuracion` | ConfiguracionGeneral | `api_configuraciongeneral` |

Las FK entre apps usan string type (ej: `models.ForeignKey('suscriptores.Suscriptor', ...)`)
para evitar importaciones circulares.

Detalle de campos en [`docs/modelos-de-datos.md`](modelos-de-datos.md).

---

## 4. API REST

~20 endpoints organizados en 7 módulos, montados en `core/urls.py` bajo `/api/`:

| Módulo | App | URLs |
|--------|-----|------|
| Autenticación | `usuarios` | `/api/login/`, `/api/login/refresh/` |
| Suscriptores | `suscriptores` | `/api/suscriptores/` + CRUD + corte/reconexión |
| Lecturas | `lecturas` | `/api/lecturas/`, `/api/lecturas/historial/` |
| Períodos | `lecturas` | `/api/periodos/`, `/api/periodos/actual/` |
| Facturas | `facturas` | `/api/facturas/` + PDF + email + generar |
| Pagos | `pagos` | `/api/pagos/` + historial + recibo + rápido |
| Planilla Cobro | `pagos` | `/api/planilla-cobro/` |
| Configuración | `configuracion` | `/api/configuracion/` |
| Dashboard | `dashboard` | `/api/dashboard/` |

Los endpoints de facturas y pagos soportan filtros por `mes` y `anio`.
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
| **Múltiples apps por dominio** | App monolítica `api/` | Separación de concerns, escalabilidad, testing independiente |
| **FK con `'App.Model'` string** | Import directa | Evita importaciones circulares entre apps |
| **`db_table` en modelos** | Migración rename | Tablas legacy sin改名, migración cero-downtime |
| **ModuloAdministrador orquestador** | Mega componente 1500+ líneas | Mantenibilidad, cada vista en su archivo |
| **PostgreSQL** | SQLite, MySQL | Integridad referencial, JSON fields, concurrencia |
| **Django Q2** | Celery + Redis | Sin dependencia extra, misma BD, suficiente para 113 suscriptores |
| **xhtml2pdf** | WeasyPrint, ReportLab | WeasyPrint requiere GTK en Windows (no disponible); xhtml2pdf es Python puro |
| **Matplotlib (solo individual)** | Chart.js server-side | Gráficos embebidos en PDFs individuales; en lote no se incluyen por performance |
| **JWT** | Sesiones Django | Stateless, ideal para SPA + API separados |
| **React + Vite** | Django Templates | Componentes reutilizables, Tailwind CSS |
| **1 lectura por período** | 2 lecturas (inicial/final) | Simplifica trabajo en campo; anterior se obtiene del período previo |
| **Período automático** | Creación manual | Elimina fricción; sistema se anticipa al usuario |
| **Planilla de cobro unificada** | Pagos separados | Flujo más rápido para cobrar múltiples suscriptores |
