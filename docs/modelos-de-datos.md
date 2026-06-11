# Modelos de Datos

## Suscriptor

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | AutoField | ID único |
| nombre | CharField(100) | Nombre completo |
| medidor_id | CharField(50) | ID del medidor (único) |
| direccion | CharField(255) | Dirección |
| telefono | CharField(20) | Teléfono de contacto |
| email | EmailField | Correo electrónico |
| documento | CharField(50) | Número de documento |
| codigo_usuario | CharField(50) | Código interno |
| subsidio | DecimalField(10,2) | Subsidio aplicado |
| estado_servicio | CharField(20) | ACTIVO / CORTADO / SUSPENDIDO |
| mes_deuda_continua | IntegerField | Meses consecutivos sin pago |
| creado_en | DateTimeField | Fecha de creación |

## PeriodoLectura

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | AutoField | ID único |
| mes | PositiveIntegerField | Mes (1-12) |
| anio | PositiveIntegerField | Año |
| estado | CharField(20) | ABIERTO / CERRADO |
| fecha_creacion | DateTimeField | Fecha de creación (auto) |
| fecha_cierre | DateTimeField | Fecha de cierre (nullable) |

Unique together: `(mes, anio)`

## Lectura

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | AutoField | ID único |
| suscriptor | FK→Suscriptor | Suscriptor relacionado |
| periodo | FK→PeriodoLectura | Período de la lectura |
| valor | FloatField | Valor del medidor en m³ |
| fecha_lectura | DateTimeField | Fecha/hora (auto) |
| lecturista | FK→User | Quién tomó la lectura |

## Factura

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | AutoField | ID único |
| suscriptor | FK→Suscriptor | Suscriptor relacionado |
| periodo | FK→PeriodoLectura | Período de facturación |
| numero_factura | CharField(20) | FAC-XXXXXX (auto) |
| monto | DecimalField(10,2) | Total a pagar |
| monto_pagado | DecimalField(10,2) | Pagado acumulado |
| abonos | DecimalField(10,2) | Abonos realizados |
| consumo | FloatField | Consumo en m³ |
| valor_m3 | FloatField | Tarifa aplicada |
| valor_aseo | FloatField | Cargo de aseo |
| subsidio_aplicado | FloatField | Subsidio aplicado |
| estado | CharField(20) | PENDIENTE / PAGADA / VENCIDA |
| fecha_generacion | DateTimeField | Generación (auto) |
| fecha_vencimiento | DateField | Vencimiento (15 días hábiles) |
| fecha_pago | DateField | Fecha de pago (nullable) |
| deuda_acumulada | DecimalField(10,2) | Deuda de períodos anteriores |
| nuevo_saldo | DecimalField(10,2) | Saldo total actualizado |
| total_pagado | DecimalField(10,2) | Suma de pagos |
| email_enviado | BooleanField | Si se envió por email |
| firma_cobrador | CharField(100) | Cobrador que recibió |

## Pago

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | AutoField | ID único |
| suscriptor | FK→Suscriptor | Suscriptor |
| factura | FK→Factura (nullable) | Factura asociada |
| monto | DecimalField(10,2) | Monto del pago/abono |
| tipo | CharField(10) | PAGO / ABONO |
| metodo_pago | CharField(20) | EFECTIVO / TRANSFERENCIA / OTRO |
| numero_recibo | CharField(20) | REC-XXXXXX (auto) |
| comentario | TextField | Nota |
| registrado_por | FK→User | Quién registró |
| fecha_pago | DateTimeField | Fecha del pago (auto) |

## ConfiguracionGeneral

| Campo | Tipo | Descripción |
|-------|------|-------------|
| tarifa_m3 | DecimalField(10,2) | Precio por m³ |
| cargo_aseo | DecimalField(10,2) | Cargo fijo de aseo |
| cargo_reconexion | DecimalField(10,2) | Cargo por reconexión |
| dias_plazo_pago | IntegerField | Días hábiles de plazo |
| nombre_empresa | CharField(100) | Nombre de la empresa |
| nit_empresa | CharField(50) | NIT |
| direccion_empresa | CharField(255) | Dirección |
| telefono_empresa | CharField(20) | Teléfono |
| mensaje_pie | TextField | Texto al pie de la factura |
