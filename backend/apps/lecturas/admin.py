from django.contrib import admin
from .models import Lectura, PeriodoLectura


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
