from django.db import models


class ConfiguracionGeneral(models.Model):
    tarifa_m3 = models.DecimalField(max_digits=10, decimal_places=2, default=1500, verbose_name='Tarifa por m³')
    cargo_aseo = models.DecimalField(max_digits=10, decimal_places=2, default=7000, verbose_name='Cargo de aseo')
    cargo_reconexion = models.DecimalField(max_digits=10, decimal_places=2, default=50000, verbose_name='Cargo de reconexión')
    dias_plazo_pago = models.PositiveIntegerField(default=15, verbose_name='Días de plazo para pago')
    nombre_empresa = models.CharField(max_length=255, default='EMPRESA DE SERVICIOS PÚBLICOS AAA CORPOSINAÍ', verbose_name='Nombre de la empresa')
    nit_empresa = models.CharField(max_length=20, blank=True, verbose_name='NIT')
    direccion_empresa = models.CharField(max_length=255, blank=True, verbose_name='Dirección')
    telefono_empresa = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    mensaje_pie = models.TextField(blank=True, default='Paga a tiempo tu factura y no te expongas al cobro por reconexión.', verbose_name='Mensaje al pie')

    class Meta:
        db_table = 'api_configuraciongeneral'
        verbose_name = 'Configuración General'
        verbose_name_plural = 'Configuración General'

    def __str__(self):
        return "Configuración General del Sistema"

    @classmethod
    def obtener(cls):
        config, _ = cls.objects.get_or_create(pk=1)
        return config
