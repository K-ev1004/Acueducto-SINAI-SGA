# Sinai SGA — Documentación

Sistema de Gestión de Acueducto. Backend Django 5.0 + DRF + PostgreSQL, Frontend React 18 + TypeScript + Vite.

---

## Índice

### Para comenzar
- [Guía de inicio rápido](guia-inicio-rapido.md) — Instalación, configuración, primer uso

### Funcionalidades del sistema
- [Reglas de negocio](REGLAS_DE_NEGOCIO.md) — Flujo mensual, estados, tarifas, tareas programadas
- [Arquitectura](ARQUITECTURA.md) — Stack, estructura, base de datos, endpoints, decisiones técnicas

### Referencia técnica
- [Endpoints de la API](endpoints-api.md) — Listado completo con ejemplos
- [Modelos de datos](modelos-de-datos.md) — Suscriptor, PeriodoLectura, Lectura, Factura, Pago, ConfiguracionGeneral
- [Política de seguridad](../SECURITY.md) — Reporte de vulnerabilidades, medidas implementadas

### Historial del proyecto
- [Documento de diseño original](archivo/PROJECT_CONSTRAINTS.md) — Versión 1.0 (archivado)

---

## Convenciones del proyecto

| Concepto | Formato |
|----------|---------|
| Números de factura | `FAC-{000001}` (auto-incremental) |
| Números de recibo | `REC-{000001}` (auto-incremental) |
| Código de usuario | Definido por admin (ej: `USR-001`) |
| Medidor ID | Definido por admin (ej: `M-001`) |

## Flujo principal

```
Lecturista toma lectura → Admin cierra período → Sistema genera facturas
→ Admin cobra → 15 días hábiles vence → 3 meses mora → Corte
```

Ver [Reglas de negocio](REGLAS_DE_NEGOCIO.md) para detalle completo.
