# Reglas de Negocio — Sinai SGA

## Visión General

Sistema de gestión de acueducto para una empresa de servicios públicos
pequeña (aprox. 113 suscriptores). Flujo 100% basado en lecturas manuales
y cobro en efectivo. Sin pasarela de pago en línea por ahora.

---

## 1. Actores del Sistema

| Rol | Cantidad Máx | Responsabilidades |
|-----|:------------:|-------------------|
| **SuperAdmin** | 2 | Configurar sistema, gestionar usuarios, datos críticos |
| **Administrador** | 2 | Gestionar suscriptores, cerrar períodos, cobros, corte/reconexión |
| **Lecturista** | 2 | Tomar lecturas en campo, registrar pagos en efectivo |

---

## 2. Flujo Mensual Completo (Ciclo de Facturación)

### 2.1 Apertura Automática del Período

```
Día 26 (00:00)
    │
    ▼
Tarea programada 'crear_periodo_si_aplica'
    │
    ├── ¿Ya existe período ABIERTO para este mes?
    │       ├── Sí → no hace nada
    │       └── No → crea PeriodoLectura(mes, anio, 'ABIERTO')
    │
    ▼
El lecturista ve el banner del período actual al abrir la app
```

- El período se crea automáticamente el **día 26 de cada mes** vía tarea programada
- Si alguien registra una lectura antes del día 26, el período se crea en ese momento
- El lecturista **no necesita** crear períodos manualmente — esa opción se eliminó

### 2.2 Toma de Lecturas — Días 26 al 31

```
Día 26 ────────────────────────────── Día 31 ────────────── Día hábil +15 ────
    │                                       │                     │
    ▼                                       ▼                     ▼
 Período creado                          Cierre manual       Vencimiento
 automáticamente                         por admin           automático
 (o al primera                           (1-click)           (tarea 9am)
  lectura del mes)
```

1. **Período se crea solo** (automático, paso 2.1)
2. **Lecturista abre la app** → ve banner con el período actual, progreso y su lista de suscriptores
3. **Por cada suscriptor activo**: ingresa **1 sola lectura** (la actual en m³)
4. El sistema **rechaza duplicados**: no se pueden registrar 2 lecturas para el mismo suscriptor en el mismo período
5. Cada lectura queda vinculada al período via `Lectura.periodo` FK
6. La **lectura anterior** para el cálculo de consumo se obtiene del **período cerrado anterior** (no del mismo período)
7. El admin ve en tiempo real el progreso: *"95/113 lecturas — 84%"*

### 2.3 Cierre de Período y Generación de Facturas

1. **Condición**: Todos los suscriptores `ACTIVOS` deben tener **exactamente 1 lectura** en el período actual
2. Si faltan lecturas → el botón "Cerrar período" aparece **deshabilitado** y muestra cuáles faltan
3. Admin hace clic en **"Cerrar período y generar facturas"** (1-click, no pide mes/año/tarifa)
4. **Cálculo de consumo** (corregido: 1 lectura por período):
   ```
   lectura_anterior = lectura del período CERRADO anterior (o 0 si no existe)
   lectura_actual   = lectura del período ACTUAL (única)
   consumo          = max(0, lectura_actual - lectura_anterior)
   ```
5. **Cálculo de montos** (tarifas se toman de `ConfiguracionGeneral`):
   ```
   valor_consumo     = consumo × tarifa_m3 (configurable)
   subtotal          = valor_consumo + cargo_aseo - subsidio_del_suscriptor
   monto_factura     = max(0, subtotal)
   deuda_acumulada   = suma de saldos pendientes de facturas anteriores
   nuevo_saldo       = deuda_acumulada + monto_factura
   fecha_vencimiento = fecha_hoy + 15_días_hábiles (contando con _sumar_dias_habiles)
   ```
6. Después del cierre → el admin puede ir a **"Cobros"** para empezar a cobrar inmediatamente

### 2.4 Campos de la Factura (formato de `datos de factura.txt`)

- N° Factura (auto-incremental: `FAC-000001`)
- Empresa, NIT, dirección (desde `ConfiguracionGeneral`)
- Código usuario, nombre, documento, dirección del suscriptor
- Medidor, fechas, lecturas anterior y actual
- Consumo m³, valor m³, valor consumo mes
- Cargo aseo, subsidio aplicado, abono a la deuda
- **Gráfico de consumo de los últimos 3 meses** (matplotlib, barras)(corregir a 4 meses)
- Total a pagar mes, deuda acumulada
- Fecha de vencimiento, T. pagado, nuevo saldo
- Firma del cobrador
- Mensaje configurable (desde `ConfiguracionGeneral.mensaje_pie`)

### 2.5 Entrega de Facturas

1. Admin descarga **PDF por lote** desde Facturación → "Descargar lote PDF"
2. Admin imprime las facturas y las **entrega físicamente** a cada suscriptor
3. **Excepción**: Para reposición, se puede descargar un **PDF individual** por factura

### 2.6 Cobro (Planilla de Cobro)

Después del cierre, el admin tiene una vista **"Cobros"** dedicada:

```
┌─────────────┬──────────┬───────────┬───────┬────────┬──────┐
│ Suscriptor  │ Medidor  │ Factura   │ Monto │ Saldo  │ PAGAR │
├─────────────┼──────────┼───────────┼───────┼────────┼──────┤
│ Juan Pérez  │ M-001    │ FAC-00001 │ $45k  │ $45k   │[💰]  │
│ María Gómez │ M-002    │ FAC-00002 │ $25k  │ $25k   │[💰]  │
└─────────────┴──────────┴───────────┴───────┴────────┴──────┘
```

1. Tabla con todas las facturas **PENDIENTE + VENCIDA**
2. Botón **"Cobrar"** → modal con monto pre-cargado = saldo
3. Al confirmar → registra el pago, actualiza la factura, la fila se marca como pagada
4. **FIFO**: Si no se selecciona factura, los pagos aplican a la más antigua primero
5. **Sobrante**: Si pagan de más → queda como abono para la próxima factura

> También existe el formulario tradicional de pagos (búsqueda por medidor + factura específica) en la pestaña "Pagos".

### 2.7 Vencimiento — 15 días hábiles después de generar

1. **Fecha de vencimiento** se calcula automáticamente: `_sumar_dias_habiles(fecha_hoy, 15)`
2. **Tarea programada 9:00 AM** (`verificar_vencidas`):
   - Factura no pagada → estado `PENDIENTE` → `VENCIDA`
   - `mes_deuda_continua += 1` en el suscriptor
   - Si tiene email → enviar aviso de factura vencida
3. **Tarea programada 8:00 AM** (`verificar_vencimientos`):
   - 7 días antes del vencimiento → enviar recordatorio (si tiene email)

### 2.8 Corte de Servicio — 3 meses consecutivos sin pago

1. **Tarea programada 10:00 AM** (`verificar_cortes`):
   - Busca suscriptores con `mes_deuda_continua >= 3`
   - Cambia `estado_servicio = 'CORTADO'`
   - Si tiene email → enviar aviso de corte
2. Admin ve los suscriptores CORTADOS en la lista, con indicador rojo
3. **Reconexión** (cuando el suscriptor paga):
   - Admin paga la deuda desde Cobros o Pagos
   - Admin hace clic en "Reconectar" desde Suscriptores
   - Se genera **factura automática por cargo de reconexión** (configurable)
   - `estado_servicio = 'ACTIVO'`, `mes_deuda_continua = 0`

---

## 3. Tarifas y Cargos (Editables desde Configuración)

| Concepto | Default | Cómo se aplica |
|----------|:-------:|----------------|
| **Tarifa por m³** | $1,500 | consumo × tarifa_m3 |
| **Cargo de aseo** | $7,000 | Se suma a cada factura |
| **Cargo de reconexión** | $50,000 | Factura automática al reconectar |
| **Días de plazo para pago** | 15 | Días hábiles desde la generación (función `_sumar_dias_habiles`) |
| **Subsidio por suscriptor** | $0 | Configurable por suscriptor, se resta del subtotal |

---

## 4. Reglas de Estados

### Suscriptor
```
ACTIVO ──→ (3 meses mora, vía tarea 10am) ──→ CORTADO
CORTADO ──→ (paga deuda + reconexión manual) ──→ ACTIVO
ACTIVO ──→ (admin manual) ──→ SUSPENDIDO
```

### Factura
```
PENDIENTE ──→ (pasa fecha vencimiento, tarea 9am) ──→ VENCIDA
PENDIENTE ──→ (pago total o suficiente) ──→ PAGADA
VENCIDA    ──→ (pago total o suficiente) ──→ PAGADA
```

### Período de Lectura
```
ABIERTO ──→ (admin hace clic en "Cerrar período") ──→ CERRADO
```
- Condición para cerrar: 100% de suscriptores ACTIVOS tienen 1 lectura en el período
- Si no se cumple → botón deshabilitado + mensaje con lista de pendientes

### Lectura
```
(ninguna) ──→ (lecturista registra) ──→ valor m³ + FK a período
```
- 1 sola lectura por suscriptor por período (rechaza duplicados)
- La lectura "anterior" se obtiene del período cerrado previo

---

## 5. Dashboard — KPIs

| KPI | Fórmula | Cómo se calcula |
|-----|---------|-----------------|
| **Suscriptores Activos** | `Suscriptor.estado_servicio = ACTIVO` | Conteo directo |
| **Recaudo del mes** | Suma de `Pago.monto` donde mes/año = actual | Filtro por fecha del pago |
| **Tasa de cobro** | `(Facturas PAGADAS / Total facturas) × 100` | Redondeado a 1 decimal |
| **Deuda pendiente** | Suma de `(monto - monto_pagado - abonos)` de PENDIENTE + VENCIDA | Aggregate DB |
| **Consumo promedio** | `Suma consumo del período actual / Suscriptores activos` | Redondeado a 1 decimal |
| **Top 5 deudores** | Suscriptores con mayor `total_deuda_sus` (annotate) | Ordenado DESC, limit 5 |
| **Lecturas pendientes** | `Activos - lecturas_tomadas` en período ABIERTO | Diferencia simple |
| **Período actual** | Objeto con `porcentaje`, `lecturas_tomadas`, `total_activos`, `puede_cerrarse` | De `periodo_actual` |
| **Recaudo mes anterior** | Suma de pagos del mes anterior | Comparativo mensual |

---

## 6. Notificaciones por Email (solo si el suscriptor tiene email registrado)

| Tipo | Disparador | Contenido |
|------|------------|-----------|
| **Factura generada** | Al cerrar período (opcional, botón "Enviar email" manual) | HTML con resumen + PDF adjunto |
| **Recordatorio de pago** | Tarea 8:00 AM — 7 días antes del vencimiento | "Tu factura vence en 7 días" |
| **Aviso de vencimiento** | Tarea 9:00 AM — al día siguiente de vencer | "Tu factura está vencida, regula tu situación" |
| **Aviso de corte** | Tarea 10:00 AM — al llegar a 3 meses de mora | "Tu servicio será cortado por falta de pago" |

---

## 7. Tareas Programadas (Django Q2)

Se crean automáticamente al ejecutar `python manage.py migrate` (migration `0007`).
Se ejecutan con `python manage.py qcluster`.

| Tarea | Horario | Función | Acción |
|-------|---------|---------|--------|
| `Vencimientos - Recordatorio 7 días` | Diaria 8:00 AM | `api.tasks.verificar_vencimientos` | Busca facturas que vencen en 7 días → envía recordatorio email |
| `Vencidas - Marcar mora` | Diaria 9:00 AM | `api.tasks.verificar_vencidas` | Facturas PENDIENTE vencidas → VENCIDA + mes_deuda_continua++ + email |
| `Cortes - Marcar para corte físico` | Diaria 10:00 AM | `api.tasks.verificar_cortes` | mes_deuda_continua >= 3 → CORTADO + email |
| `Crear período automático (día 26)` | Diaria 00:00 | `api.tasks.crear_periodo_si_aplica` | Si es día 26+ y no hay período ABIERTO → lo crea |

---

## 8. Modelo de Datos

### Suscriptor
- `nombre`, `medidor_id` (unique), `direccion`, `telefono`, `email`, `documento`, `codigo_usuario`
- `subsidio` (Decimal, se resta del total de la factura)
- `estado_servicio`: ACTIVO | CORTADO | SUSPENDIDO
- `mes_deuda_continua`: contador de meses consecutivos sin pagar

### PeriodoLectura
- `mes`, `anio` (unique together)
- `estado`: ABIERTO | CERRADO
- Métodos: `obtener_o_crear_actual()`, `obtener_ultimo_cerrado()`, `puede_cerrarse()`, `porcentaje_lecturas()`

### Lectura
- `suscriptor` (FK), `periodo` (FK, nuevo)
- `valor` (Float, m³), `fecha_lectura` (auto)
- `lecturista` (FK User)
- **1 sola lectura por suscriptor por período** (validado en backend)

### Factura
- `suscriptor`, `periodo`, `numero_factura` (auto: FAC-XXXXXX)
- `monto`, `monto_pagado`, `abonos`, `consumo`, `valor_m3`, `valor_aseo`
- `estado`: PENDIENTE | PAGADA | VENCIDA
- `fecha_generacion` (auto), `fecha_vencimiento` (15 días hábiles), `fecha_pago`
- `deuda_acumulada`, `nuevo_saldo`, `total_pagado`

### Pago
- `suscriptor`, `factura` (opcional FK)
- `monto`, `tipo`: PAGO | ABONO, `metodo_pago`: EFECTIVO | TRANSFERENCIA | OTRO
- `numero_recibo` (auto: REC-XXXXXX)

### ConfiguracionGeneral
- Singleton (PK=1). Campos: tarifa_m3, cargo_aseo, cargo_reconexion, dias_plazo_pago
- Datos de empresa: nombre, NIT, dirección, teléfono
- `mensaje_pie`: texto que aparece al pie de la factura

---

## 9. Excepciones y Casos Especiales

1. **Suscriptor sin lectura en el período**: No se le genera factura. El cierre falla si hay ACTIVOS sin lectura.
2. **Pago de más**: El sobrante se guarda como abono en la última factura (para el próximo mes).
3. **Suscriptor SUSPENDIDO**: No cuenta como ACTIVO, no necesita lectura, no se le genera factura.
4. **Reconexión con deuda**: La deuda debe pagarse. El cargo de reconexión se genera como factura adicional automática.
5. **Factura extraviada**: Se puede descargar PDF individual desde cualquier factura en el listado.
6. **Múltiples pagos parciales**: Se acumulan como abonos hasta completar el saldo.
7. **Sin email**: No se envían notificaciones, solo factura física impresa.
8. **Empresa vs Residencial**: Misma tarifa, pero el subsidio puede diferir (por suscriptor).
9. **Lectura duplicada**: El backend rechaza registrar una segunda lectura para el mismo suscriptor en el mismo período.
10. **Período sin cerrar al final del mes**: No hay cierre automático forzado — el admin debe hacer clic manualmente cuando todas las lecturas estén completas.
