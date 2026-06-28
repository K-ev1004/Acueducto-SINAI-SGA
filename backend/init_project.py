#!/usr/bin/env python
"""
SINAÍ SGA - Script de Inicialización
=====================================
Este script configura el proyecto con usuarios de prueba y datos iniciales.
USO: python init_project.py
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.contrib.auth.models import User, Group
from django.core.management import call_command
from apps.suscriptores.models import Suscriptor
from apps.lecturas.models import PeriodoLectura, Lectura
from apps.facturas.models import Factura
from apps.pagos.models import Pago
from datetime import datetime

# =============================================================================
# 1. LIMPIAR DATOS EXISTENTES (opcional - comentar si no se desea)
# =============================================================================
print("=" * 60)
print("SINAÍ SGA - INICIALIZACIÓN DEL PROYECTO")
print("=" * 60)

response = input("\n⚠️  ¿Deseas limpiar TODOS los datos existentes? (s/n): ")
if response.lower() == 's':
    Pago.objects.all().delete()
    Factura.objects.all().delete()
    Lectura.objects.all().delete()
    Suscriptor.objects.all().delete()
    PeriodoLectura.objects.all().delete()
    print("✅ Datos limpiados.")
else:
    print("⏭️  Datos existentes conservados.")

# =============================================================================
# 2. CREAR GRUPOS
# =============================================================================
print("\n[1/5] Creando grupos de seguridad...")
admin_group, _ = Group.objects.get_or_create(name='Administradores')
lecturista_group, _ = Group.objects.get_or_create(name='Lecturistas')
print(f"  ✅ Grupo 'Administradores': id={admin_group.id}")
print(f"  ✅ Grupo 'Lecturistas': id={lecturista_group.id}")

# =============================================================================
# 3. CREAR USUARIOS
# =============================================================================
print("\n[2/5] Creando usuarios...")

# Crear superadmin
if not User.objects.filter(username='superadmin').exists():
    sa = User.objects.create_superuser('superadmin', 'super@tudominio.com', 'SuperAdmin123!')
    print(f"  ✅ superadmin (SuperAdmin)")
else:
    print(f"  ⚠️ superadmin ya existe")

# Crear admin
if not User.objects.filter(username='admin').exists():
    admin = User.objects.create_user('admin', 'admin@tudominio.com', 'Admin123!')
    admin.groups.add(admin_group)
    print(f"  ✅ admin (Administrador)")
else:
    print(f"  ⚠️ admin ya existe")

# Crear segundo admin
if not User.objects.filter(username='admin2').exists():
    admin2 = User.objects.create_user('admin2', 'admin2@tudominio.com', 'Admin2123!')
    admin2.groups.add(admin_group)
    print(f"  ✅ admin2 (Administrador)")
else:
    print(f"  ⚠️ admin2 ya existe")

# Crear lecturista
if not User.objects.filter(username='lecturista').exists():
    lec = User.objects.create_user('lecturista', 'lecturista@tudominio.com', 'Lecturista123!')
    lec.groups.add(lecturista_group)
    print(f"  ✅ lecturista (Lecturista)")
else:
    print(f"  ⚠️ lecturista ya existe")

# Crear segundo lecturista
if not User.objects.filter(username='lecturista2').exists():
    lec2 = User.objects.create_user('lecturista2', 'lecturista2@tudominio.com', 'Lecturista2123!')
    lec2.groups.add(lecturista_group)
    print(f"  ✅ lecturista2 (Lecturista)")
else:
    print(f"  ⚠️ lecturista2 ya existe")

# =============================================================================
# 4. CREAR SUSCRIPTORES DE PRUEBA
# =============================================================================
print("\n[3/5] Creando suscriptores de prueba...")

suscriptores_data = [
    {'nombre': 'Juan Pérez', 'medidor_id': 'MED001', 'direccion': 'Calle 10 #20-30'},
    {'nombre': 'María García', 'medidor_id': 'MED002', 'direccion': 'Carrera 5 #15-45'},
    {'nombre': 'Carlos López', 'medidor_id': 'MED003', 'direccion': 'Avenida 3 #50-12'},
    {'nombre': 'Ana Martínez', 'medidor_id': 'MED004', 'direccion': 'Calle 45 #10-5'},
    {'nombre': 'Pedro Rodríguez', 'medidor_id': 'MED005', 'direccion': 'Carrera 12 #30-40'},
]

for s_data in suscriptores_data:
    s, created = Suscriptor.objects.get_or_create(
        medidor_id=s_data['medidor_id'],
        defaults=s_data
    )
    status = "✅ Creado" if created else "⚠️ Existente"
    print(f"  {status}: {s.nombre} ({s.medidor_id})")

# =============================================================================
# 5. CREAR PERÍODOS Y LECTURAS DE PRUEBA
# =============================================================================
print("\n[4/5] Creando períodos y lecturas de prueba...")

# Períodos
periodos = []
for mes in [3, 4, 5]:
    p, _ = PeriodoLectura.objects.get_or_create(mes=mes, anio=2026)
    periodos.append(p)
    print(f"  ✅ Período: {p}")

# Lecturas de prueba
import random
lecturas_count = 0
for suscriptor in Suscriptor.objects.all():
    for i, periodo in enumerate(periodos):
        mes = periodo.mes
        anio = periodo.anio
        
        # Crear lectura inicial y final para cada período
        base_valor = random.randint(100, 5000)
        
        # Lectura inicio del mes (día 1)
        lectura_inicio = Lectura.objects.filter(
            suscriptor=suscriptor,
            fecha_lectura__month=mes,
            fecha_lectura__year=anio
        ).first()
        
        if not lectura_inicio:
            Lectura.objects.create(
                suscriptor=suscriptor,
                valor=base_valor,
                lecturista=User.objects.filter(groups__name='Lecturistas').first()
            )
            lecturas_count += 1
            
            # Lectura fin del mes (día 28-30)
            Lectura.objects.create(
                suscriptor=suscriptor,
                valor=base_valor + random.randint(5, 50),
                lecturista=User.objects.filter(groups__name='Lecturistas').first()
            )
            lecturas_count += 1

print(f"  ✅ Se crearon {lecturas_count} lecturas de prueba")

# =============================================================================
# 6. GENERAR FACTURAS DE PRUEBA
# =============================================================================
print("\n[5/5] Generando facturas de prueba...")

for periodo in periodos:
    if periodo.estado == 'ABIERTO':
        periodo.estado = 'CERRADO'
        periodo.fecha_cierre = datetime.now()
        periodo.save()
    
    # Generar facturas
    suscriptores = Suscriptor.objects.all()
    for suscriptor in suscriptores:
        lecturas = Lectura.objects.filter(
            suscriptor=suscriptor,
            fecha_lectura__month=periodo.mes,
            fecha_lectura__year=periodo.anio
        ).order_by('fecha_lectura')
        
        if lecturas.count() >= 2:
            primera = lecturas.first()
            ultima = lecturas.last()
            consumo = max(0, ultima.valor - primera.valor)
            monto = consumo * 1500
            
            Factura.objects.get_or_create(
                suscriptor=suscriptor,
                periodo=periodo,
                defaults={
                    'monto': monto,
                    'consumo': consumo,
                    'estado': 'PENDIENTE'
                }
            )

print(f"  ✅ Facturas generadas para {len(periodos)} períodos")

# =============================================================================
# RESUMEN
# =============================================================================
print("\n" + "=" * 60)
print("✅ INICIALIZACIÓN COMPLETADA")
print("=" * 60)
print(f"""
USUARIOS CREADOS:
  superadmin  / SuperAdmin     / SuperAdmin123!
  admin       / Administrador  / Admin123!
  admin2      / Administrador  / Admin2123!
  lecturista  / Lecturista     / Lecturista123!
  lecturista2 / Lecturista     / Lecturista2123!

PENDIENTE:
  - Crear usuario con datos reales de lecturista (usuario + contraseña segura)
  - Registrar lecturas reales de los medidores
  - Actualizar .env con credenciales de producción
  - Configurar HTTPS en el VPS
  - Configurar dominio y ALLOWED_HOSTS
""")