from django.contrib import admin
from .models import Suscriptor, Lectura

@admin.register(Suscriptor)
class SuscriptorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'medidor_id', 'creado_en')
    search_fields = ('nombre', 'medidor_id')

@admin.register(Lectura)
class LecturaAdmin(admin.ModelAdmin):
    list_display = ('suscriptor', 'valor', 'fecha_lectura')
    list_filter = ('fecha_lectura',)
