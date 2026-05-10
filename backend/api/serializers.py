from rest_framework import serializers
from .models import Suscriptor, Lectura, PeriodoLectura, Factura, Pago


class LecturaSerializer(serializers.ModelSerializer):
    suscriptor_nombre = serializers.CharField(source='suscriptor.nombre', read_only=True)
    suscriptor_medidor_id = serializers.CharField(source='suscriptor.medidor_id', read_only=True)
    lecturista_nombre = serializers.CharField(source='lecturista.username', read_only=True)

    class Meta:
        model = Lectura
        fields = [
            'id', 'suscriptor_nombre', 'suscriptor_medidor_id',
            'valor', 'fecha_lectura', 'lecturista_nombre'
        ]


class SuscriptorSerializer(serializers.ModelSerializer):
    deuda_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    cantidad_facturas_pendientes = serializers.SerializerMethodField()

    class Meta:
        model = Suscriptor
        fields = [
            'id', 'nombre', 'medidor_id', 'direccion',
            'estado_servicio', 'deuda_total', 'creado_en',
            'cantidad_facturas_pendientes'
        ]

    def get_cantidad_facturas_pendientes(self, obj):
        return obj.facturas.filter(estado='PENDIENTE').count()


class SuscriptorDetailSerializer(serializers.ModelSerializer):
    lecturas = LecturaSerializer(many=True, read_only=True)
    facturas = serializers.SerializerMethodField()
    pagos = serializers.SerializerMethodField()
    deuda_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Suscriptor
        fields = [
            'id', 'nombre', 'medidor_id', 'direccion',
            'estado_servicio', 'mes_deuda_continua', 'creado_en',
            'deuda_total', 'lecturas', 'facturas', 'pagos'
        ]

    def get_facturas(self, obj):
        facturas = obj.facturas.all()[:10]
        return FacturaSerializer(facturas, many=True).data

    def get_pagos(self, obj):
        pagos = obj.pagos.all()[:10]
        return PagoSerializer(pagos, many=True).data


class FacturaSerializer(serializers.ModelSerializer):
    suscriptor_nombre = serializers.CharField(source='suscriptor.nombre', read_only=True)
    suscriptor_medidor_id = serializers.CharField(source='suscriptor.medidor_id', read_only=True)
    periodo_info = serializers.CharField(source='periodo.__str__', read_only=True)
    saldo_pendiente = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Factura
        fields = [
            'id', 'suscriptor_nombre', 'suscriptor_medidor_id',
            'monto', 'monto_pagado', 'abonos', 'consumo',
            'estado', 'fecha_generacion', 'periodo_info',
            'saldo_pendiente'
        ]


class PagoSerializer(serializers.ModelSerializer):
    suscriptor_nombre = serializers.CharField(source='suscriptor.nombre', read_only=True)
    suscriptor_medidor_id = serializers.CharField(source='suscriptor.medidor_id', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.username', read_only=True)

    class Meta:
        model = Pago
        fields = [
            'id', 'suscriptor_nombre', 'suscriptor_medidor_id',
            'monto', 'tipo', 'metodo_pago', 'comentario',
            'registrado_por_nombre', 'fecha_pago'
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
        if obj.estado == 'CERRADO':
            return FacturaSerializer(obj.facturas.all()[:5], many=True).data
        return []


class DashboardSerializer(serializers.Serializer):
    total_suscriptores = serializers.IntegerField()
    suscriptores_activos = serializers.IntegerField()
    suscriptores_cortados = serializers.IntegerField()
    facturas_pendientes = serializers.IntegerField()
    facturas_pagadas = serializers.IntegerField()
    total_deuda = serializers.DecimalField(max_digits=14, decimal_places=2)
    ultima_lectura = serializers.DateTimeField()
    total_lecturas = serializers.IntegerField()
    total_pagos = serializers.IntegerField()