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

from apps.lecturas.models import Lectura, PeriodoLectura
from apps.lecturas.serializers import LecturaSerializer, PeriodoLecturaSerializer


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


@api_view(['POST'])
@permission_classes([IsAuthenticated, EsLecturistaOAdmin])
def registrar_lectura(request):
    from apps.suscriptores.models import Suscriptor

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
        if valor > 999999:
            return Response(
                {'error': 'El valor excede el rango válido del medidor (máx. 999999)'},
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
    from apps.suscriptores.models import Suscriptor

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
