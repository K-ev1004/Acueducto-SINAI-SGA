from django.db import models


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
    email = models.EmailField(max_length=255, blank=True, verbose_name='Correo electrónico')
    documento = models.CharField(max_length=20, blank=True, verbose_name='Documento de identidad')
    codigo_usuario = models.CharField(max_length=20, blank=True, verbose_name='Código de usuario')
    subsidio = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Subsidio aplicado')
    estado_servicio = models.CharField(max_length=20, choices=ESTADO_SERVICIO, default='ACTIVO')
    mes_deuda_continua = models.PositiveIntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'api_suscriptor'
        verbose_name = 'Suscriptor'
        verbose_name_plural = 'Suscriptores'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} - {self.medidor_id}"

    @property
    def deuda_total(self):
        facturas_pendientes = self.facturas.filter(estado='PENDIENTE')
        return sum(f.monto - f.monto_pagado - f.abonos for f in facturas_pendientes)

    def ultima_lectura(self):
        ultima = self.lecturas.order_by('-fecha_lectura').first()
        return ultima

    def lectura_en_periodo(self, periodo):
        return self.lecturas.filter(periodo=periodo).first()
