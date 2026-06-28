from django.contrib import admin
from .models import ConfiguracionGeneral


@admin.register(ConfiguracionGeneral)
class ConfiguracionGeneralAdmin(admin.ModelAdmin):
    list_display = ('nombre_empresa', 'tarifa_m3', 'cargo_aseo', 'cargo_reconexion')
