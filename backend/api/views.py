from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Suscriptor, Lectura, Pago
from .serializers import SuscriptorSerializer, LecturaSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def listar_suscriptores(request):
    if request.method == 'POST':
        nombre = request.data.get('nombre')
        medidor_id = request.data.get('medidor_id')
        if not nombre or not medidor_id:
            return Response({'error': 'Nombre y medidor_id requeridos'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            suscriptor = Suscriptor.objects.create(nombre=nombre, medidor_id=medidor_id)
            return Response(SuscriptorSerializer(suscriptor).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    suscriptores = Suscriptor.objects.all()
    serializer = SuscriptorSerializer(suscriptores, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_todas_lecturas(request):
    lecturas = Lectura.objects.all().order_by('-fecha_lectura')
    serializer = LecturaSerializer(lecturas, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_pago(request):
    medidor_id = request.data.get('medidor_id')
    monto = request.data.get('monto')
    if not medidor_id or monto is None:
        return Response({'error': 'medidor_id y monto requeridos'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        suscriptor = Suscriptor.objects.get(medidor_id=medidor_id)
        pago = Pago.objects.create(suscriptor=suscriptor, monto=monto)
        return Response({'mensaje': 'Pago registrado exitosamente'}, status=status.HTTP_201_CREATED)
    except Suscriptor.DoesNotExist:
        return Response({'error': 'Suscriptor no encontrado'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def lectura_automatica(request):
    """
    Endpoint para el ESP32. Espera un JSON:
    {"medidor_id": "A12", "valor": 1540}
    """
    medidor_id = request.data.get('medidor_id')
    valor = request.data.get('valor')

    if not medidor_id or valor is None:
        return Response({'error': 'Faltan datos (medidor_id, valor)'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        suscriptor = Suscriptor.objects.get(medidor_id=medidor_id)
        Lectura.objects.create(suscriptor=suscriptor, valor=valor)
        return Response({'mensaje': 'Lectura guardada correctamente'}, status=status.HTTP_201_CREATED)
    except Suscriptor.DoesNotExist:
        return Response({'error': 'Suscriptor no encontrado'}, status=status.HTTP_404_NOT_FOUND)
