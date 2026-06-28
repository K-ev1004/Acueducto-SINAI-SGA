from django.urls import path
from . import views
from . import views_pdf

urlpatterns = [
    path('pagos/', views.registrar_pago_o_abono, name='registrar_pago'),
    path('pagos/historial/', views.historial_pagos, name='historial_pagos'),
    path('pagos/<int:pk>/recibo-pdf/', views_pdf.generar_recibo_pago, name='recibo_pago'),
    path('pagos/rapido/', views.pago_rapido, name='pago_rapido'),
    path('planilla-cobro/', views.planilla_cobro, name='planilla_cobro'),
]
