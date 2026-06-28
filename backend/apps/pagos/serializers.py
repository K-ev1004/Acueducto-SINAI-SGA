from rest_framework import serializers
from .models import Pago


class PagoSerializer(serializers.ModelSerializer):
    suscriptor_nombre = serializers.CharField(source='suscriptor.nombre', read_only=True)
    suscriptor_medidor_id = serializers.CharField(source='suscriptor.medidor_id', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.username', read_only=True)

    class Meta:
        model = Pago
        fields = [
            'id', 'suscriptor_nombre', 'suscriptor_medidor_id',
            'monto', 'tipo', 'metodo_pago', 'numero_recibo',
            'comentario', 'registrado_por_nombre', 'fecha_pago'
        ]
