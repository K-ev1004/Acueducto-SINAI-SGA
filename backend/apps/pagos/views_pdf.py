from io import BytesIO

from django.http import HttpResponse
from django.template.loader import render_to_string

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


def _render_recibo_pdf(pago):
    from xhtml2pdf import pisa
    from apps.configuracion.models import ConfiguracionGeneral

    config = ConfiguracionGeneral.obtener()

    ctx = {
        'pago': pago,
        'suscriptor': pago.suscriptor,
        'config': config,
        'fecha': pago.fecha_pago.strftime('%d/%m/%Y %H:%M') if pago.fecha_pago else '',
        'monto_formato': f"${float(pago.monto):,.0f}",
    }

    html_str = render_to_string('facturas/recibo_pago.html', ctx)
    pdf_file = BytesIO()
    pisa.CreatePDF(html_str, dest=pdf_file)
    pdf_file.seek(0)
    return pdf_file


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generar_recibo_pago(request, pk):
    from .models import Pago
    try:
        pago = Pago.objects.select_related('suscriptor', 'factura', 'registrado_por').get(pk=pk)
    except Pago.DoesNotExist:
        return Response({'error': 'Pago no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    pdf_file = _render_recibo_pdf(pago)
    filename = f"recibo_{pago.numero_recibo}.pdf"

    response = HttpResponse(pdf_file.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response
