from datetime import timedelta

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from apps.suscriptores.models import Suscriptor
from apps.suscriptores.serializers import (
    SuscriptorSerializer, SuscriptorDetailSerializer,
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

        from apps.configuracion.models import ConfiguracionGeneral
        from apps.facturas.models import Factura

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
