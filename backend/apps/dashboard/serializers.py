from rest_framework import serializers


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
