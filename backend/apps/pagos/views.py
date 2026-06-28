from decimal import Decimal
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Max, Q
from datetime import date, timedelta

from .models import Pago
from .serializers import PagoSerializer


def _sumar_dias_habiles(fecha_inicio, dias):
    contador = 0
    fecha = fecha_inicio
    while contador < dias:
        fecha += timedelta(days=1)
        if fecha.weekday() < 5:
            contador += 1
    return fecha


class EsLecturistaOAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.groups.filter(
            name__in=['Administradores', 'Lecturistas']
        ).exists()


class EsSuperAdminOAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.groups.filter(name='Administradores').exists()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_pagos(request):
    medidor_id = request.query_params.get('medidor_id')
    mes = request.query_params.get('mes')
    anio = request.query_params.get('anio')

    queryset = Pago.objects.select_related(
        'suscriptor', 'registrado_por'
    ).all()

    if medidor_id:
        queryset = queryset.filter(suscriptor__medidor_id=medidor_id)
    if mes:
        queryset = queryset.filter(fecha_pago__month=mes)
    if anio:
        queryset = queryset.filter(fecha_pago__year=anio)

    queryset = queryset.order_by('-fecha_pago')
    serializer = PagoSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
@transaction.atomic
def registrar_pago_o_abono(request):
    from apps.suscriptores.models import Suscriptor
    from apps.facturas.models import Factura

    medidor_id = request.data.get('medidor_id')
    monto = request.data.get('monto')
    tipo = request.data.get('tipo', 'PAGO')
    metodo_pago = request.data.get('metodo_pago', 'EFECTIVO')
    comentario = request.data.get('comentario', '')
    factura_id = request.data.get('factura_id')

    if not medidor_id or monto is None:
        return Response(
            {'error': 'medidor_id y monto son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if tipo not in ['PAGO', 'ABONO']:
        return Response(
            {'error': 'tipo debe ser PAGO o ABONO'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        monto = float(monto)
        if monto <= 0:
            return Response(
                {'error': 'El monto debe ser positivo'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except (ValueError, TypeError):
        return Response(
            {'error': 'El monto debe ser numérico'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        suscriptor = Suscriptor.objects.get(medidor_id=medidor_id)
    except Suscriptor.DoesNotExist:
        return Response(
            {'error': 'Suscriptor no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )

    monto_dec = Decimal(str(monto))

    pago = Pago.objects.create(
        suscriptor=suscriptor,
        monto=monto_dec,
        tipo=tipo,
        metodo_pago=metodo_pago,
        comentario=comentario,
        registrado_por=request.user
    )

    factura = None
    if factura_id:
        try:
            factura = Factura.objects.get(id=factura_id, suscriptor=suscriptor)
        except Factura.DoesNotExist:
            pass

    if factura:
        if tipo == 'PAGO':
            factura.monto_pagado += monto_dec
            factura.total_pagado = factura.monto_pagado
            factura.fecha_pago = timezone.now().date()
            monto_factura = factura.monto
            if factura.monto_pagado >= monto_factura:
                factura.estado = 'PAGADA'
                sobrante_pago = factura.monto_pagado - monto_factura
                if sobrante_pago > 0:
                    factura.abonos += sobrante_pago
                suscriptor.mes_deuda_continua = 0
                suscriptor.save()
            factura.nuevo_saldo = max(0, monto_factura - factura.monto_pagado - factura.abonos)
            factura.save()
        else:
            factura.abonos += monto_dec
            factura.nuevo_saldo = max(0, factura.monto - factura.monto_pagado - factura.abonos)
            factura.save()

        pago.factura = factura
        pago.save()
    else:
        _aplicar_pago_a_facturas(suscriptor, monto_dec, tipo)

    return Response({
        'mensaje': f"{'Pago' if tipo == 'PAGO' else 'Abono'} registrado",
        'pago': PagoSerializer(pago).data
    }, status=status.HTTP_201_CREATED)


def _aplicar_pago_a_facturas(suscriptor, monto, tipo):
    from apps.facturas.models import Factura

    facturas_pendientes = Factura.objects.filter(
        suscriptor=suscriptor,
        estado__in=['PENDIENTE', 'VENCIDA']
    ).order_by('fecha_generacion')

    monto_restante = monto
    abono_futuro = Decimal('0')

    for factura in facturas_pendientes:
        if monto_restante <= 0:
            break

        saldo = factura.monto - factura.monto_pagado - factura.abonos

        if tipo == 'PAGO':
            if monto_restante >= saldo:
                factura.monto_pagado = factura.monto
                factura.total_pagado = factura.monto_pagado
                factura.estado = 'PAGADA'
                factura.fecha_pago = timezone.now().date()
                monto_restante -= saldo
                suscriptor.mes_deuda_continua = 0
            else:
                factura.monto_pagado += monto_restante
                factura.total_pagado = factura.monto_pagado
                factura.fecha_pago = timezone.now().date()
                monto_restante = Decimal('0')
        else:
            factura.abonos += monto_restante
            monto_restante = Decimal('0')

        factura.nuevo_saldo = max(Decimal('0'), factura.monto - factura.monto_pagado - factura.abonos)
        factura.save()

    if monto_restante > 0 and tipo == 'PAGO':
        abono_futuro = monto_restante

    if abono_futuro > 0:
        ultima_factura = facturas_pendientes.last()
        if ultima_factura:
            ultima_factura.abonos += abono_futuro
            ultima_factura.save()

    suscriptor.save()


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsSuperAdminOAdmin])
def planilla_cobro(request):
    from apps.facturas.models import Factura
    from apps.lecturas.models import PeriodoLectura

    periodo_id = request.query_params.get('periodo_id')

    facturas = Factura.objects.select_related('suscriptor', 'periodo').filter(
        estado__in=['PENDIENTE', 'VENCIDA']
    )

    if periodo_id:
        facturas = facturas.filter(periodo_id=periodo_id)

    facturas = facturas.order_by('suscriptor__nombre')

    data = []
    for f in facturas:
        pendiente_facturas = Factura.objects.filter(
            suscriptor=f.suscriptor,
            estado__in=['PENDIENTE', 'VENCIDA']
        ).order_by('fecha_generacion')

        data.append({
            'factura_id': f.id,
            'numero_factura': f.numero_factura,
            'suscriptor_id': f.suscriptor.id,
            'suscriptor': f.suscriptor.nombre,
            'medidor_id': f.suscriptor.medidor_id,
            'direccion': f.suscriptor.direccion,
            'periodo': str(f.periodo) if f.periodo else '-',
            'consumo': f.consumo,
            'monto': float(f.monto),
            'monto_pagado': float(f.monto_pagado),
            'abonos': float(f.abonos),
            'saldo': float(f.monto) - float(f.monto_pagado) - float(f.abonos),
            'deuda_acumulada': float(f.deuda_acumulada),
            'nuevo_saldo': float(f.nuevo_saldo),
            'estado': f.estado,
            'fecha_vencimiento': f.fecha_vencimiento,
            'dias_vencida': (timezone.now().date() - f.fecha_vencimiento).days if f.fecha_vencimiento and f.fecha_vencimiento < timezone.now().date() else 0,
            'email': f.suscriptor.email,
            'tiene_deuda_anterior': float(f.deuda_acumulada) > 0,
            'abono_disponible': float(f.abonos) > 0,
        })

    return Response({
        'periodos_disponibles': [
            {'id': p.id, 'nombre': str(p)}
            for p in PeriodoLectura.objects.filter(estado='CERRADO').order_by('-anio', '-mes')
        ],
        'facturas': data,
        'total_facturas': len(data),
        'total_saldo': sum(d['saldo'] for d in data),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
@transaction.atomic
def pago_rapido(request):
    from apps.facturas.models import Factura

    factura_id = request.data.get('factura_id')
    monto = request.data.get('monto')
    metodo_pago = request.data.get('metodo_pago', 'EFECTIVO')
    tipo_pago = request.data.get('tipo', '')

    if not factura_id or monto is None:
        return Response(
            {'error': 'factura_id y monto son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        monto = float(monto)
        if monto <= 0:
            return Response(
                {'error': 'El monto debe ser positivo'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except (ValueError, TypeError):
        return Response(
            {'error': 'El monto debe ser numérico'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        factura = Factura.objects.select_related('suscriptor').get(id=factura_id)
    except Factura.DoesNotExist:
        return Response(
            {'error': 'Factura no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )

    suscriptor = factura.suscriptor
    saldo = float(factura.monto) - float(factura.monto_pagado) - float(factura.abonos)
    monto_dec = Decimal(str(monto))

    if tipo_pago == 'ABONO':
        tipo = 'ABONO'
        factura.abonos += monto_dec
    else:
        tipo = 'PAGO'
        if monto >= saldo:
            factura.monto_pagado = factura.monto
            factura.estado = 'PAGADA'
            factura.fecha_pago = timezone.now().date()
            sobrante_dec = monto_dec - Decimal(str(saldo))
            if sobrante_dec > 0:
                factura.abonos += sobrante_dec
            suscriptor.mes_deuda_continua = 0
            suscriptor.save()
        else:
            factura.monto_pagado += monto_dec
            factura.fecha_pago = timezone.now().date()

    factura.total_pagado = factura.monto_pagado
    factura.nuevo_saldo = max(Decimal('0'), factura.monto - factura.monto_pagado - factura.abonos)
    factura.save()

    pago = Pago.objects.create(
        suscriptor=suscriptor,
        factura=factura,
        monto=monto_dec,
        tipo=tipo,
        metodo_pago=metodo_pago,
        registrado_por=request.user,
        comentario=f'Pago desde planilla - Factura {factura.numero_factura}',
    )

    return Response({
        'mensaje': f'Pago registrado en factura {factura.numero_factura}',
        'pago': PagoSerializer(pago).data,
        'factura': {
            'id': factura.id,
            'estado': factura.estado,
            'saldo_restante': factura.saldo_pendiente,
        }
    }, status=status.HTTP_201_CREATED)
