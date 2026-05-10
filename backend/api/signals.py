from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth.models import User, Group
import logging

logger = logging.getLogger(__name__)

MAX_ADMIN = 2
MAX_LECTURISTA = 2
MAX_SUPERADMIN = 2


def _contar_grupo(nombre_grupo):
    try:
        group = Group.objects.get(name=nombre_grupo)
        return User.objects.filter(groups=group, is_active=True).count()
    except Group.DoesNotExist:
        return 0


def _contar_superadmins():
    return User.objects.filter(is_superuser=True, is_active=True).count()


def _contar_total():
    return User.objects.filter(is_active=True).count()


@receiver(post_save, sender=User)
def validar_usuario_al_guardar(sender, instance, created, **kwargs):
    """
    Valida los límites de usuarios después de ser creado.
    Solo registra warning, no bloquea (para que createsuperuser funcione).
    El control real se hace en la API/view.
    """
    if not created:
        return

    # Solo validar cuando se crean desde la API/vista, no desde manage.py
    # Para creación inicial por CLI, no bloquear
    total = _contar_total()
    superadmins = _contar_superadmins()
    admins = _contar_grupo('Administradores')
    lecturistas = _contar_grupo('Lecturistas')

    if superadmins > MAX_SUPERADMIN:
        logger.warning(
            f"SuperAdmin excedido: {superadmins}/{MAX_SUPERADMIN} - "
            f"Usuario {instance.username} creado pero supera el límite."
        )

    if admins > MAX_ADMIN:
        logger.warning(
            f"Admin excedido: {admins}/{MAX_ADMIN} - "
            f"Usuario {instance.username} creado pero supera el límite."
        )

    if lecturistas > MAX_LECTURISTA:
        logger.warning(
            f"Lecturista excedido: {lecturistas}/{MAX_LECTURISTA} - "
            f"Usuario {instance.username} creado pero supera el límite."
        )

    if total > 6:
        logger.warning(
            f"Límite total de usuarios excedido: {total}/6 - "
            f"Usuario {instance.username} creado pero supera el límite."
        )