# Política de Seguridad — Sinai SGA

## Reporte de Vulnerabilidades

Contacto: **seguridad@sinai-sga.local**

No uses datos de producción ni compartas detalles públicamente hasta que el equipo haya tenido tiempo de resolver el problema.

## Responsabilidades

- El sistema maneja **datos personales** (nombres, cédulas, direcciones)
- El sistema maneja **datos financieros** (facturas, pagos, deudas)
- Se debe cumplir con normativas locales de protección de datos

## Medidas Implementadas

### Autenticación
- JWT con access token (1h) y refresh token (24h)
- Rotación automática de refresh tokens + blacklisting
- **Nota:** Tokens almacenados en `localStorage` (mejora pendiente: migrar a cookies HttpOnly)

### Autorización
- Roles: SuperAdmin (2), Admin (2), Lecturista (2) — máximo 6 usuarios
- Control de acceso por endpoint (3 niveles de permiso)

### Protección de Datos
- Credenciales en variables de entorno (`.env`), nunca en el repositorio
- SECRET_KEY requerida desde `.env` o entorno — **sin fallback hardcodeado** (corregido Jun 2026)
- `load_dotenv()` ejecutado antes de cargar settings

### Seguridad de Red
- CORS restringido a `FRONTEND_URL`
- HTTPS obligatorio en producción, HSTS (1 año)
- X-Frame-Options: DENY, XSS Filter, Content-Type Options: nosniff

### Seguridad de API
- Rate limiting: 5 req/min anónimo, 100 req/min autenticado
- Validación de tipos, rangos y valores en todos los inputs
- Transacciones atómicas en operaciones de escritura críticas (corregido Jun 2026)
- Protegido contra SQL Injection via ORM de Django

### Auditoría
- Lecturas registran quién y cuándo
- Pagos registran quién, método de pago y comentario
- Señal de Django para validación de creación de usuarios

## Checklist para Producción

- [x] SECRET_KEY configurada en `.env` (sin fallback)
- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS configurado con dominio real
- [ ] HTTPS configurado (Nginx + certificado SSL)
- [ ] Contraseña PostgreSQL segura (no la de desarrollo)
- [ ] Backups automáticos de PostgreSQL configurados
- [ ] Firewall del servidor (solo puertos 80, 443)
- [ ] Monitoreo y alertas de seguridad

### Recomendados
- [ ] Migrar tokens JWT de localStorage a cookies HttpOnly
- [ ] Fail2ban contra brute force
- [ ] Logging centralizado
- [ ] Web Application Firewall (WAF)
- [ ] Auditorías de seguridad periódicas

## Historial de Vulnerabilidades Remedidas

| Fecha | ID | Severidad | Descripción | Estado |
|-------|----|-----------|-------------|--------|
| 2026-06 | V001 | Crítico | SECRET_KEY hardcodeada | Corregido |
| 2026-06 | V002 | Crítico | DB credentials expuestas | Corregido |
| 2026-06 | V003 | Crítico | CORS Allow All Origins | Corregido |
| 2026-06 | V004 | Crítico | Sin validación en pagos | Corregido |
| 2026-06 | V005 | Crítico | Sin validación en lecturas | Corregido |
| 2026-06 | V006 | Crítico | Endpoint IoT sin auth | Corregido |
| 2026-06 | V007 | Alto | JWT sin rotación | Corregido |
| 2026-06 | V008 | Alto | Sin rate limiting | Corregido |
| 2026-06 | V009 | Alto | Sin headers de seguridad | Corregido |
| 2026-06 | V010 | Alto | Sin límite de usuarios | Corregido |
| 2026-06 | V011 | Medio | DEBUG=True | Corregido |
| 2026-06 | V012 | Medio | ALLOWED_HOSTS vacío | Corregido |
