from django.urls import path
from . import views

urlpatterns = [
    path('configuracion/', views.gestionar_configuracion, name='configuracion'),
]
