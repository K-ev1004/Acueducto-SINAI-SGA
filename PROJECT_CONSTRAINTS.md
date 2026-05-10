# PROJECT CONSTRAINTS.md
## Sinai SGA - Configuración y Limitaciones del Proyecto

---

## 📋 ACERCA DEL SISTEMA

**Tipo:** Sistema de Gestión de Acueducto (SGA)
**Función:** Registro de mediciones de consumo de agua, facturación mensual y control de pagos.
**Arquitectura:** Django REST Framework (Backend) + React (Frontend)
**Deploy:** VPS en la nube (acceso vía internet público)

---

## 👥 MODELO DE USUARIOS

### Límites de Cuentas
| Rol | Cantidad Máxima | Permisos Específicos |
|-----|-----------------|----------------------|
| Super Admin | 2 | Gestionar cuentas de Admin y Lecturista |
| Admin | 2 | Gestionar suscriptores, facturas, pagos |
| Lecturista | 2 | Registrar lecturas mensuales |

### Definición de Permisos por Rol

```
LECTURISTA:
├── Registrar lecturas mensuales
│   ├── Valor del medidor (obligatorio)
│   ├── Timestamp automático (fecha/hora del registro)
│   ├── Usuario que tomó (automático)
│   └── Observaciones (opcional)
├── Ver sus propias lecturas
└── NO puede: facturar, cobrar, modificar suscriptores

ADMIN:
├── CRUD suscriptores (casas)
│   ├── Nombre
│   ├── ID de medidor (único)
│   ├── Dirección
│   └── Teléfono
├── Generar facturas (batch mensual)
├── Registrar pagos/abonos
│   ├── Monto (abono o pago total)
│   ├── Comentario (cómo/per dónde)
│   └── Registrar por (automático)
├── Gestión de deuda
│   ├── Ver estado de cuenta por suscriptor
│   ├── Acumulación automática de deuda
│   └── Marcar como cortado (3 meses sin pago)
├── Corte de servicio
│   ├── Aplicar corte (con motivo)
│   ├── Reactivar servicio
│   └── 3 meses deuda = obligatorio cortar
├── Ver reportes
│   ├── Historial de mediciones
│   ├── Historial de pagos
│   └── Suscriptores cortados
├── Ver auditoría de lecturista
└── NO puede: crear usuarios del sistema

SUPER ADMIN:
├── Gestionar cuentas
│   ├── Crear Admin
│   ├── Crear Lecturista
│   ├── Editar usuarios
│   ├── Desactivar usuarios
│   └── Restablecer contraseñas
├── Ver log de auditoría completo
└── NO puede: tomar lecturas, gestionar suscriptores
```

---

## 🔄 FLUJO DE NEGOCIO

### Ciclo Mensual
```
1. INICIO DE MES
   └── Admin abre período (marca "abierto")

2. TOMA DE LECTURAS
   └── Lecturista registra valor del medidor por cada suscriptor
   └── Sistema calcula: consumo = valor_actual - valor_anterior

3. CIERRE DE PERÍODO
   └── Admin cierra período
   └── Sistema genera facturas batch para todos los suscriptores
   └── Estado de período cambia a "cerrado"

4. COBRO
   └── Admin registra pagos/abonos
   └── Sistema actualiza estado de factura
   └── Sistema calcula meses de deuda

5. GESTIÓN DE MOROSOS
   └── Sistema marca facturas vencidas (3 meses = corte automático)

6. REINICIO (nuevo mes)
   └── Volver a paso 1
```

### Estados de Factura
- **Pendiente:** Factura emitida, sin pago
- **Abonado:** Pago parcial registrado
- **Pagado:** Pago completo registrado
- **Vencido:** 3 meses consecutivos sin pago completo

### Estados de Suscriptor
- **Activo:** Servicio funcionando normalmente
- **Cortado:** Servicio suspendido por deuda

---

## 📊 MODELOS DE DATOS

### Suscriptor (Casa)
```
- id: int (PK)
- nombre: str (max 100)
- medidor_id: str (unique, max 50)
- direccion: text
- telefono: str (max 20, opcional)
- estado_servicio: enum [activo, cortado]
- fecha_creacion: datetime
```

### Periodo (Mes de facturación)
```
- id: int (PK)
- año: int (2024, 2025, etc.)
- mes: int (1-12)
- estado: enum [abierto, cerrado]
- fecha_cierre: datetime (nullable)
```

### Lectura
```
- id: int (PK)
- suscriptor_id: FK -> Suscriptor
- periodo_id: FK -> Periodo
- valor: int (metros cúbicos * 1000)
- lectura_anterior: int (nullable)
- consumo: int (calculado)
- tomar_por_id: FK -> User
- fecha_lectura: datetime (auto)
- observaciones: text (opcional)
```

### Factura
```
- id: int (PK)
- suscriptor_id: FK -> Suscriptor
- periodo_id: FK -> Periodo
- consumo: int (copiado de Lectura)
- valor_total: decimal (calculado: consumo * tarifa)
- estado: enum [pendiente, abonado, pagado, vencido]
- meses_deuda: int
- comentario_pago: text (nullable)
- procesar_por_id: FK -> User
- fecha_factura: datetime (auto)
- fecha_pago: datetime (nullable)
```

### Pago
```
- id: int (PK)
- factura_id: FK -> Factura
- monto: decimal
- tipo: enum [abono, pago_total]
- comentario: text (cómo/per dónde)
- registrar_por_id: FK -> User
- fecha_pago: datetime (auto)
```

### CorteServicio
```
- id: int (PK)
- suscriptor_id: FK -> Suscriptor
- fecha_corte: datetime (auto)
- motivo: text
- aplicar_por_id: FK -> User
```

### Reactivacion
```
- id: int (PK)
- corte_id: FK -> CorteServicio (1:1)
- fecha_reactivacion: datetime (auto)
- reactivavar_por_id: FK -> User
```

### AuditLog
```
- id: int (PK)
- usuario_id: FK -> User (nullable)
- accion: str [CREATE, UPDATE, DELETE]
- modelo: str
- objeto_id: int
- datos_previos: json (nullable)
- datos_nuevos: json (nullable)
- ip_address: generic_ip
- user_agent: text
- timestamp: datetime (auto)
```

---

## 💰 TARIFAS

```
Tarifa base: $1500 COP por m³
Mínimo facturable: 0 m³ (consumo = 0)
Máximo consumo esperado: 50 m³ por mes
  └── Si > 50m³: marcar como anomalía para revisión
```

---

## 🔐 SEGURIDAD

### Autenticación
- JWT con access token (60 min) y refresh token (4 horas)
- Máximo 5 intentos de login por minuto (rate limit)
- Tokens en HttpOnly cookies (NO localStorage)

### Autorización (RBAC)
- Django Guardian para permisos por objeto
- Decoradores personalizados para vistas

### Headers de Seguridad
- HSTS habilitado (1 año)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- CSP configurado

### Auditoría
- Log de TODAS las acciones (crear, editar, eliminar)
- Registro de IP y User Agent
- Immutable (no se pueden editar logs)

### CORS
- Solo orígenes permitidos en variable de entorno
- No wildcard en producción

### HTTPS
- Redirect forzado en producción
- Cookies seguras

---

## 🌐 RED Y DEPLOY

### Entorno
- VPS en la nube (no local)
- Acceso vía internet público
- PostgreSQL como base de datos
- Nginx como reverse proxy (futuro)

### Variables de Entorno Requeridas
```bash
# .env (NUNCA commitear)
DJANGO_SECRET_KEY=<generar-con-django-secretkey>
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com
CORS_ALLOWED_ORIGINS=https://tu-dominio.com

DB_NAME=sinai_db
DB_USER=postgres
DB_PASSWORD=<tu-password>
DB_HOST=localhost
DB_PORT=5432
```

---

## ⏱️ LÍMITES DE NEGOCIO

| Elemento | Límite | Notas |
|----------|--------|-------|
| Lecturistas | 2 | Máximo permitido |
| Admins | 2 | Máximo permitido |
| Super Admins | 2 | Máximo permitido |
| Suscriptores | Sin límite | Según necesidades reales |
| Intentos login | 5/minuto | Rate limit |
| Acceso token | 60 minutos | JWT |
| Refresh token | 4 horas | JWT |
| Consumo máximo/mes | 50 m³ | Anomalía si se excede |
| Meses deuda para corte | 3 | Corte automático |
| Tarifa base | $1500/m³ | Configurable |

---

## 📝 CONVENCIONES DE CÓDIGO

### Python (Backend)
- Type hints obligatorios en funciones
- Docstrings en español
- Imports ordenados (stdlib, third-party, local)
- Longitud máxima de línea: 100

### TypeScript (Frontend)
- Interfaces para tipos de datos
- Componentes funcionales con hooks
- Archivos: PascalCase para componentes, camelCase para utilities

### Commits
- Formato: `[TIPO] Descripción`
- Tipos: `feat`, `fix`, `docs`, `refactor`, `security`, `test`

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
sinai-sga-project/
├── backend/
│   ├── api/
│   │   ├── models.py          # Modelos de datos
│   │   ├── serializers.py     # Serializers DRF
│   │   ├── views.py           # Vistas públicas
│   │   ├── views_admin.py     # Vistas de Admin
│   │   ├── views_lecturista.py# Vistas de Lecturista
│   │   ├── views_auth.py      # Auth personalizado
│   │   ├── permissions.py     # Permisos RBAC
│   │   ├── signals.py         # Señales de auditoría
│   │   ├── urls.py            # Rutas API
│   │   └── admin.py           # Django Admin
│   ├── core/
│   │   ├── settings.py        # Configuración
│   │   └── urls.py            # Rutas principales
│   └── manage.py
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── components/    # Componentes UI
│       │   ├── pages/         # Páginas por rol
│       │   └── App.tsx        # Rutas
│       ├── services/          # API calls
│       └── services/auth.ts   # Auth
├── PROJECT_CONSTRAINTS.md      # Este archivo
├── SECURITY.md                # Políticas de seguridad
└── README.md
```

---

## 🚫 NO SOPORTADO (Out of Scope)

- [ ] Portal de autosservicio para suscriptores
- [ ] Integración con pasarelas de pago online
- [ ] Notificaciones SMS/Email
- [ ] Aplicación móvil
- [ ] Integración con medidores IoT (ESP32)
- [ ] Reportes avanzados (gráficos, exportaciones)
- [ ] Sistema multi-tenant (múltiples acueductos)

---

**Última actualización:** 2025-05-10
**Versión:** 1.0
