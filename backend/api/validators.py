from django.core.exceptions import ValidationError
from django.contrib.auth.models import User, Group

MAX_ADMIN = 2
MAX_LECTURISTA = 2
MAX_SUPERADMIN = 2
MAX_TOTAL_USUARIOS = 6


def get_limites_usuarios():
    return {
        'admins': {'max': MAX_ADMIN, 'actual': _contar_por_grupo('Administradores')},
        'lecturistas': {'max': MAX_LECTURISTA, 'actual': _contar_por_grupo('Lecturistas')},
        'superadmins': {'max': MAX_SUPERADMIN, 'actual': _contar_superadmins()},
        'total': {'max': MAX_TOTAL_USUARIOS, 'actual': _contar_total()}
    }


def _contar_por_grupo(nombre_grupo):
    group, _ = Group.objects.get_or_create(name=nombre_grupo)
    return User.objects.filter(groups=group, is_active=True).count()


def _contar_superadmins():
    return User.objects.filter(is_superuser=True, is_active=True).count()


def _contar_total():
    return User.objects.filter(is_active=True).exclude(is_superuser=True).count() + _contar_superadmins()


def puede_crear_usuario(tipo_usuario):
    limites = get_limites_usuarios()

    if limites['total']['actual'] >= MAX_TOTAL_USUARIOS:
        raise ValidationError(
            f"Se alcanzó el límite máximo de {MAX_TOTAL_USUARIOS} usuarios en el sistema."
        )

    if tipo_usuario == 'superadmin':
        if limites['superadmins']['actual'] >= MAX_SUPERADMIN:
            raise ValidationError(
                f"Supera el límite de {MAX_SUPERADMIN} superadmins."
            )

    elif tipo_usuario == 'admin':
        if limites['admins']['actual'] >= MAX_ADMIN:
            raise ValidationError(
                f"Supera el límite de {MAX_ADMIN} administradores."
            )

    elif tipo_usuario == 'lecturista':
        if limites['lecturistas']['actual'] >= MAX_LECTURISTA:
            raise ValidationError(
                f"Supera el límite de {MAX_LECTURISTA} lecturistas."
            )

    return True


def validar_creacion_usuario(username, is_superuser=False, grupos=None):
    grupos = grupos or []
    tipos = []

    if is_superuser:
        tipos.append('superadmin')
    else:
        for grupo in grupos:
            if grupo == 'Administradores':
                tipos.append('admin')
            elif grupo == 'Lecturistas':
                tipos.append('lecturista')

    for tipo in tipos:
        puede_crear_usuario(tipo)