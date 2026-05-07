from rest_framework import serializers
from .models import Suscriptor, Lectura

class LecturaSerializer(serializers.ModelSerializer):
    suscriptor_nombre = serializers.CharField(source='suscriptor.nombre', read_only=True)
    
    class Meta:
        model = Lectura
        fields = ['id', 'valor', 'fecha_lectura', 'suscriptor_nombre']

class SuscriptorSerializer(serializers.ModelSerializer):
    lecturas = LecturaSerializer(many=True, read_only=True)
    lectura_actual = serializers.SerializerMethodField()
    consumo = serializers.SerializerMethodField()
    monto = serializers.SerializerMethodField()
    estadoPago = serializers.SerializerMethodField()

    class Meta:
        model = Suscriptor
        fields = ['id', 'nombre', 'medidor_id', 'creado_en', 'lecturas', 'lectura_actual', 'consumo', 'monto', 'estadoPago']

    def get_lectura_actual(self, obj):
        ultima = obj.lecturas.order_by('-fecha_lectura').first()
        return ultima.valor if ultima else 0

    def get_consumo(self, obj):
        lecturas = obj.lecturas.order_by('-fecha_lectura')[:2]
        if len(lecturas) >= 2:
            return max(0, lecturas[0].valor - lecturas[1].valor)
        return 0

    def get_monto(self, obj):
        # Tarifa base de $1500 por m3
        # Calculamos la deuda total: (ultima lectura - primera lectura) * 1500 - (suma pagos)
        lecturas = obj.lecturas.order_by('fecha_lectura')
        if len(lecturas) < 2:
            return 0
        
        consumo_total = max(0, lecturas.last().valor - lecturas.first().valor)
        total_facturado = consumo_total * 1500
        
        pagos = sum([p.monto for p in obj.pagos.all()])
        return max(0, total_facturado - pagos)

    def get_estadoPago(self, obj):
        monto = self.get_monto(obj)
        if monto <= 0:
            return 'Pagado'
        return 'Pendiente'
