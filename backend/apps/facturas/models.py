from django.db import models


class Factura(models.Model):
    ESTADO_FACTURA = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADA', 'Pagada'),
        ('VENCIDA', 'Vencida'),
    ]

    suscriptor = models.ForeignKey('suscriptores.Suscriptor', on_delete=models.CASCADE, related_name='facturas')
    periodo = models.ForeignKey('lecturas.PeriodoLectura', on_delete=models.SET_NULL, null=True, related_name='facturas')
    numero_factura = models.CharField(max_length=20, unique=True, blank=True, verbose_name='N° Factura')
    monto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    consumo = models.FloatField(default=0, verbose_name='Consumo m³')
    valor_m3 = models.DecimalField(max_digits=10, decimal_places=2, default=1500, verbose_name='Valor m³')
    valor_aseo = models.DecimalField(max_digits=10, decimal_places=2, default=7000, verbose_name='Cargo aseo')
    valor_consumo_mes = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Valor consumo')
    subsidio_aplicado = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Subsidio')
    estado = models.CharField(max_length=20, choices=ESTADO_FACTURA, default='PENDIENTE')
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    fecha_vencimiento = models.DateField(null=True, blank=True, verbose_name='Fecha de vencimiento')
    deuda_acumulada = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Deuda acumulada')
    abonos = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Abonos')
    abono_deuda = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Abono a la deuda')
    fecha_pago = models.DateField(null=True, blank=True, verbose_name='Fecha de pago')
    firma_cobrador = models.CharField(max_length=100, blank=True, verbose_name='Firma cobrador')
    total_pagado = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='T. Pagado')
    nuevo_saldo = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Nuevo saldo')
    email_enviado = models.BooleanField(default=False, verbose_name='Email enviado')

    class Meta:
        db_table = 'api_factura'
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'
        ordering = ['-fecha_generacion']

    def save(self, *args, **kwargs):
        if not self.numero_factura:
            last = Factura.objects.order_by('-id').first()
            next_num = (last.id + 1) if last else 1
            self.numero_factura = f"FAC-{next_num:06d}"
        super().save(*args, **kwargs)

    @property
    def saldo_pendiente(self):
        return max(0, float(self.monto) - float(self.monto_pagado) - float(self.abonos))

    def __str__(self):
        return f"#{self.numero_factura} - {self.suscriptor.medidor_id} - ${self.monto}"
