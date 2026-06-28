from django.urls import path
from . import views
from . import views_pdf
from . import views_email

urlpatterns = [
    path('facturas/', views.listar_facturas, name='facturas'),
    path('facturas/<int:pk>/', views.detalle_factura, name='detalle_factura'),
    path('facturas/<int:pk>/pdf/', views_pdf.generar_pdf_factura, name='factura_pdf'),
    path('facturas/<int:pk>/enviar-email/', views_email.enviar_factura_por_email, name='factura_enviar_email'),
    path('facturas/lote-pdf/', views_pdf.generar_lote_pdf, name='facturas_lote_pdf'),
    path('facturas/generar/', views.cerrar_periodo_y_generar_facturas, name='generar_facturas'),
]
