from django.contrib import admin
from .models import Pago


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ('suscriptor', 'monto', 'tipo', 'metodo_pago', 'registrado_por', 'fecha_pago')
    list_filter = ('tipo', 'metodo_pago', 'fecha_pago')
    search_fields = ('suscriptor__nombre', 'suscriptor__medidor_id', 'comentario')
    readonly_fields = ('fecha_pago',)
