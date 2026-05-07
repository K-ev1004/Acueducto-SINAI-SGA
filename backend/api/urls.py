from django.urls import path
from . import views
from . import views_auth
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', views_auth.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('suscriptores/', views.listar_suscriptores, name='listar_suscriptores'),
    path('lecturas/', views.obtener_todas_lecturas, name='obtener_todas_lecturas'),
    path('pagos/', views.registrar_pago, name='registrar_pago'),
    path('lectura-automatica/', views.lectura_automatica, name='lectura_automatica'),
]
