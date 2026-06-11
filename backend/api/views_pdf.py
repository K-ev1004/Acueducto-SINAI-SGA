from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from django.db.models import Sum, Q
from django.conf import settings
from django.contrib.humanize.templatetags.humanize import intcomma
import calendar
import base64
import os
from io import BytesIO

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Factura, Lectura, Pago, ConfiguracionGeneral, PeriodoLectura
from .serializers import FacturaSerializer


def _make_chart(consumos):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.ticker as ticker

    plt.rcParams['font.family'] = 'DejaVu Sans'
    meses = [c['mes'] for c in consumos]
    valores = [float(c['consumo']) for c in consumos]

    fig, ax = plt.subplots(figsize=(3.2, 1.3))
    bars = ax.bar(meses, valores, color='#2563eb', width=0.5, edgecolor='#1d4ed8', linewidth=0.5)

    for bar, val in zip(bars, valores):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.3,
                f'{val:.0f}', ha='center', va='bottom', fontsize=6, fontweight='bold')

    ax.set_ylabel('m³', fontsize=6)
    ax.tick_params(axis='both', labelsize=6)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.yaxis.set_major_locator(ticker.MaxNLocator(integer=True))

    plt.tight_layout()
    buf = BytesIO()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', transparent=True)
    plt.close(fig)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    return f'data:image/png;base64,{img_base64}'


def _get_lecturas_periodo(suscriptor, periodo, mes, anio):
    lectura_actual = None
    if periodo:
        lectura_actual = Lectura.objects.filter(suscriptor=suscriptor, periodo=periodo).first()
    if not lectura_actual:
        lectura_actual = Lectura.objects.filter(
            suscriptor=suscriptor,
            fecha_lectura__month=mes,
            fecha_lectura__year=anio
        ).order_by('-fecha_lectura').first()

    periodo_anterior = PeriodoLectura.obtener_ultimo_cerrado()
    lectura_anterior = None
    if periodo_anterior and periodo_anterior.id != (periodo.id if periodo else None):
        lectura_anterior = Lectura.objects.filter(
            suscriptor=suscriptor, periodo=periodo_anterior
        ).first()

    if not lectura_anterior:
        ultima = Lectura.objects.filter(suscriptor=suscriptor).exclude(
            id=lectura_actual.id if lectura_actual else None
        ).order_by('-fecha_lectura').first()
        if ultima:
            lectura_anterior = ultima

    return lectura_anterior, lectura_actual


def _get_consumos_historial(suscriptor, mes, anio):
    from collections import OrderedDict
    periodos = PeriodoLectura.objects.filter(estado='CERRADO').order_by('-anio', '-mes')[:3]
    periodos = list(reversed(periodos))

    valores_por_periodo = []
    for p in periodos:
        lectura = Lectura.objects.filter(suscriptor=suscriptor, periodo=p).first()
        valores_por_periodo.append(lectura.valor if lectura else None)

    consumos = []
    valor_anterior = 0
    for i, p in enumerate(periodos):
        valor = valores_por_periodo[i]
        if valor is not None:
            consumo = max(0, valor - valor_anterior)
            valor_anterior = valor
        else:
            consumo = 0
        consumos.append({
            'mes': p.nombre_mes[:3],
            'consumo': consumo
        })

    if not consumos:
        for i in range(3):
            m = mes - (2 - i)
            a = anio
            while m <= 0:
                m += 12
                a -= 1
            consumos.append({
                'mes': calendar.month_abbr[m],
                'consumo': 0
            })

    return consumos


def _get_logo_base64():
    logo_path = os.path.join(settings.BASE_DIR.parent, 'logo factura.png')
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            img_base64 = base64.b64encode(f.read()).decode('utf-8')
            return f'data:image/png;base64,{img_base64}'
    return None


def _render_factura_pdf(factura):
    from xhtml2pdf import pisa

    suscriptor = factura.suscriptor
    periodo = factura.periodo
    config = ConfiguracionGeneral.obtener()

    mes = periodo.mes if periodo else timezone.now().month
    anio = periodo.anio if periodo else timezone.now().year

    anterior, actual = _get_lecturas_periodo(suscriptor, periodo, mes, anio)
    consumos = _get_consumos_historial(suscriptor, mes, anio)
    logo = _get_logo_base64()

    mes_nombre = calendar.month_name[mes]
    periodo_desde = f"01/{mes:02d}/{anio}"
    ultimo_dia = calendar.monthrange(anio, mes)[1]
    periodo_hasta = f"{ultimo_dia:02d}/{mes:02d}/{anio}"

    grafico = _make_chart(consumos) if any(c['consumo'] > 0 for c in consumos) else None

    ctx = {
        'factura': factura,
        'config': config,
        'lectura_anterior': anterior,
        'lectura_actual': actual,
        'consumos': consumos,
        'mes_servicio': f"{mes_nombre} {anio}",
        'periodo_desde': periodo_desde,
        'periodo_hasta': periodo_hasta,
        'logo': logo,
        'grafico_consumo': grafico,
        'qr_data': None,
        'intcomma': intcomma,
    }

    html_str = render_to_string('facturas/factura_pdf.html', ctx)
    pdf_file = BytesIO()
    pisa.CreatePDF(html_str, dest=pdf_file)
    pdf_file.seek(0)
    return pdf_file


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generar_pdf_factura(request, pk):
    try:
        factura = Factura.objects.select_related('suscriptor', 'periodo').get(pk=pk)
    except Factura.DoesNotExist:
        return Response({'error': 'Factura no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    pdf_file = _render_factura_pdf(factura)
    filename = f"factura_{factura.numero_factura}.pdf"

    response = HttpResponse(pdf_file.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def _render_recibo_pdf(pago):
    from xhtml2pdf import pisa

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
    try:
        pago = Pago.objects.select_related('suscriptor', 'factura', 'registrado_por').get(pk=pk)
    except Pago.DoesNotExist:
        return Response({'error': 'Pago no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    pdf_file = _render_recibo_pdf(pago)
    filename = f"recibo_{pago.numero_recibo}.pdf"

    response = HttpResponse(pdf_file.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_lote_pdf(request):
    periodo_id = request.data.get('periodo_id')

    if not periodo_id:
        return Response({'error': 'periodo_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)

    facturas = Factura.objects.filter(
        periodo_id=periodo_id
    ).select_related('suscriptor', 'periodo').order_by('suscriptor__medidor_id')

    if not facturas.exists():
        return Response({'error': 'No hay facturas en este período'}, status=status.HTTP_404_NOT_FOUND)

    from xhtml2pdf import pisa

    config = ConfiguracionGeneral.obtener()
    logo = _get_logo_base64()

    # Pre-fetch lecturas del periodo actual
    lecturas_actuales = {}
    for l in Lectura.objects.filter(periodo_id=periodo_id).select_related('suscriptor'):
        lecturas_actuales[l.suscriptor_id] = l

    # Pre-fetch lecturas del periodo anterior cerrado
    periodo_anterior = PeriodoLectura.obtener_ultimo_cerrado()
    lecturas_anteriores = {}
    if periodo_anterior and str(periodo_anterior.id) != str(periodo_id):
        for l in Lectura.objects.filter(periodo=periodo_anterior).select_related('suscriptor'):
            lecturas_anteriores[l.suscriptor_id] = l

    # Pre-fetch lecturas de los ultimos 3 periodos cerrados para historial de consumo
    periodos_hist = list(PeriodoLectura.objects.filter(
        estado='CERRADO'
    ).exclude(id=periodo_id).order_by('-anio', '-mes')[:3])
    periodos_hist = list(reversed(periodos_hist))
    lecturas_hist = {}
    sus_ids = set(f.suscriptor_id for f in facturas)
    for sus_id in sus_ids:
        lecturas_hist[sus_id] = []
        for p in periodos_hist:
            l = Lectura.objects.filter(suscriptor_id=sus_id, periodo=p).first()
            lecturas_hist[sus_id].append(l.valor if l else None)

    html_parts = []

    for factura in facturas:
        try:
            suscriptor = factura.suscriptor
            periodo = factura.periodo

            mes = periodo.mes if periodo else timezone.now().month
            anio = periodo.anio if periodo else timezone.now().year

            # Lecturas desde cache
            lectura_actual = lecturas_actuales.get(suscriptor.id)
            lectura_anterior = lecturas_anteriores.get(suscriptor.id)
            if not lectura_anterior:
                lectura_anterior = Lectura.objects.filter(
                    suscriptor=suscriptor
                ).exclude(
                    id=lectura_actual.id if lectura_actual else None
                ).order_by('-fecha_lectura').first()

            # Historial de consumo desde cache
            valores = lecturas_hist.get(suscriptor.id, [])
            consumos = []
            prev = 0
            for i, p in enumerate(periodos_hist):
                v = valores[i] if i < len(valores) else None
                if v is not None:
                    c = max(0, int(v) - prev)
                    prev = int(v)
                else:
                    c = 0
                consumos.append({'mes': p.nombre_mes[:3], 'consumo': c})

            if not consumos:
                for i in range(3):
                    m = mes - (2 - i)
                    a = anio
                    while m <= 0:
                        m += 12
                        a -= 1
                    consumos.append({'mes': calendar.month_abbr[m], 'consumo': 0})

            mes_nombre = calendar.month_name[mes]
            periodo_desde = f"01/{mes:02d}/{anio}"
            ultimo_dia = calendar.monthrange(anio, mes)[1]
            periodo_hasta = f"{ultimo_dia:02d}/{mes:02d}/{anio}"

            ctx = {
                'factura': factura,
                'config': config,
                'lectura_anterior': lectura_anterior,
                'lectura_actual': lectura_actual,
                'consumos': consumos,
                'mes_servicio': f"{mes_nombre} {anio}",
                'periodo_desde': periodo_desde,
                'periodo_hasta': periodo_hasta,
                'logo': logo,
                'grafico_consumo': None,
                'qr_data': None,
                'intcomma': intcomma,
            }

            html_str = render_to_string('facturas/factura_pdf.html', ctx)
            html_parts.append(html_str)
        except Exception as e:
            return Response(
                {'error': f'Error al generar factura {factura.numero_factura}: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    all_html = '<div style="page-break-after: always;">' + '</div><div style="page-break-after: always;">'.join(html_parts[:-1]) + '</div>' + (html_parts[-1] if html_parts else '')

    try:
        pdf_file = BytesIO()
        pisa.CreatePDF(all_html, dest=pdf_file)
        pdf_file.seek(0)

        filename = f"facturas_periodo_{periodo_id}.pdf"
        response = HttpResponse(pdf_file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    except Exception as e:
        return Response(
            {'error': f'Error al generar PDF: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
