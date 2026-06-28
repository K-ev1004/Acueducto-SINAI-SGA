from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from apps.facturas.models import Factura
from apps.facturas.serializers import FacturaSerializer, FacturaDetailSerializer


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
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
def listar_facturas(request):
    estado = request.query_params.get('estado')
    medidor_id = request.query_params.get('medidor_id')
    periodo_id = request.query_params.get('periodo_id')
    mes = request.query_params.get('mes')
    anio = request.query_params.get('anio')

    queryset = Factura.objects.select_related(
        'suscriptor', 'periodo'
    ).all()

    if estado:
        queryset = queryset.filter(estado=estado)
    if medidor_id:
        queryset = queryset.filter(suscriptor__medidor_id=medidor_id)
    if periodo_id:
        queryset = queryset.filter(periodo_id=periodo_id)
    if mes:
        queryset = queryset.filter(periodo__mes=mes)
    if anio:
        queryset = queryset.filter(periodo__anio=anio)

    queryset = queryset.order_by('-fecha_generacion')
    serializer = FacturaSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
def detalle_factura(request, pk):
    try:
        factura = Factura.objects.select_related(
            'suscriptor', 'periodo'
        ).get(pk=pk)
    except Factura.DoesNotExist:
        return Response(
            {'error': 'Factura no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = FacturaDetailSerializer(factura)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cerrar_periodo_y_generar_facturas(request):
    from apps.configuracion.models import ConfiguracionGeneral
    from apps.suscriptores.models import Suscriptor
    from apps.lecturas.models import PeriodoLectura

    periodo_id = request.data.get('periodo_id')
    config = ConfiguracionGeneral.obtener()
    tarifa_por_m3 = float(config.tarifa_m3)
    cargo_aseo = float(config.cargo_aseo)

    if not periodo_id:
        periodo, _ = PeriodoLectura.obtener_o_crear_actual()
        periodo_id = periodo.id
    else:
        try:
            periodo = PeriodoLectura.objects.get(id=periodo_id)
        except PeriodoLectura.DoesNotExist:
            return Response(
                {'error': 'Período no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

    if periodo.estado == 'CERRADO':
        return Response(
            {'error': 'El período ya está cerrado'},
            status=status.HTTP_400_BAD_REQUEST
        )

    puede_cerrar, mensaje = periodo.puede_cerrarse()
    if not puede_cerrar:
        return Response(
            {'error': mensaje},
            status=status.HTTP_400_BAD_REQUEST
        )

    suscriptores_activos = Suscriptor.objects.filter(estado_servicio='ACTIVO')
    facturas_creadas = []
    errores = []

    fecha_vencimiento = _sumar_dias_habiles(timezone.now().date(), config.dias_plazo_pago)

    for suscriptor in suscriptores_activos:
        lectura_actual = suscriptor.lectura_en_periodo(periodo)
        if not lectura_actual:
            errores.append({
                'suscriptor': suscriptor.medidor_id,
                'error': 'Sin lectura en el período'
            })
            continue

        ultimo_lectura = suscriptor.ultima_lectura()
        lectura_anterior_valor = 0
        periodo_anterior = PeriodoLectura.obtener_ultimo_cerrado()
        if periodo_anterior:
            lectura_anterior = suscriptor.lectura_en_periodo(periodo_anterior)
            if lectura_anterior:
                lectura_anterior_valor = lectura_anterior.valor
            elif ultimo_lectura and ultimo_lectura.id != lectura_actual.id:
                lectura_anterior_valor = ultimo_lectura.valor
        elif ultimo_lectura and ultimo_lectura.id != lectura_actual.id:
            lectura_anterior_valor = ultimo_lectura.valor

        consumo = max(0, lectura_actual.valor - lectura_anterior_valor)
        valor_consumo = consumo * tarifa_por_m3
        subsidio = float(suscriptor.subsidio)
        monto_total = max(0, valor_consumo + cargo_aseo - subsidio)

        deuda_acumulada = sum(
            float(f.monto) - float(f.monto_pagado) - float(f.abonos)
            for f in Factura.objects.filter(
                suscriptor=suscriptor,
                estado__in=['PENDIENTE', 'VENCIDA']
            )
        )

        factura = Factura.objects.create(
            suscriptor=suscriptor,
            periodo=periodo,
            monto=monto_total,
            consumo=consumo,
            valor_m3=tarifa_por_m3,
            valor_aseo=cargo_aseo,
            valor_consumo_mes=valor_consumo,
            subsidio_aplicado=subsidio,
            fecha_vencimiento=fecha_vencimiento,
            deuda_acumulada=deuda_acumulada,
            nuevo_saldo=deuda_acumulada + monto_total,
        )
        facturas_creadas.append(factura)

    periodo.estado = 'CERRADO'
    periodo.fecha_cierre = timezone.now()
    periodo.save()

    return Response({
        'mensaje': f'Se generaron {len(facturas_creadas)} facturas de {suscriptores_activos.count()} suscriptores activos',
        'facturas': FacturaSerializer(facturas_creadas, many=True).data,
        'errores': errores,
        'periodo': {
            'id': periodo.id,
            'nombre': str(periodo),
            'mes': periodo.mes,
            'anio': periodo.anio,
        }
    })
