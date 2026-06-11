# Sinai SGA (Sistema de Gestión de Acueducto)

![Django](https://img.shields.io/badge/Django-5.0-green)
![DRF](https://img.shields.io/badge/DRF-API-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-orange)
![React](https://img.shields.io/badge/React-18+-61DAFB)
![JWT](https://img.shields.io/badge/Auth-JWT-red)

Sistema de gestión para empresas de acueducto: registro de suscriptores, toma de lecturas, facturación mensual, pagos/abonos, corte y reconexión de servicio.

## Inicio rápido

```bash
cd backend
copy .env.example .env              # Configurar .env
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py reset_all.py       # Datos de prueba
python manage.py runserver 0.0.0.0:8000
```

```bash
# Otra terminal:
cd frontend 
npm run dev -- --port 3000
```

Abrir `http://localhost:3000`

## Credenciales

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `superadmin` | `Super2025!Admin` | SuperAdmin |
| `admin` | `Admin2025!Secure` | Admin |
| `lecturista` | `Lect2025!Turista` | Lecturista |

## Documentación

Ver la documentación completa en [`docs/index.md`](docs/index.md):

- [Guía de inicio rápido](docs/guia-inicio-rapido.md)
- [Reglas de negocio](docs/REGLAS_DE_NEGOCIO.md)
- [Arquitectura](docs/ARQUITECTURA.md)
- [Endpoints de la API](docs/endpoints-api.md)
- [Modelos de datos](docs/modelos-de-datos.md)
- [Seguridad](SECURITY.md)
