from rest_framework import serializers
from apps.configuracion.models import ConfiguracionGeneral


class ConfiguracionGeneralSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionGeneral
        fields = '__all__'
