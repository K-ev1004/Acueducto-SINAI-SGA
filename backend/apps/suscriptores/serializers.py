from rest_framework import serializers
from apps.suscriptores.models import Suscriptor


class SuscriptorSerializer(serializers.ModelSerializer):
    deuda_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    cantidad_facturas_pendientes = serializers.SerializerMethodField()

    class Meta:
        model = Suscriptor
        fields = [
            'id', 'nombre', 'medidor_id', 'direccion', 'telefono',
            'email', 'documento', 'codigo_usuario', 'subsidio',
            'estado_servicio', 'deuda_total', 'creado_en',
            'cantidad_facturas_pendientes'
        ]

    def get_cantidad_facturas_pendientes(self, obj):
        return obj.facturas.filter(estado='PENDIENTE').count()


class SuscriptorDetailSerializer(serializers.ModelSerializer):
    lecturas = serializers.SerializerMethodField()
    facturas = serializers.SerializerMethodField()
    pagos = serializers.SerializerMethodField()
    deuda_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Suscriptor
        fields = [
            'id', 'nombre', 'medidor_id', 'direccion', 'telefono',
            'email', 'documento', 'codigo_usuario', 'subsidio',
            'estado_servicio', 'mes_deuda_continua', 'creado_en',
            'deuda_total', 'lecturas', 'facturas', 'pagos'
        ]

    def get_lecturas(self, obj):
        from apps.lecturas.serializers import LecturaSerializer
        lecturas = obj.lecturas.all()
        return LecturaSerializer(lecturas, many=True).data

    def get_facturas(self, obj):
        from apps.facturas.serializers import FacturaSerializer
        facturas = obj.facturas.all()[:10]
        return FacturaSerializer(facturas, many=True).data

    def get_pagos(self, obj):
        from apps.pagos.serializers import PagoSerializer
        pagos = obj.pagos.all()[:10]
        return PagoSerializer(pagos, many=True).data
