from django.db import models

class Suscriptor(models.Model):
    nombre = models.CharField(max_length=100)
    medidor_id = models.CharField(max_length=50, unique=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} - {self.medidor_id}"

class Lectura(models.Model):
    suscriptor = models.ForeignKey(Suscriptor, on_delete=models.CASCADE, related_name='lecturas')
    valor = models.FloatField()
    fecha_lectura = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Lectura de {self.suscriptor.medidor_id}: {self.valor}"

class Pago(models.Model):
    suscriptor = models.ForeignKey(Suscriptor, on_delete=models.CASCADE, related_name='pagos')
    monto = models.FloatField()
    fecha_pago = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pago de {self.monto} por {self.suscriptor.nombre}"
