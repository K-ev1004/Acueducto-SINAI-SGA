from django.db import models
from django.contrib.auth.models import User


class Suscriptor(models.Model):
    ESTADO_SERVICIO = [
        ('ACTIVO', 'Activo'),
        ('CORTADO', 'Cortado'),
        ('SUSPENDIDO', 'Suspendido'),
    ]

    nombre = models.CharField(max_length=100)
    medidor_id = models.CharField(max_length=50, unique=True)
    direccion = models.CharField(max_length=255, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    estado_servicio = models.CharField(max_length=20, choices=ESTADO_SERVICIO, default='ACTIVO')
    mes_deuda_continua = models.PositiveIntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Suscriptor'
        verbose_name_plural = 'Suscriptores'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} - {self.medidor_id}"

    @property
    def deuda_total(self):
        facturas_pendientes = self.facturas.filter(estado='PENDIENTE')
        return sum(f.monto - f.monto_pagado - f.abonos for f in facturas_pendientes)


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
        verbose_name = 'Período de Lectura'
        verbose_name_plural = 'Períodos de Lectura'
        unique_together = ('mes', 'anio')
        ordering = ['-anio', '-mes']

    def __str__(self):
        import calendar
        mes_nombre = calendar.month_name[self.mes]
        return f"{mes_nombre} {self.anio} ({self.estado})"


class Lectura(models.Model):
    suscriptor = models.ForeignKey(Suscriptor, on_delete=models.CASCADE, related_name='lecturas')
    valor = models.FloatField()
    fecha_lectura = models.DateTimeField(auto_now_add=True)
    lecturista = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='lecturas_tomadas')

    class Meta:
        verbose_name = 'Lectura'
        verbose_name_plural = 'Lecturas'
        ordering = ['-fecha_lectura']

    def __str__(self):
        return f"Lectura {self.valor}m³ - {self.suscriptor.medidor_id} ({self.lecturista})"


class Factura(models.Model):
    ESTADO_FACTURA = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADA', 'Pagada'),
        ('VENCIDA', 'Vencida'),
    ]

    suscriptor = models.ForeignKey(Suscriptor, on_delete=models.CASCADE, related_name='facturas')
    periodo = models.ForeignKey(PeriodoLectura, on_delete=models.SET_NULL, null=True, related_name='facturas')
    monto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    consumo = models.FloatField(default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_FACTURA, default='PENDIENTE')
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    abonos = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'
        ordering = ['-fecha_generacion']

    @property
    def saldo_pendiente(self):
        return max(0, float(self.monto) - float(self.monto_pagado) - float(self.abonos))

    def __str__(self):
        return f"Factura {self.suscriptor.medidor_id} - ${self.monto}"


class Pago(models.Model):
    TIPO_PAGO = [
        ('PAGO', 'Pago Total'),
        ('ABONO', 'Abono'),
    ]

    METODO_PAGO = [
        ('EFECTIVO', 'Efectivo'),
        ('TRANSFERENCIA', 'Transferencia'),
        ('OTRO', 'Otro'),
    ]

    suscriptor = models.ForeignKey(Suscriptor, on_delete=models.CASCADE, related_name='pagos')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=10, choices=TIPO_PAGO, default='PAGO')
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO, default='EFECTIVO')
    comentario = models.TextField(blank=True)
    registrado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='pagos_registrados')
    fecha_pago = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha_pago']

    def __str__(self):
        return f"{self.tipo} ${self.monto} - {self.suscriptor.nombre}"