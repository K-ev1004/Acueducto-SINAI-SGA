from django.urls import path
from . import views

urlpatterns = [
    path('lecturas/', views.registrar_lectura, name='registrar_lectura'),
    path('lecturas/historial/', views.historial_lecturas, name='historial_lecturas'),
    path('periodos/', views.gestionar_periodos, name='periodos'),
    path('periodos/actual/', views.periodo_actual, name='periodo_actual'),
]
