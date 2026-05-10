#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SENA SGA - REINICIO TOTAL DEL SISTEMA
======================================
Borra todo y crea datos de ejemplo nuevos.
USO: python reset_all.py
"""
import os, sys, io

# Forzar UTF-8 en consola (Windows fix)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.contrib.auth.models import User, Group
from api.models import Suscriptor, Lectura, PeriodoLectura, Factura, Pago
from datetime import datetime
import random

# =============================================================================
# 1. BORRAR TODO
# =============================================================================
print("")
print("============================================================")
print("  REINICIO TOTAL DEL SISTEMA SENA SGA")
print("============================================================")
print("")
print("  ATENCION: Este script BORRARA TODOS los datos")
print("  - Usuarios, Grupos, Suscriptores, Lecturas")
print("  - Facturas, Pagos, Periodos")
print("")

respuesta = input("  Confirme escribiendo 'S': ").strip().upper()
if respuesta != 'S':
    print("  Operacion cancelada.")
    sys.exit(0)

# Migraciones
from django.core.management import call_command
call_command('migrate', '--run-syncdb', verbosity=0)

print("")
print("  [1/6] Limpiando datos...")
for model, name in [(Pago, "Pagos"), (Factura, "Facturas"), (Lectura, "Lecturas"),
                     (Suscriptor, "Suscriptores"), (PeriodoLectura, "Periodos"),
                     (User, "Usuarios"), (Group, "Grupos")]:
    count = model.objects.count()
    model.objects.all().delete()
    print(f"       Borrados: {count} {name}")

# =============================================================================
# 2. CREAR GRUPOS
# =============================================================================
print("")
print("  [2/6] Creando grupos...")
admin_group = Group.objects.create(name='Administradores')
print(f"       Administradores (id={admin_group.id})")
lec_group = Group.objects.create(name='Lecturistas')
print(f"       Lecturistas (id={lec_group.id})")

# =============================================================================
# 3. CREAR USUARIOS
# =============================================================================
print("")
print("  [3/6] Creando usuarios...")

CRED = []

sa = User.objects.create_superuser('superadmin', 'super@tudominio.com', 'Super2025!Admin')
CRED.append(('superadmin', 'Super2025!Admin', 'SUPERADMIN'))

a1 = User.objects.create_user('admin', 'admin@tudominio.com', 'Admin2025!Secure')
a1.groups.add(admin_group)
a1.save()
CRED.append(('admin', 'Admin2025!Secure', 'ADMINISTRADOR'))

a2 = User.objects.create_user('admin2', 'admin2@tudominio.com', 'Admin22025!Secure')
a2.groups.add(admin_group)
a2.save()
CRED.append(('admin2', 'Admin22025!Secure', 'ADMINISTRADOR 2'))

l1 = User.objects.create_user('lecturista', 'lecturista@tudominio.com', 'Lect2025!Turista')
l1.groups.add(lec_group)
l1.save()
CRED.append(('lecturista', 'Lect2025!Turista', 'LECTURISTA'))

l2 = User.objects.create_user('lector2', 'lector2@tudominio.com', 'Lect22025!Turista')
l2.groups.add(lec_group)
l2.save()
CRED.append(('lector2', 'Lect22025!Turista', 'LECTURISTA 2'))

for u, p, r in CRED:
    print(f"       {u:15s} -> {r}")

# =============================================================================
# 4. CREAR SUSCRIPTORES
# =============================================================================
print("")
print("  [4/6] Creando suscriptores...")

suscriptores_data = [
    {'nombre': 'Juan Carlos Perez Rodriguez',    'medidor_id': 'MED001', 'direccion': 'Calle 10 #20-30, Barrio Centro',       'telefono': '3001234567'},
    {'nombre': 'Maria Fernanda Garcia Lopez',     'medidor_id': 'MED002', 'direccion': 'Carrera 5 #15-45, Barrio San Jose',    'telefono': '3002345678'},
    {'nombre': 'Carlos Alberto Lopez Martinez',   'medidor_id': 'MED003', 'direccion': 'Avenida 3 #50-12, Barrio La Playa',    'telefono': '3003456789'},
    {'nombre': 'Ana Maria Martinez Torres',        'medidor_id': 'MED004', 'direccion': 'Calle 45 #10-5, Barrio El Prado',       'telefono': '3004567890'},
    {'nombre': 'Pedro Jose Rodriguez Garcia',      'medidor_id': 'MED005', 'direccion': 'Carrera 12 #30-40, Barrio Las Flores', 'telefono': '3005678901'},
    {'nombre': 'Rosa Elena Diaz Suarez',           'medidor_id': 'MED006', 'direccion': 'Calle 22 #8-15, Barrio San Andres',    'telefono': '3006789012'},
    {'nombre': 'Miguel Angel Ramirez Castro',      'medidor_id': 'MED007', 'direccion': 'Carrera 8 #75-20, Barrio Bolivar',    'telefono': '3007890123'},
    {'nombre': 'Luisa Fernanda Moreno Prado',      'medidor_id': 'MED008', 'direccion': 'Calle 33 #45-60, Barrio La Esperanza','telefono': '3008901234'},
    {'nombre': 'Jorge Hernando Vargas Rios',       'medidor_id': 'MED009', 'direccion': 'Av 15 #100-50, Barrio San Jorge',    'telefono': '3009012345'},
    {'nombre': 'Carmen Rosa Ospina Valencia',      'medidor_id': 'MED010', 'direccion': 'Calle 50 #5-80, Barrio Las Palmas',   'telefono': '3010123456'},
    {'nombre': 'Restaurante El Corral',            'medidor_id': 'MED050', 'direccion': 'Carrera 3 #25-10, Zona Comercial',   'telefono': '3210987654'},
    {'nombre': 'Panaderia La Tradicion',           'medidor_id': 'MED051', 'direccion': 'Calle 18 #30-5, Barrio Comercial',    'telefono': '3210987655'},
    {'nombre': 'Hotel Paraiso del Mar',            'medidor_id': 'MED052', 'direccion': 'Av Costanera #200, Zona Hotel',      'telefono': '3109876543'},
]

suscriptores_creados = []
for s_data in suscriptores_data:
    s = Suscriptor.objects.create(**s_data)
    suscriptores_creados.append(s)
    print(f"       {s.medidor_id} - {s.nombre}")

print(f"\n       Total: {len(suscriptores_creados)} suscriptores")

# =============================================================================
# 5. CREAR PERIODOS Y LECTURAS
# =============================================================================
print("")
print("  [5/6] Creando periodos y lecturas...")

meses_nombres = {3:'Marzo',4:'Abril',5:'Mayo',6:'Junio'}
periodos = [PeriodoLectura.objects.create(mes=m, anio=2026) for m in [3,4,5,6]]
for p in periodos:
    print(f"       {meses_nombres[p.mes]} 2026")
    p.estado = 'CERRADO'
    p.fecha_cierre = datetime(2026, p.mes, 10)
    p.save()

lecturas_totales = 0
lecturistas = [l1, l2]

for suscriptor in suscriptores_creados:
    lectura_base = random.randint(100, 5000)
    for i, periodo in enumerate(periodos):
        dias_mes = 28 if periodo.mes == 2 else 30
        # Lectura inicio
        Lectura.objects.create(
            suscriptor=suscriptor, valor=lectura_base + (i * random.randint(3, 25)),
            lecturista=random.choice(lecturistas), fecha_lectura=datetime(2026, periodo.mes, 3)
        )
        ultima = lectura_base + ((i + 1) * random.randint(5, 30))
        # Lectura fin
        Lectura.objects.create(
            suscriptor=suscriptor, valor=ultima,
            lecturista=random.choice(lecturistas), fecha_lectura=datetime(2026, periodo.mes, dias_mes)
        )
        lecturas_totales += 2
        lectura_base = ultima

print(f"\n       Total: {lecturas_totales} lecturas creadas")

# =============================================================================
# 6. GENERAR FACTURAS
# =============================================================================
print("")
print("  [6/6] Generando facturas y pagos...")

TARIFA = 1500
facturas_totales = 0

for periodo in periodos:
    for suscriptor in suscriptores_creados:
        lecturas = Lectura.objects.filter(
            suscriptor=suscriptor,
            fecha_lectura__month=periodo.mes,
            fecha_lectura__year=periodo.anio
        ).order_by('fecha_lectura')
        if lecturas.count() >= 2:
            consumo = max(1, int(lecturas.last().valor - lecturas.first().valor))
            monto = consumo * TARIFA
            Factura.objects.create(
                suscriptor=suscriptor, periodo=periodo,
                monto=monto, consumo=consumo, estado='PENDIENTE'
            )
            facturas_totales += 1

print(f"       Facturas generadas: {facturas_totales}")

# Pagos y abonos
pagos, abonos = 0, 0
for idx, suscriptor in enumerate(suscriptores_creados):
    facturas_pend = Factura.objects.filter(suscriptor=suscriptor, estado='PENDIENTE')
    if not facturas_pend.exists():
        continue
    if idx % 5 == 0:
        for f in facturas_pend:
            Pago.objects.create(suscriptor=suscriptor, monto=f.monto, tipo='PAGO',
                metodo_pago='EFECTIVO', comentario='Pago completo en oficina', registrado_por=a1)
            f.monto_pagado = f.monto; f.estado = 'PAGADA'; f.save()
            pagos += 1
    elif idx % 5 == 1:
        f = facturas_pend.first()
        ab = int(f.monto * 0.5)
        Pago.objects.create(suscriptor=suscriptor, monto=ab, tipo='ABONO',
            metodo_pago='EFECTIVO', comentario='Abono parcial', registrado_por=l1)
        f.abonos = ab; f.save()
        abonos += 1
        suscriptor.mes_deuda_continua = min(3, suscriptor.mes_deuda_continua + 1)
        if suscriptor.mes_deuda_continua >= 3:
            suscriptor.estado_servicio = 'CORTADO'
        suscriptor.save()
    elif idx % 5 == 2:
        suscriptor.mes_deuda_continua = 3
        suscriptor.estado_servicio = 'CORTADO'
        suscriptor.save()
    elif idx % 5 == 3:
        f = facturas_pend.first()
        ab = int(f.monto * 0.3)
        Pago.objects.create(suscriptor=suscriptor, monto=ab, tipo='ABONO',
            metodo_pago='TRANSFERENCIA', comentario='Transferencia bancaria', registrado_por=a1)
        f.abonos = ab; f.save()
        abonos += 1
    else:
        pf = facturas_pend.first()
        Pago.objects.create(suscriptor=suscriptor, monto=pf.monto, tipo='PAGO',
            metodo_pago='EFECTIVO', comentario='Pago de factura pendiente', registrado_por=l2)
        pf.monto_pagado = pf.monto; pf.estado = 'PAGADA'; pf.save()
        pagos += 1

# =============================================================================
# RESUMEN FINAL
# =============================================================================
print("")
print("=" * 60)
print("  RESUMEN DEL SISTEMA")
print("=" * 60)

stats = [
    ("Usuarios", User.objects.count()),
    ("  SuperAdmins", User.objects.filter(is_superuser=True).count()),
    ("  Administradores", User.objects.filter(groups__name='Administradores').count()),
    ("  Lecturistas", User.objects.filter(groups__name='Lecturistas').count()),
    ("", ""),
    ("Suscriptores", Suscriptor.objects.count()),
    ("  Activos", Suscriptor.objects.filter(estado_servicio='ACTIVO').count()),
    ("  Cortados", Suscriptor.objects.filter(estado_servicio='CORTADO').count()),
    ("", ""),
    ("Lecturas", Lectura.objects.count()),
    ("Periodos", PeriodoLectura.objects.count()),
    ("Facturas", Factura.objects.count()),
    ("  Pagadas", Factura.objects.filter(estado='PAGADA').count()),
    ("  Pendientes", Factura.objects.filter(estado='PENDIENTE').count()),
    ("Pagos", Pago.objects.count()),
    ("Deuda pendiente", f"${sum(f.saldo_pendiente for f in Factura.objects.filter(estado='PENDIENTE')):,.0f}"),
]

for label, valor in stats:
    if valor == "":
        print()
    else:
        print(f"  {label:30s}: {valor}")

print()
print("=" * 60)
print("  SISTEMA REINICIADO EXITOSAMENTE")
print("=" * 60)

print()
print("  CREDENCIALES DE ACCESO:")
print()
print(f"  {'Usuario':<15} {'Contraseña':<25} {'Rol'}")
print(f"  {'~'*15} {'~'*25} {'~'*30}")
for user, pwd, rol in CRED:
    print(f"  {user:<15} {pwd:<25} {rol}")

print()
print("  URLS:")
print("  /api/          -> Raiz API")
print("  /api/login/    -> Login JWT")
print("  /api/docs/     -> Documentacion Swagger")
print("  /admin/        -> Panel Admin Django")
print("  /dashboard/    -> Dashboard del sistema")
print("  Frontend: http://localhost:3000")
print()