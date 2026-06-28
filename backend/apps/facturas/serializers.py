from rest_framework import serializers
from apps.facturas.models import Factura


class FacturaSerializer(serializers.ModelSerializer):
    suscriptor_nombre = serializers.CharField(source='suscriptor.nombre', read_only=True)
    suscriptor_medidor_id = serializers.CharField(source='suscriptor.medidor_id', read_only=True)
    suscriptor_email = serializers.EmailField(source='suscriptor.email', read_only=True)
    periodo_info = serializers.SerializerMethodField()
    saldo_pendiente = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    def get_periodo_info(self, obj):
        return str(obj.periodo) if obj.periodo else '-'

    class Meta:
        model = Factura
        fields = [
            'id', 'numero_factura', 'suscriptor_nombre', 'suscriptor_medidor_id',
            'suscriptor_email', 'monto', 'monto_pagado', 'abonos', 'consumo',
            'valor_m3', 'valor_aseo', 'valor_consumo_mes', 'subsidio_aplicado',
            'estado', 'fecha_generacion', 'fecha_vencimiento',
            'deuda_acumulada', 'abono_deuda', 'fecha_pago',
            'firma_cobrador', 'total_pagado', 'nuevo_saldo', 'email_enviado',
            'periodo_info', 'saldo_pendiente'
        ]


class FacturaDetailSerializer(serializers.ModelSerializer):
    suscriptor = serializers.SerializerMethodField()
    periodo_info = serializers.SerializerMethodField()
    saldo_pendiente = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    def get_suscriptor(self, obj):
        from apps.suscriptores.serializers import SuscriptorSerializer
        return SuscriptorSerializer(obj.suscriptor).data

    def get_periodo_info(self, obj):
        return str(obj.periodo) if obj.periodo else '-'

    class Meta:
        model = Factura
        fields = '__all__'
