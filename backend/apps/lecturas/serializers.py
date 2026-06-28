from rest_framework import serializers
from apps.lecturas.models import Lectura, PeriodoLectura


class LecturaSerializer(serializers.ModelSerializer):
    suscriptor_nombre = serializers.CharField(source='suscriptor.nombre', read_only=True)
    suscriptor_medidor_id = serializers.CharField(source='suscriptor.medidor_id', read_only=True)
    lecturista_nombre = serializers.CharField(source='lecturista.username', read_only=True)
    periodo = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Lectura
        fields = [
            'id', 'suscriptor_nombre', 'suscriptor_medidor_id',
            'valor', 'fecha_lectura', 'lecturista_nombre', 'periodo'
        ]


class PeriodoLecturaSerializer(serializers.ModelSerializer):
    cantidad_facturas = serializers.SerializerMethodField()
    facturas_generadas = serializers.SerializerMethodField()

    class Meta:
        model = PeriodoLectura
        fields = [
            'id', 'mes', 'anio', 'estado',
            'fecha_creacion', 'fecha_cierre',
            'cantidad_facturas', 'facturas_generadas'
        ]

    def get_cantidad_facturas(self, obj):
        return obj.facturas.count()

    def get_facturas_generadas(self, obj):
        from apps.facturas.serializers import FacturaSerializer
        if obj.estado == 'CERRADO':
            return FacturaSerializer(obj.facturas.all()[:5], many=True).data
        return []
