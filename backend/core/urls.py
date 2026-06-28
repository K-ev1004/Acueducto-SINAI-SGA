"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        'message': 'SENA SGA API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/login/',
            'suscriptores': '/api/suscriptores/',
            'lecturas': '/api/lecturas/',
            'pagos': '/api/pagos/',
            'facturas': '/api/facturas/',
            'periodos': '/api/periodos/',
            'dashboard': '/api/dashboard/',
            'docs': '/api/docs/',
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),

    # API Docs (Swagger)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Root API
    path('api/', api_root, name='api-root'),

    # API Routes
    path('api/', include('apps.suscriptores.urls')),
    path('api/', include('apps.lecturas.urls')),
    path('api/', include('apps.facturas.urls')),
    path('api/', include('apps.pagos.urls')),
    path('api/', include('apps.configuracion.urls')),
    path('api/', include('apps.usuarios.urls')),
    path('api/', include('apps.dashboard.urls')),
]