from decimal import Decimal
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Max, Q
from datetime import date, timedelta
import calendar

from .models import Suscriptor, Lectura, PeriodoLectura, Factura, Pago, ConfiguracionGeneral
from .serializers import (
    SuscriptorSerializer, SuscriptorDetailSerializer,
    LecturaSerializer, FacturaSerializer, FacturaDetailSerializer,
    PagoSerializer, PeriodoLecturaSerializer,
    ConfiguracionGeneralSerializer, DashboardSerializer
)


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
    telefono = request.data.get('telefono', '')
    email = request.data.get('email', '')
    documento = request.data.get('documento', '')
    codigo_usuario = request.data.get('codigo_usuario', '')
    subsidio = request.data.get('subsidio', 0)

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
        direccion=direccion,
        telefono=telefono,
        email=email,
        documento=documento,
        codigo_usuario=codigo_usuario,
        subsidio=subsidio
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
        suscriptor.telefono = request.data.get('telefono', suscriptor.telefono)
        suscriptor.email = request.data.get('email', suscriptor.email)
        suscriptor.documento = request.data.get('documento', suscriptor.documento)
        suscriptor.codigo_usuario = request.data.get('codigo_usuario', suscriptor.codigo_usuario)
        suscriptor.subsidio = request.data.get('subsidio', suscriptor.subsidio)
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

    periodo, _ = PeriodoLectura.obtener_o_crear_actual()

    if suscriptor.lectura_en_periodo(periodo):
        return Response(
            {'error': 'Este suscriptor ya tiene una lectura registrada en el período actual. Edítela desde el historial si es necesario.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    lectura = Lectura.objects.create(
        suscriptor=suscriptor,
        periodo=periodo,
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
            'lecturista': request.user.username,
            'periodo_id': periodo.id,
            'periodo_nombre': str(periodo)
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
@transaction.atomic
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


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
def periodo_actual(request):
    hoy = timezone.now().date()
    periodo, creado = PeriodoLectura.obtener_o_crear_actual()

    puede_cerrar, mensaje_cierre = periodo.puede_cerrarse()
    total_activos = Suscriptor.objects.filter(estado_servicio='ACTIVO').count()
    lecturas_tomadas = periodo.lecturas.count()

    return Response({
        'id': periodo.id,
        'mes': periodo.mes,
        'anio': periodo.anio,
        'estado': periodo.estado,
        'nombre_mes': periodo.nombre_mes,
        'creado_ahora': creado,
        'porcentaje_lecturas': periodo.porcentaje_lecturas(),
        'total_activos': total_activos,
        'lecturas_tomadas': lecturas_tomadas,
        'puede_cerrarse': puede_cerrar,
        'mensaje_cierre': mensaje_cierre,
        'fecha_creacion': periodo.fecha_creacion,
        'fecha_cierre': periodo.fecha_cierre,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, EsSuperAdminOAdmin])
@transaction.atomic
def cerrar_periodo_y_generar_facturas(request):
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


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
def listar_facturas(request):
    estado = request.query_params.get('estado')
    medidor_id = request.query_params.get('medidor_id')
    periodo_id = request.query_params.get('periodo_id')

    queryset = Factura.objects.select_related(
        'suscriptor', 'periodo'
    ).all()

    if estado:
        queryset = queryset.filter(estado=estado)
    if medidor_id:
        queryset = queryset.filter(suscriptor__medidor_id=medidor_id)
    if periodo_id:
        queryset = queryset.filter(periodo_id=periodo_id)

    queryset = queryset.order_by('-fecha_generacion')
    serializer = FacturaSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsSuperAdminOAdmin])
def planilla_cobro(request):
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


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated, EsSuperAdminOAdmin])
def gestionar_configuracion(request):
    config = ConfiguracionGeneral.obtener()

    if request.method == 'GET':
        serializer = ConfiguracionGeneralSerializer(config)
        return Response(serializer.data)

    serializer = ConfiguracionGeneralSerializer(config, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
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
    with transaction.atomic():
        try:
            suscriptor = Suscriptor.objects.get(pk=pk)
        except Suscriptor.DoesNotExist:
            return Response(
                {'error': 'Suscriptor no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        config = ConfiguracionGeneral.obtener()
        cargo_reconexion = float(config.cargo_reconexion)

        suscriptor.estado_servicio = 'ACTIVO'
        suscriptor.mes_deuda_continua = 0
        suscriptor.save()

        if cargo_reconexion > 0:
            Factura.objects.create(
                suscriptor=suscriptor,
                monto=cargo_reconexion,
                consumo=0,
                valor_m3=0,
                valor_aseo=0,
                valor_consumo_mes=0,
                subsidio_aplicado=0,
                monto_pagado=cargo_reconexion,
                total_pagado=cargo_reconexion,
                estado='PAGADA',
                fecha_pago=timezone.now().date(),
                nuevo_saldo=0,
                firma_cobrador='RECONEXIÓN AUTOMÁTICA',
            )

        return Response({
            'mensaje': 'Servicio reconectado',
            'suscriptor': SuscriptorSerializer(suscriptor).data
        })