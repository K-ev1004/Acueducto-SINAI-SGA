from django.urls import path
from . import views_auth
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', views_auth.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
