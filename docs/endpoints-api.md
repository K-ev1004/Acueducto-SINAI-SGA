# Endpoints de la API

La API se compone de ~20 endpoints organizados en 7 módulos de Django
(`apps/`) montados en `core/urls.py` bajo `/api/`.

## Filtros comunes

Los endpoints listables soportan filtros por query params:

| Endpoint | Parámetros |
|----------|-------------|
| `/api/lecturas/` | `?medidor_id=MED001` |
| `/api/lecturas/historial/` | `?mes=3&anio=2026&medidor_id=MED001` |
| `/api/facturas/` | `?estado=PENDIENTE&medidor_id=MED001&periodo_id=1` |
| `/api/pagos/historial/` | `?suscriptor_id=1&fecha_desde=2026-01-01&fecha_hasta=2026-12-31` |
| `/api/planilla-cobro/` | `?mes=3&anio=2026` |

## Autenticación

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| POST | `/api/login/` | Login, retorna access + refresh JWT | Público |
| POST | `/api/login/refresh/` | Renueva access token | Público |

## Suscriptores

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/suscriptores/` | Listar todos | Lecturista+ |
| POST | `/api/suscriptores/` | Crear nuevo | Lecturista+ |
| GET | `/api/suscriptores/{id}/` | Detalle con lecturas/facturas/pagos | Lecturista+ |
| PUT | `/api/suscriptores/{id}/` | Actualizar | Lecturista+ |
| DELETE | `/api/suscriptores/{id}/` | Eliminar (solo superadmin) | SuperAdmin |
| POST | `/api/suscriptores/{id}/cortar/` | Cortar servicio | SuperAdmin |
| POST | `/api/suscriptores/{id}/reconectar/` | Reconectar + cargo reconexión | SuperAdmin |

## Lecturas

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| POST | `/api/lecturas/` | Registrar lectura (asigna período automático) | Lecturista+ |
| GET | `/api/lecturas/historial/` | Historial (filtro mes/anio/medidor_id) | Todos |

## Facturas

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/facturas/` | Listar (filtro estado/medidor/período) | Admin+ |
| GET | `/api/facturas/{id}/` | Detalle | Admin+ |
| POST | `/api/facturas/generar/` | Cerrar período + generar facturas (1-click) | SuperAdmin |
| GET | `/api/facturas/{id}/pdf/` | Descargar PDF individual | Admin+ |
| POST | `/api/facturas/lote-pdf/` | Descargar PDF por lote | Admin+ |
| POST | `/api/facturas/{id}/enviar-email/` | Enviar factura por email con PDF adjunto | Admin+ |

## Períodos

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/periodos/` | Listar todos | Admin+ |
| POST | `/api/periodos/` | Crear manual | SuperAdmin |
| GET | `/api/periodos/actual/` | Período actual (lo crea si no existe) | Lecturista+ |

## Pagos

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| POST | `/api/pagos/` | Registrar pago/abono (con o sin factura) | Lecturista+ |
| GET | `/api/pagos/historial/` | Historial de pagos | Todos |
| GET | `/api/pagos/{id}/recibo-pdf/` | Descargar recibo PDF | Lecturista+ |
| POST | `/api/pagos/rapido/` | Pago rápido desde planilla de cobro | Lecturista+ |

## Planilla de Cobro

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/planilla-cobro/` | Facturas pendientes + vencidas con saldos | SuperAdmin |

## Configuración

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/configuracion/` | Obtener configuración actual | Admin+ |
| PUT | `/api/configuracion/` | Actualizar tarifas y datos empresa | Admin+ |

## Dashboard

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/dashboard/` | KPIs + histórico 6 meses + top deudores | Todos |

---

## Ejemplos curl

```bash
# Login
curl -X POST http://127.0.0.1:8000/api/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"Admin2025!Secure\"}"

# Registrar suscriptor
curl -X POST http://127.0.0.1:8000/api/suscriptores/ ^
  -H "Authorization: Bearer TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"Juan Perez\",\"medidor_id\":\"MED001\",\"direccion\":\"Calle 10\"}"

# Registrar lectura
curl -X POST http://127.0.0.1:8000/api/lecturas/ ^
  -H "Authorization: Bearer TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"medidor_id\":\"MED001\",\"valor\":1540}"

# Registrar pago
curl -X POST http://127.0.0.1:8000/api/pagos/ ^
  -H "Authorization: Bearer TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"medidor_id\":\"MED001\",\"monto\":50000,\"metodo_pago\":\"EFECTIVO\"}"
```
