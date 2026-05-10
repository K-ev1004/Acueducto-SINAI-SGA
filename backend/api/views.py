from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Max

from .models import Suscriptor, Lectura, PeriodoLectura, Factura, Pago
from .serializers import (
    SuscriptorSerializer, SuscriptorDetailSerializer,
    LecturaSerializer, FacturaSerializer, PagoSerializer,
    PeriodoLecturaSerializer, DashboardSerializer
)


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


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
def gestionar_suscriptores(request):
    if request.method == 'GET':
        suscriptores = Suscriptor.objects.all()
        serializer = SuscriptorSerializer(suscriptores, many=True)
        return Response(serializer.data)

    nombre = request.data.get('nombre')
    medidor_id = request.data.get('medidor_id')
    direccion = request.data.get('direccion', '')

    if not nombre or not medidor_id:
        return Response(
            {'error': 'Nombre y medidor_id son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if Suscriptor.objects.filter(medidor_id=medidor_id).exists():
        return Response(
            {'error': 'El medidor_id ya existe'},
            status=status.HTTP_400_BAD_REQUEST
        )

    suscriptor = Suscriptor.objects.create(
        nombre=nombre,
        medidor_id=medidor_id,
        direccion=direccion
    )
    return Response(
        SuscriptorSerializer(suscriptor).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
def detalle_suscriptor(request, pk):
    try:
        suscriptor = Suscriptor.objects.get(pk=pk)
    except Suscriptor.DoesNotExist:
        return Response(
            {'error': 'Suscriptor no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = SuscriptorDetailSerializer(suscriptor)
        return Response(serializer.data)

    if request.method == 'PUT':
        suscriptor.nombre = request.data.get('nombre', suscriptor.nombre)
        suscriptor.direccion = request.data.get('direccion', suscriptor.direccion)
        suscriptor.estado_servicio = request.data.get(
            'estado_servicio', suscriptor.estado_servicio
        )
        suscriptor.save()
        return Response(SuscriptorSerializer(suscriptor).data)

    if request.method == 'DELETE':
        if request.user.is_superuser:
            suscriptor.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {'error': 'Solo superadmin puede eliminar'},
            status=status.HTTP_403_FORBIDDEN
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
def registrar_lectura(request):
    medidor_id = request.data.get('medidor_id')
    valor = request.data.get('valor')

    if not medidor_id or valor is None:
        return Response(
            {'error': 'medidor_id y valor son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        valor = float(valor)
        if valor < 0:
            return Response(
                {'error': 'El valor no puede ser negativo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if valor > 99999:
            return Response(
                {'error': 'El valor excede el rango válido del medidor'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except (ValueError, TypeError):
        return Response(
            {'error': 'El valor debe ser numérico'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        suscriptor = Suscriptor.objects.get(medidor_id=medidor_id)
    except Suscriptor.DoesNotExist:
        return Response(
            {'error': 'Suscriptor no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )

    lectura = Lectura.objects.create(
        suscriptor=suscriptor,
        valor=valor,
        lecturista=request.user
    )

    return Response({
        'mensaje': 'Lectura registrada correctamente',
        'lectura': {
            'id': lectura.id,
            'medidor_id': medidor_id,
            'valor': lectura.valor,
            'fecha_lectura': lectura.fecha_lectura,
            'lecturista': request.user.username
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_lecturas(request):
    mes = request.query_params.get('mes')
    anio = request.query_params.get('anio')
    medidor_id = request.query_params.get('medidor_id')

    queryset = Lectura.objects.select_related(
        'suscriptor', 'lecturista'
    ).all()

    if mes:
        queryset = queryset.filter(fecha_lectura__month=mes)
    if anio:
        queryset = queryset.filter(fecha_lectura__year=anio)
    if medidor_id:
        queryset = queryset.filter(suscriptor__medidor_id=medidor_id)

    queryset = queryset.order_by('-fecha_lectura')
    serializer = LecturaSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_pagos(request):
    medidor_id = request.query_params.get('medidor_id')

    queryset = Pago.objects.select_related(
        'suscriptor', 'registrado_por'
    ).all()

    if medidor_id:
        queryset = queryset.filter(suscriptor__medidor_id=medidor_id)

    queryset = queryset.order_by('-fecha_pago')
    serializer = PagoSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
def registrar_pago_o_abono(request):
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

    pago = Pago.objects.create(
        suscriptor=suscriptor,
        monto=monto,
        tipo=tipo,
        metodo_pago=metodo_pago,
        comentario=comentario,
        registrado_por=request.user
    )

    if factura_id:
        try:
            factura = Factura.objects.get(id=factura_id, suscriptor=suscriptor)
            if tipo == 'PAGO':
                factura.monto_pagado += monto
                if float(factura.monto_pagado) >= float(factura.monto):
                    factura.estado = 'PAGADA'
                    suscriptor.mes_deuda_continua = 0
                    suscriptor.save()
                factura.save()
            else:
                factura.abonos += monto
                factura.save()
        except Factura.DoesNotExist:
            pass
    else:
        _aplicar_pago_a_facturas(suscriptor, monto, tipo)

    return Response({
        'mensaje': f"{'Pago' if tipo == 'PAGO' else 'Abono'} registrado",
        'pago': PagoSerializer(pago).data
    }, status=status.HTTP_201_CREATED)


def _aplicar_pago_a_facturas(suscriptor, monto, tipo):
    facturas_pendientes = Factura.objects.filter(
        suscriptor=suscriptor,
        estado='PENDIENTE'
    ).order_by('fecha_generacion')

    monto_restante = monto

    for factura in facturas_pendientes:
        if monto_restante <= 0:
            break

        saldo = float(factura.monto) - float(factura.monto_pagado) - float(factura.abonos)

        if tipo == 'PAGO':
            if monto_restante >= saldo:
                factura.monto_pagado = factura.monto
                factura.estado = 'PAGADA'
                monto_restante -= saldo
                suscriptor.mes_deuda_continua = 0
            else:
                factura.monto_pagado += monto_restante
                monto_restante = 0
        else:
            factura.abonos += monto_restante
            monto_restante = 0

        factura.save()

    if monto_restante > 0 and tipo == 'PAGO':
        pass

    suscriptor.save()


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, EsSuperAdminOAdmin])
def gestionar_periodos(request):
    if request.method == 'GET':
        periodos = PeriodoLectura.objects.all()
        serializer = PeriodoLecturaSerializer(periodos, many=True)
        return Response(serializer.data)

    mes = request.data.get('mes')
    anio = request.data.get('anio')

    if not mes or not anio:
        return Response(
            {'error': 'mes y anio son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        mes = int(mes)
        anio = int(anio)
        if not (1 <= mes <= 12):
            raise ValueError()
    except (ValueError, TypeError):
        return Response(
            {'error': 'mes debe ser 1-12 y anio un año válido'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if PeriodoLectura.objects.filter(mes=mes, anio=anio).exists():
        return Response(
            {'error': 'El período ya existe'},
            status=status.HTTP_400_BAD_REQUEST
        )

    periodo = PeriodoLectura.objects.create(mes=mes, anio=anio)
    return Response(
        PeriodoLecturaSerializer(periodo).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated, EsSuperAdminOAdmin])
def cerrar_periodo_y_generar_facturas(request):
    mes = request.data.get('mes')
    anio = request.data.get('anio')
    tarifa_por_m3 = float(request.data.get('tarifa', 1500))

    if not mes or not anio:
        return Response(
            {'error': 'mes y anio son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        periodo = PeriodoLectura.objects.get(mes=int(mes), anio=int(anio))
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

    suscriptores = Suscriptor.objects.all()
    facturas_creadas = []
    errores = []

    for suscriptor in suscriptores:
        lecturas_periodo = Lectura.objects.filter(
            suscriptor=suscriptor,
            fecha_lectura__month=mes,
            fecha_lectura__year=anio
        ).order_by('fecha_lectura')

        if lecturas_periodo.count() < 2:
            errores.append({
                'suscriptor': suscriptor.medidor_id,
                'error': 'No hay suficientes lecturas (mínimo 2)'
            })
            continue

        primera = lecturas_periodo.first()
        ultima = lecturas_periodo.last()
        consumo = max(0, ultima.valor - primera.valor)
        monto = consumo * tarifa_por_m3

        factura = Factura.objects.create(
            suscriptor=suscriptor,
            periodo=periodo,
            monto=monto,
            consumo=consumo
        )
        facturas_creadas.append(factura)

    periodo.estado = 'CERRADO'
    periodo.fecha_cierre = timezone.now()
    periodo.save()

    return Response({
        'mensaje': f'Se generaron {len(facturas_creadas)} facturas',
        'facturas': FacturaSerializer(facturas_creadas, many=True).data,
        'errores': errores
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
def listar_facturas(request):
    estado = request.query_params.get('estado')
    medidor_id = request.query_params.get('medidor_id')

    queryset = Factura.objects.select_related(
        'suscriptor', 'periodo'
    ).all()

    if estado:
        queryset = queryset.filter(estado=estado)
    if medidor_id:
        queryset = queryset.filter(suscriptor__medidor_id=medidor_id)

    queryset = queryset.order_by('-fecha_generacion')
    serializer = FacturaSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    total_suscriptores = Suscriptor.objects.count()
    activos = Suscriptor.objects.filter(estado_servicio='ACTIVO').count()
    cortados = Suscriptor.objects.filter(estado_servicio='CORTADO').count()

    facturas_pendientes = Factura.objects.filter(estado='PENDIENTE').count()
    facturas_pagadas = Factura.objects.filter(estado='PAGADA').count()

    total_deuda = Factura.objects.filter(
        estado='PENDIENTE'
    ).aggregate(total=Sum('monto') - Sum('monto_pagado') - Sum('abonos'))['total'] or 0

    ultima_lectura = Lectura.objects.aggregate(fecha=Max('fecha_lectura'))['fecha']

    lectura_count = Lectura.objects.count()
    pago_count = Pago.objects.count()

    return Response({
        'total_suscriptores': total_suscriptores,
        'suscriptores_activos': activos,
        'suscriptores_cortados': cortados,
        'facturas_pendientes': facturas_pendientes,
        'facturas_pagadas': facturas_pagadas,
        'total_deuda': float(total_deuda),
        'ultima_lectura': ultima_lectura,
        'total_lecturas': lectura_count,
        'total_pagos': pago_count,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, EsSuperAdminOAdmin])
def cortar_servicio(request, pk):
    try:
        suscriptor = Suscriptor.objects.get(pk=pk)
        suscriptor.estado_servicio = 'CORTADO'
        suscriptor.save()
        return Response({
            'mensaje': 'Servicio cortado',
            'suscriptor': SuscriptorSerializer(suscriptor).data
        })
    except Suscriptor.DoesNotExist:
        return Response(
            {'error': 'Suscriptor no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, EsSuperAdminOAdmin])
def reconectar_servicio(request, pk):
    try:
        suscriptor = Suscriptor.objects.get(pk=pk)
        suscriptor.estado_servicio = 'ACTIVO'
        suscriptor.mes_deuda_continua = 0
        suscriptor.save()
        return Response({
            'mensaje': 'Servicio reconectado',
            'suscriptor': SuscriptorSerializer(suscriptor).data
        })
    except Suscriptor.DoesNotExist:
        return Response(
            {'error': 'Suscriptor no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )