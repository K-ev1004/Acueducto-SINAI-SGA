from django.db import models
from django.contrib.auth.models import User


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

    suscriptor = models.ForeignKey('suscriptores.Suscriptor', on_delete=models.CASCADE, related_name='pagos')
    factura = models.ForeignKey('facturas.Factura', on_delete=models.SET_NULL, null=True, blank=True, related_name='pagos')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=10, choices=TIPO_PAGO, default='PAGO')
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO, default='EFECTIVO')
    numero_recibo = models.CharField(max_length=20, blank=True, verbose_name='N° Recibo')
    comentario = models.TextField(blank=True)
    registrado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='pagos_registrados')
    fecha_pago = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'api_pago'
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha_pago']

    def save(self, *args, **kwargs):
        if not self.numero_recibo:
            last = Pago.objects.order_by('-id').first()
            next_num = (last.id + 1) if last else 1
            self.numero_recibo = f"REC-{next_num:06d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.tipo} ${self.monto} - {self.suscriptor.nombre}"
