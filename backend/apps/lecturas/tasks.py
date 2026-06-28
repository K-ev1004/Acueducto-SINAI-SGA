import calendar
import logging
from django.utils import timezone
from django.db.models import Sum
from datetime import date, timedelta

from apps.suscriptores.models import Suscriptor
from apps.facturas.models import Factura
from apps.pagos.models import Pago
from .models import PeriodoLectura

logger = logging.getLogger(__name__)


def verificar_vencimientos():
    """
    Busca facturas cuyo vencimiento está a 7 días
    y envía recordatorio por email (si el suscriptor tiene email).
    """
    hoy = date.today()
    dentro_de_7 = hoy + timedelta(days=7)

    facturas = Factura.objects.filter(
        estado='PENDIENTE',
        fecha_vencimiento=dentro_de_7,
        suscriptor__email__isnull=False,
    ).exclude(suscriptor__email__exact='').select_related('suscriptor')

    enviadas = 0
    for factura in facturas:
        email = factura.suscriptor.email
        if not email:
            continue
        try:
            _enviar_email_recordatorio(factura, email)
            enviadas += 1
        except Exception as e:
            logger.error("Error al enviar recordatorio a factura %s: %s", factura.id, e)

    return f"Recordatorios enviados: {enviadas} de {facturas.count()}"


def verificar_vencidas():
    """
    Busca facturas PENDIENTE cuya fecha de vencimiento ya pasó.
    - Cambia estado a VENCIDA
    - Incrementa mes_deuda_continua del suscriptor
    - Envía aviso de mora por email (si tiene)
    """
    hoy = date.today()

    facturas = Factura.objects.filter(
        estado='PENDIENTE',
        fecha_vencimiento__lt=hoy,
    ).select_related('suscriptor')

    vencidas = 0
    suscriptores_afectados = set()

    for factura in facturas:
        factura.estado = 'VENCIDA'
        factura.save()
        vencidas += 1
        suscriptores_afectados.add(factura.suscriptor_id)

    for suscriptor_id in suscriptores_afectados:
        try:
            suscriptor = Suscriptor.objects.get(pk=suscriptor_id)
            suscriptor.mes_deuda_continua += 1
            suscriptor.save()
        except Suscriptor.DoesNotExist:
            pass

    return f"Facturas vencidas: {vencidas}. Suscriptores afectados: {len(suscriptores_afectados)}"


def verificar_cortes():
    """
    Busca suscriptores con mes_deuda_continua >= 3.
    - Marca estado_servicio = CORTADO
    - Envía aviso de corte (si tiene email)
    """
    suscriptores = Suscriptor.objects.filter(
        estado_servicio__in=['ACTIVO', 'SUSPENDIDO'],
        mes_deuda_continua__gte=3,
    )

    cortados = 0
    for suscriptor in suscriptores:
        suscriptor.estado_servicio = 'CORTADO'
        suscriptor.save()
        cortados += 1

    return f"Suscriptores marcados para corte: {cortados}"


def verificar_pendientes_corte():
    """
    Retorna la cantidad de suscriptores que están pendientes de corte físico.
    (Ya marcados como CORTADO pero pendientes de acción manual del admin)
    """
    return Suscriptor.objects.filter(estado_servicio='CORTADO').count()


def crear_periodo_si_aplica():
    """
    Tarea programada para el día 26 de cada mes.
    Si no existe un período ABIERTO para el mes actual, lo crea.
    """
    hoy = timezone.now().date()
    if hoy.day < 26:
        ultimo_dia_mes = calendar.monthrange(hoy.year, hoy.month)[1]
        if hoy.day != ultimo_dia_mes:
            return "No es fecha de creación de período (día 26 o último día del mes)"

    periodo, creado = PeriodoLectura.obtener_o_crear_actual()
    if creado:
        activos = Suscriptor.objects.filter(estado_servicio='ACTIVO').count()
        return f"Período {periodo.nombre_mes} {periodo.anio} creado automáticamente. {activos} suscriptores activos."
    return f"El período {periodo.nombre_mes} {periodo.anio} ya existe ({periodo.estado})."


def enviar_factura_email(factura_id):
    """
    Envía una factura específica por email con PDF adjunto.
    Retorna True si se envió correctamente.
    """
    try:
        factura = Factura.objects.select_related('suscriptor').get(pk=factura_id)
    except Factura.DoesNotExist:
        return False

    email = factura.suscriptor.email
    if not email:
        return False

    try:
        _enviar_email_factura(factura, email)
        factura.email_enviado = True
        factura.save()
        return True
    except Exception as e:
        logger.error("Error al enviar factura %s por email: %s", factura_id, e)
        return False


def _enviar_email_factura(factura, email):
    from django.core.mail import EmailMessage
    from django.template.loader import render_to_string
    from django.conf import settings
    from apps.facturas.views_pdf import _render_factura_pdf

    contexto = {
        'suscriptor': factura.suscriptor,
        'factura': factura,
        'monto_formato': f"${float(factura.monto):,.0f}",
        'fecha_vencimiento': factura.fecha_vencimiento.strftime('%d/%m/%Y') if factura.fecha_vencimiento else '',
    }

    html = render_to_string('emails/factura.html', contexto)
    pdf = _render_factura_pdf(factura)

    mensaje = EmailMessage(
        subject=f'Factura {factura.numero_factura} — Empresa de Acueducto',
        body=html,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[email],
    )
    mensaje.content_subtype = 'html'
    mensaje.attach(f'factura_{factura.numero_factura}.pdf', pdf.read(), 'application/pdf')
    mensaje.send()


def _enviar_email_recordatorio(factura, email):
    from django.core.mail import EmailMessage
    from django.template.loader import render_to_string
    from django.conf import settings

    contexto = {
        'suscriptor': factura.suscriptor,
        'factura': factura,
        'monto_formato': f"${float(factura.monto):,.0f}",
        'dias_restantes': (factura.fecha_vencimiento - date.today()).days,
        'fecha_vencimiento': factura.fecha_vencimiento.strftime('%d/%m/%Y') if factura.fecha_vencimiento else '',
    }

    html = render_to_string('emails/recordatorio.html', contexto)

    mensaje = EmailMessage(
        subject=f'Recordatorio: Factura próxima a vencer — Acueducto',
        body=html,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[email],
    )
    mensaje.content_subtype = 'html'
    mensaje.send()
