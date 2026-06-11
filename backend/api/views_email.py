from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Factura
from .tasks import enviar_factura_email


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_factura_por_email(request, pk):
    try:
        factura = Factura.objects.select_related('suscriptor').get(pk=pk)
    except Factura.DoesNotExist:
        return Response(
            {'error': 'Factura no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )

    email = factura.suscriptor.email
    if not email:
        return Response(
            {'error': 'El suscriptor no tiene email registrado'},
            status=status.HTTP_400_BAD_REQUEST
        )

    exito = enviar_factura_email(pk)
    if exito:
        return Response({
            'mensaje': 'Factura enviada por email correctamente',
            'email': email
        })
    else:
        return Response(
            {'error': 'Error al enviar el email'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
