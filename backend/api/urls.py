from django.urls import path
from . import views
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

    path('facturas/', views.listar_facturas, name='facturas'),
    path('facturas/generar/', views.cerrar_periodo_y_generar_facturas, name='generar_facturas'),

    path('periodos/', views.gestionar_periodos, name='periodos'),

    path('dashboard/', views.dashboard, name='dashboard'),
]