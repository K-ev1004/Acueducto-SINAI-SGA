from django.contrib import admin
from .models import Suscriptor, Lectura, PeriodoLectura, Factura, Pago


@admin.register(Suscriptor)
class SuscriptorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'medidor_id', 'direccion', 'estado_servicio', 'mes_deuda_continua', 'creado_en')
    list_filter = ('estado_servicio', 'creado_en')
    search_fields = ('nombre', 'medidor_id', 'direccion')
    readonly_fields = ('creado_en', 'deuda_total')

    fieldsets = (
        ('Información Personal', {
            'fields': ('nombre', 'medidor_id', 'direccion')
        }),
        ('Estado del Servicio', {
            'fields': ('estado_servicio', 'mes_deuda_continua')
        }),
        ('Información', {
            'fields': ('creado_en', 'deuda_total')
        }),
    )


@admin.register(Lectura)
class LecturaAdmin(admin.ModelAdmin):
    list_display = ('suscriptor', 'valor', 'lecturista', 'fecha_lectura')
    list_filter = ('fecha_lectura', 'lecturista')
    search_fields = ('suscriptor__nombre', 'suscriptor__medidor_id')
    readonly_fields = ('fecha_lectura',)


@admin.register(PeriodoLectura)
class PeriodoLecturaAdmin(admin.ModelAdmin):
    list_display = ('mes', 'anio', 'estado', 'fecha_creacion', 'fecha_cierre')
    list_filter = ('estado', 'anio')
    ordering = ('-anio', '-mes')


@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ('suscriptor', 'monto', 'monto_pagado', 'abonos', 'consumo', 'estado', 'fecha_generacion')
    list_filter = ('estado', 'fecha_generacion')
    search_fields = ('suscriptor__nombre', 'suscriptor__medidor_id')
    readonly_fields = ('fecha_generacion', 'saldo_pendiente')


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ('suscriptor', 'monto', 'tipo', 'metodo_pago', 'registrado_por', 'fecha_pago')
    list_filter = ('tipo', 'metodo_pago', 'fecha_pago')
    search_fields = ('suscriptor__nombre', 'suscriptor__medidor_id', 'comentario')
    readonly_fields = ('fecha_pago',)