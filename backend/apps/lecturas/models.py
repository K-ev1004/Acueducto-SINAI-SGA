import calendar
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class PeriodoLectura(models.Model):
    ESTADO_PERIODO = [
        ('ABIERTO', 'Abierto'),
        ('CERRADO', 'Cerrado'),
    ]

    mes = models.PositiveIntegerField()
    anio = models.PositiveIntegerField()
    estado = models.CharField(max_length=20, choices=ESTADO_PERIODO, default='ABIERTO')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'api_periodolectura'
        verbose_name = 'Período de Lectura'
        verbose_name_plural = 'Períodos de Lectura'
        unique_together = ('mes', 'anio')
        ordering = ['-anio', '-mes']

    def __str__(self):
        mes_nombre = calendar.month_name[self.mes]
        return f"{mes_nombre} {self.anio} ({self.estado})"

    @classmethod
    def obtener_o_crear_actual(cls):
        hoy = timezone.now().date()
        mes = hoy.month
        anio = hoy.year
        periodo, creado = cls.objects.get_or_create(
            mes=mes, anio=anio,
            defaults={'estado': 'ABIERTO'}
        )
        return periodo, creado

    @classmethod
    def obtener_ultimo_cerrado(cls):
        return cls.objects.filter(estado='CERRADO').order_by('-anio', '-mes').first()

    @property
    def nombre_mes(self):
        return calendar.month_name[self.mes]

    def porcentaje_lecturas(self):
        from apps.suscriptores.models import Suscriptor
        total = Suscriptor.objects.filter(estado_servicio='ACTIVO').count()
        if total == 0:
            return 100
        tomadas = self.lecturas.count()
        return int((tomadas / total) * 100)

    def puede_cerrarse(self):
        from apps.suscriptores.models import Suscriptor
        suscriptores_activos = Suscriptor.objects.filter(estado_servicio='ACTIVO')
        if not suscriptores_activos.exists():
            return False, 'No hay suscriptores activos'
        sin_lectura = []
        for s in suscriptores_activos:
            if not self.lecturas.filter(suscriptor=s).exists():
                sin_lectura.append(s.medidor_id)
        if sin_lectura:
            return False, f'Faltan lecturas para: {", ".join(sin_lectura[:5])}'
        return True, 'OK'


class Lectura(models.Model):
    suscriptor = models.ForeignKey('suscriptores.Suscriptor', on_delete=models.CASCADE, related_name='lecturas')
    periodo = models.ForeignKey(PeriodoLectura, on_delete=models.CASCADE, null=True, blank=True, related_name='lecturas')
    valor = models.FloatField()
    fecha_lectura = models.DateTimeField(auto_now_add=True)
    lecturista = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='lecturas_tomadas')

    class Meta:
        db_table = 'api_lectura'
        verbose_name = 'Lectura'
        verbose_name_plural = 'Lecturas'
        ordering = ['-fecha_lectura']

    def __str__(self):
        return f"Lectura {self.valor}m³ - {self.suscriptor.medidor_id} ({self.lecturista})"
