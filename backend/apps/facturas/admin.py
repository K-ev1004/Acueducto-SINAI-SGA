from django.contrib import admin
from .models import Factura


@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ('suscriptor', 'monto', 'monto_pagado', 'abonos', 'consumo', 'estado', 'fecha_generacion')
    list_filter = ('estado', 'fecha_generacion')
    search_fields = ('suscriptor__nombre', 'suscriptor__medidor_id')
    readonly_fields = ('fecha_generacion', 'saldo_pendiente')
