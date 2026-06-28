from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.configuracion.models import ConfiguracionGeneral
from apps.configuracion.serializers import ConfiguracionGeneralSerializer

from apps.suscriptores.views import EsSuperAdminOAdmin


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
