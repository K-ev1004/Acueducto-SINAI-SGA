# 🛡️ Política de Seguridad — SENA SGA

## Reporte de Vulnerabilidades

Si descubres una vulnerabilidad de seguridad, **por favor repórtala responsablemente**. No uses datos de producción ni compartas detalles públicamente hasta que el equipo haya tenido tiempo de resolver el problema.

### Contacto
Contacta al equipo de seguridad en: **seguridad@sinai-sga.local**

## Responsabilidades de Seguridad

- El sistema maneja **datos personales** de suscriptores (nombres, cédulas, direcciones)
- El sistema maneja **datos financieros** (facturas, pagos, deudas)
- Se debe cumplir con las normativas locales de protección de datos personales

## Medidas de Seguridad Implementadas

### 1. Autenticación
- JWT con tokens de acceso (1 hora) y refresco (24 horas)
- Rotación automática de refresh tokens
- Blacklisting de tokens para logout efectivo
- Almacenamiento de tokens en `localStorage` del frontend

### 2. Autorización
- Tres roles: SuperAdmin, Admin, Lecturista
- Control de acceso por rol en cada endpoint
- Límite estricto de usuarios por rol (2 cada uno, 6 máximo total)
- Verificación de pertenencia de recursos (BOLA/IDOR)

### 3. Protección de Datos
- Credenciales almacenadas en variables de entorno (`.env`)
- Nunca se exponen en código fuente ni en el repositorio
- Contraseñas de base de datos fuera del código
- SECRET_KEY de Django desde variable de entorno

### 4. Seguridad de Red
- CORS restringido a dominios específicos
- HTTPS obligatorio en producción
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options: DENY
- XSS Filter activado
- Content-Type Options: nosniff

### 5. Seguridad de API
- Rate limiting: 5 req/min anónimo, 100 req/min autenticado
- Validación de tipos y rangos en todos los inputs
- Solo JSON aceptado (no se procesan formularios)
- SQL Injection: protegido por ORM de Django

### 6. Auditoría
- Cada lectura registra: quién la tomó y cuándo
- Cada pago registra: quién lo registró y método de pago
- Logs de eventos de usuario
- Signal de Django para validación de creación de usuarios

## Requisitos para Producción

### Obligatorios antes de desplegar

- [ ] Cambiar `SECRET_KEY` a una clave aleatoria de 50+ caracteres
- [ ] Establecer `DEBUG=False`
- [ ] Configurar `ALLOWED_HOSTS` con el dominio del VPS
- [ ] Configurar HTTPS (Nginx + certificado SSL)
- [ ] Usar contraseña segura de PostgreSQL (no la de desarrollo)
- [ ] Configurar backups automáticos de PostgreSQL
- [ ] Habilitar firewall del servidor (solo puertos 80, 443)
- [ ] Configurar monitoreo y alertas de seguridad

### Recomendados

- [ ] Implementar fail2ban contra intentos de brute force
- [ ] Configurar logging centralizado
- [ ] Implementar Web Application Firewall (WAF)
- [ ] Auditorías de seguridad periódicas
- [ ] Pruebas de penetración trimestrales

## Dependencias de Seguridad

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| django | 6.0.4 | Framework web con parches de seguridad |
| djangorestframework | - | API REST con seguridad integrada |
| djangorestframework-simplejwt | - | JWT con blacklist |
| django-cors-headers | - | Control CORS |
| psycopg2-binary | - | Conector PostgreSQL seguro |
| python-dotenv | - | Carga segura de variables de entorno |

## Incidentes

### Historial de Vulnerabilidades Remedidas

| Fecha | ID | Severidad | Descripción | Estado |
|-------|----|-----------|-------------|--------|
| 2026-05-10 | V001 | 🔴 Crítico | SECRET_KEY hardcodeada | ✅ Corregido |
| 2026-05-10 | V002 | 🔴 Crítico | DB credentials expuestas | ✅ Corregido |
| 2026-05-10 | V003 | 🔴 Crítico | CORS Allow All Origins | ✅ Corregido |
| 2026-05-10 | V004 | 🔴 Crítico | Sin validación en pagos | ✅ Corregido |
| 2026-05-10 | V005 | 🔴 Crítico | Sin validación en lecturas | ✅ Corregido |
| 2026-05-10 | V006 | 🔴 Crítico | Endpoint IoT sin auth | ✅ Corregido |
| 2026-05-10 | V007 | 🟠 Alto | JWT sin rotación | ✅ Corregido |
| 2026-05-10 | V008 | 🟠 Alto | Sin rate limiting | ✅ Corregido |
| 2026-05-10 | V009 | 🟠 Alto | Sin headers de seguridad | ✅ Corregido |
| 2026-05-10 | V010 | 🟠 Alto | Sin límite de usuarios | ✅ Corregido |
| 2026-05-10 | V011 | 🟡 Medio | DEBUG=True | ✅ Corregido |
| 2026-05-10 | V012 | 🟡 Medio | ALLOWED_HOSTS vacío | ✅ Corregido |