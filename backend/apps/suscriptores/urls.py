from django.urls import path
from . import views

urlpatterns = [
    path('suscriptores/', views.gestionar_suscriptores, name='suscriptores'),
    path('suscriptores/<int:pk>/', views.detalle_suscriptor, name='detalle_suscriptor'),
    path('suscriptores/<int:pk>/cortar/', views.cortar_servicio, name='cortar_servicio'),
    path('suscriptores/<int:pk>/reconectar/', views.reconectar_servicio, name='reconectar_servicio'),
]
