from django.core.management.base import BaseCommand
from datetime import datetime, date
from decimal import Decimal
import openpyxl
from apps.suscriptores.models import Suscriptor
from apps.lecturas.models import PeriodoLectura, Lectura
from apps.facturas.models import Factura
from apps.pagos.models import Pago
from apps.configuracion.models import ConfiguracionGeneral


MESES = {
    'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4,
    'MAYO': 5, 'JUNIO': 6, 'JULIO': 7, 'AGOSTO': 8,
    'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12,
}

EXCEL_PATH = r'C:\Users\rojas\Escritorio\acueducto\sinai-sga-project\USUARIOS_Y_FACTURACIÓN.xlsm'


def _numero(v):
    if v is None:
        return 0
    if isinstance(v, (int, float)):
        return v
    if isinstance(v, str):
        v = v.strip().replace(',', '')
        try:
            return float(v)
        except ValueError:
            return 0
    return 0


def _dec(v):
    return Decimal(str(round(_numero(v), 2)))


def _sumar_dias_habiles(fecha, dias):
    d = fecha
    contados = 0
    while contados < dias:
        d += __import__('datetime').timedelta(days=1)
        if d.weekday() < 5:
            contados += 1
    return d


class Command(BaseCommand):
    help = 'Migra datos desde Excel USUARIOS_Y_FACTURACION.xlsm'

    def handle(self, *args, **options):
        self.stdout.write('=== INICIANDO MIGRACION ===')

        wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True, data_only=True)
        ws = wb['Actualzar para factura']

        rows = list(ws.iter_rows(min_row=3, values_only=True))
        data_rows = [r for r in rows if r[1] is not None and not str(r[0] or '').strip().startswith('TOTAL')]

        self.stdout.write(f'Filas de datos: {len(data_rows)}')

        mes_str = str(data_rows[0][8]).strip().upper() if data_rows[0][8] else 'AGOSTO'
        fecha_fact = data_rows[0][7]
        anio = fecha_fact.year if isinstance(fecha_fact, datetime) else 2025
        mes = MESES.get(mes_str, 8)
        self.stdout.write(f'Periodo: {mes_str} {anio}')

        self.stdout.write('\n--- SUSCRIPTORES ---')
        creados = 0
        for row in data_rows:
            mid = str(int(_numero(row[3]))) if row[3] and _numero(row[3]) > 0 else ''
            nombre = str(row[1]).strip() if row[1] else ''
            doc = str(int(_numero(row[2]))) if row[2] and _numero(row[2]) > 0 else ''
            dirr = str(row[4]).strip() if row[4] else ''

            if not mid or not nombre:
                continue
            if Suscriptor.objects.filter(medidor_id=mid).exists():
                continue

            Suscriptor.objects.create(
                nombre=nombre, medidor_id=mid, documento=doc, direccion=dirr, estado_servicio='ACTIVO',
            )
            creados += 1
            self.stdout.write(f'  {nombre} ({mid})')

        self.stdout.write(f'Creados: {creados}')

        self.stdout.write('\n--- PERIODO ---')
        periodo, _ = PeriodoLectura.objects.get_or_create(
            mes=mes, anio=anio, defaults={'estado': 'CERRADO'}
        )
        self.stdout.write(str(periodo))

        self.stdout.write('\n--- LECTURAS Y FACTURAS ---')
        lecturas = facturas = pagos = 0

        for row in data_rows:
            mid = str(int(_numero(row[3]))) if row[3] else ''
            if not mid:
                continue
            try:
                suscriptor = Suscriptor.objects.get(medidor_id=mid)
            except Suscriptor.DoesNotExist:
                continue

            lectura_actual = _numero(row[10])
            consumo = round(_numero(row[11]), 2)
            valor_m3 = _dec(row[12])
            valor_consumo = _dec(row[13])
            subsidio = _dec(row[14])
            aseo = _dec(row[15])
            total = _dec(row[16])
            abono = _dec(row[17])
            recibido = _dec(row[18])
            saldo = _dec(row[19])
            deuda_acum = _dec(row[5])

            ffact = row[7]
            fdate = ffact.date() if isinstance(ffact, datetime) else date(anio, 1, 1)

            if lectura_actual > 0:
                Lectura.objects.create(suscriptor=suscriptor, valor=lectura_actual, periodo=periodo)
                lecturas += 1

            factura = Factura.objects.create(
                suscriptor=suscriptor,
                periodo=periodo,
                monto=total,
                consumo=consumo,
                valor_m3=valor_m3,
                valor_aseo=aseo,
                valor_consumo_mes=valor_consumo,
                subsidio_aplicado=subsidio,
                abono_deuda=abono,
                deuda_acumulada=deuda_acum,
                estado='PENDIENTE' if saldo > 0 else 'PAGADA',
                fecha_generacion=fdate,
                fecha_vencimiento=_sumar_dias_habiles(fdate, 15),
                fecha_pago=fdate if recibido > 0 else None,
                monto_pagado=recibido,
                total_pagado=recibido,
                nuevo_saldo=saldo if saldo > 0 else _dec(0),
            )
            facturas += 1

            if recibido > 0:
                Pago.objects.create(
                    suscriptor=suscriptor, factura=factura, monto=recibido, tipo='PAGO',
                    metodo_pago='EFECTIVO', comentario='Migracion desde Excel',
                )
                pagos += 1

        self.stdout.write(f'Lecturas: {lecturas}, Facturas: {facturas}, Pagos: {pagos}')

        for s in Suscriptor.objects.all():
            s.mes_deuda_continua = Factura.objects.filter(suscriptor=s, estado__in=['PENDIENTE', 'VENCIDA']).count()
            s.save()

        self.stdout.write('\n=== RESUMEN ===')
        self.stdout.write(f'Suscriptores: {Suscriptor.objects.count()}')
        self.stdout.write(f'Periodos: {PeriodoLectura.objects.count()}')
        self.stdout.write(f'Lecturas: {Lectura.objects.count()}')
        self.stdout.write(f'Facturas: {Factura.objects.count()}')
        self.stdout.write(f'Pagos: {Pago.objects.count()}')
        self.stdout.write('=== MIGRACION COMPLETADA ===')
