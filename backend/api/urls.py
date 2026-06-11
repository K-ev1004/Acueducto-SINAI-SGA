from django.urls import path
from . import views
from . import views_pdf
from . import views_email
from . import views_auth
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', views_auth.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('suscriptores/', views.gestionar_suscriptores, name='suscriptores'),
    path('suscriptores/<int:pk>/', views.detalle_suscriptor, name='detalle_suscriptor'),
    path('suscriptores/<int:pk>/cortar/', views.cortar_servicio, name='cortar_servicio'),
    path('suscriptores/<int:pk>/reconectar/', views.reconectar_servicio, name='reconectar_servicio'),

    path('lecturas/', views.registrar_lectura, name='registrar_lectura'),
    path('lecturas/historial/', views.historial_lecturas, name='historial_lecturas'),

    path('pagos/', views.registrar_pago_o_abono, name='registrar_pago'),
    path('pagos/historial/', views.historial_pagos, name='historial_pagos'),
    path('pagos/<int:pk>/recibo-pdf/', views_pdf.generar_recibo_pago, name='recibo_pago'),

    path('facturas/', views.listar_facturas, name='facturas'),
    path('facturas/<int:pk>/', views.detalle_factura, name='detalle_factura'),
    path('facturas/<int:pk>/pdf/', views_pdf.generar_pdf_factura, name='factura_pdf'),
    path('facturas/<int:pk>/enviar-email/', views_email.enviar_factura_por_email, name='factura_enviar_email'),
    path('facturas/lote-pdf/', views_pdf.generar_lote_pdf, name='facturas_lote_pdf'),
    path('facturas/generar/', views.cerrar_periodo_y_generar_facturas, name='generar_facturas'),

    path('periodos/', views.gestionar_periodos, name='periodos'),
    path('periodos/actual/', views.periodo_actual, name='periodo_actual'),

    path('planilla-cobro/', views.planilla_cobro, name='planilla_cobro'),
    path('pagos/rapido/', views.pago_rapido, name='pago_rapido'),

    path('configuracion/', views.gestionar_configuracion, name='configuracion'),

    path('dashboard/', views.dashboard, name='dashboard'),
]