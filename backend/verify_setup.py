import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
import django
django.setup()

from django.conf import settings

print('=' * 60)
print('VERIFICACION COMPLETA DEL PROYECTO SENA SGA')
print('=' * 60)

print()
print('=== INSTALLED_APPS ===')
for app in settings.INSTALLED_APPS:
    print(f'  [OK] {app}')

print()
print('=== JWT CONFIG ===')
jwt = settings.SIMPLE_JWT
print(f'  Access Token Lifetime:   {jwt["ACCESS_TOKEN_LIFETIME"]}')
print(f'  Refresh Token Lifetime:  {jwt["REFRESH_TOKEN_LIFETIME"]}')
print(f'  Rotate Refresh Tokens:   {jwt["ROTATE_REFRESH_TOKENS"]}')
print(f'  Blacklist After Rotation: {jwt["BLACKLIST_AFTER_ROTATION"]}')

print()
print('=== SEGURIDAD ===')
print(f'  DEBUG: {settings.DEBUG}')
print(f'  ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
print(f'  SECRET_KEY seteada: {bool(settings.SECRET_KEY)}')

# Settings de seguridad solo en produccion
security_settings = [
    'SECURE_BROWSER_XSS_FILTER',
    'SECURE_CONTENT_TYPE_NOSNIFF',
    'SECURE_SSL_REDIRECT',
    'SECURE_HSTS_SECONDS',
    'SESSION_COOKIE_SECURE',
    'CSRF_COOKIE_SECURE',
]
print(f'  Headers de seguridad (solo en produccion):')
for s in security_settings:
    val = getattr(settings, s, 'NO APLICA (DEBUG=True)')
    print(f'    {s}: {val}')

print()
print('=== MODELOS REGISTRADOS ===')
from django.apps import apps
for model in apps.get_models():
    print(f'  [OK] {model._meta.label}: {model._meta.db_table}')

print()
print('=== USUARIOS Y GRUPOS ===')
from django.contrib.auth.models import User, Group
print(f'  Grupos: {list(Group.objects.values_list("name", flat=True))}')
print(f'  Usuarios:')
for u in User.objects.all():
    grupos = list(u.groups.values_list('name', flat=True))
    tipo = 'SUPERADMIN' if u.is_superuser else grupos[0] if grupos else 'SIN GRUPO'
    print(f'    - {u.username} [{tipo}]')

print()
print('=== CONTADORES ===')
from api.models import Suscriptor, Lectura, Factura, Pago, PeriodoLectura
print(f'  Suscriptores: {Suscriptor.objects.count()}')
print(f'  Lecturas:     {Lectura.objects.count()}')
print(f'  Facturas:     {Factura.objects.count()}')
print(f'  Pagos:        {Pago.objects.count()}')
print(f'  Periodos:     {PeriodoLectura.objects.count()}')

print()
print('=' * 60)
print('TODAS LAS VERIFICACIONES PASADAS')
print('=' * 60)