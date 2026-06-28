from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        role = 'Lecturista'

        if user.is_superuser:
            role = 'SuperAdmin'
        elif user.groups.filter(name='Administradores').exists():
            role = 'Administrador'
        elif user.groups.filter(name='Lecturistas').exists():
            role = 'Lecturista'

        data['role'] = role
        data['username'] = user.username

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
