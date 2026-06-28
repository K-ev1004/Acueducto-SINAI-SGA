from django.contrib import admin
from .models import Suscriptor


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
