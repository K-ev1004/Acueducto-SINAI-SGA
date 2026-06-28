from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Max
import calendar


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    from apps.suscriptores.models import Suscriptor
    from apps.facturas.models import Factura
    from apps.pagos.models import Pago
    from apps.lecturas.models import PeriodoLectura, Lectura

    total_suscriptores = Suscriptor.objects.count()
    activos = Suscriptor.objects.filter(estado_servicio='ACTIVO').count()
    cortados = Suscriptor.objects.filter(estado_servicio='CORTADO').count()

    hoy = timezone.now().date()
    mes_actual = hoy.month
    anio_actual = hoy.year

    facturas_pendientes = Factura.objects.filter(estado='PENDIENTE').count()
    facturas_pagadas = Factura.objects.filter(estado='PAGADA').count()
    facturas_vencidas = Factura.objects.filter(estado='VENCIDA').count()

    total_deuda = Factura.objects.filter(
        estado__in=['PENDIENTE', 'VENCIDA']
    ).aggregate(
        total=Sum('monto') - Sum('monto_pagado') - Sum('abonos')
    )['total'] or 0

    total_facturas = Factura.objects.count()
    tasa_cobro = round((facturas_pagadas / total_facturas * 100), 1) if total_facturas > 0 else 0

    recaudo_mes = Pago.objects.filter(
        fecha_pago__month=mes_actual,
        fecha_pago__year=anio_actual
    ).aggregate(total=Sum('monto'))['total'] or 0

    recaudo_mes_anterior = Pago.objects.filter(
        fecha_pago__month=mes_actual - 1 if mes_actual > 1 else 12,
        fecha_pago__year=anio_actual if mes_actual > 1 else anio_actual - 1
    ).aggregate(total=Sum('monto'))['total'] or 0

    consumo_total = Factura.objects.filter(
        periodo__mes=mes_actual, periodo__anio=anio_actual
    ).aggregate(total=Sum('consumo'))['total'] or 0
    consumo_promedio = round(consumo_total / max(1, activos), 1)

    top_deudores = Suscriptor.objects.filter(
        facturas__estado__in=['PENDIENTE', 'VENCIDA']
    ).annotate(
        total_deuda_sus=Sum('facturas__monto') - Sum('facturas__monto_pagado') - Sum('facturas__abonos')
    ).filter(total_deuda_sus__gt=0).order_by('-total_deuda_sus')[:5]

    periodo_actual = PeriodoLectura.objects.filter(estado='ABIERTO').order_by('-anio', '-mes').first()
    lecturas_pendientes = 0
    periodo_info = None
    if periodo_actual:
        total_activos = Suscriptor.objects.filter(estado_servicio='ACTIVO').count()
        lecturas_tomadas = periodo_actual.lecturas.count()
        lecturas_pendientes = max(0, total_activos - lecturas_tomadas)
        periodo_info = {
            'id': periodo_actual.id,
            'nombre': str(periodo_actual),
            'porcentaje': periodo_actual.porcentaje_lecturas(),
            'lecturas_tomadas': lecturas_tomadas,
            'total_activos': total_activos,
            'puede_cerrarse': periodo_actual.puede_cerrarse()[0],
        }

    historial_mensual = []
    for i in range(5, -1, -1):
        m = mes_actual - i
        a = anio_actual
        while m <= 0:
            m += 12
            a -= 1
        nombre_mes = calendar.month_abbr[m]

        recaudo = Pago.objects.filter(
            fecha_pago__month=m, fecha_pago__year=a
        ).aggregate(total=Sum('monto'))['total'] or 0

        generate = Factura.objects.filter(
            periodo__mes=m, periodo__anio=a
        ).count()
        pagadas_mes = Factura.objects.filter(
            periodo__mes=m, periodo__anio=a, estado='PAGADA'
        ).count()
        consumo_mes = Factura.objects.filter(
            periodo__mes=m, periodo__anio=a
        ).aggregate(total=Sum('consumo'))['total'] or 0
        monto_mes = Factura.objects.filter(
            periodo__mes=m, periodo__anio=a
        ).aggregate(total=Sum('monto'))['total'] or 0

        historial_mensual.append({
            'mes': nombre_mes,
            'anio': a,
            'recaudo': float(recaudo),
            'facturas_generadas': generate,
            'facturas_pagadas': pagadas_mes,
            'consumo_total': float(consumo_mes),
            'monto_total': float(monto_mes),
        })

    ultima_lectura = Lectura.objects.aggregate(fecha=Max('fecha_lectura'))['fecha']
    lectura_count = Lectura.objects.count()
    pago_count = Pago.objects.count()

    return Response({
        'total_suscriptores': total_suscriptores,
        'suscriptores_activos': activos,
        'suscriptores_cortados': cortados,
        'facturas_pendientes': facturas_pendientes,
        'facturas_pagadas': facturas_pagadas,
        'facturas_vencidas': facturas_vencidas,
        'total_deuda': float(total_deuda),
        'tasa_cobro': tasa_cobro,
        'recaudo_mes': float(recaudo_mes),
        'recaudo_mes_anterior': float(recaudo_mes_anterior),
        'consumo_promedio': consumo_promedio,
        'top_deudores': [
            {
                'nombre': s.nombre,
                'medidor_id': s.medidor_id,
                'deuda': float(s.total_deuda_sus)
            } for s in top_deudores
        ],
        'periodo_actual': periodo_info,
        'lecturas_pendientes': lecturas_pendientes,
        'historial_mensual': historial_mensual,
        'ultima_lectura': ultima_lectura,
        'total_lecturas': lectura_count,
        'total_pagos': pago_count,
    })
