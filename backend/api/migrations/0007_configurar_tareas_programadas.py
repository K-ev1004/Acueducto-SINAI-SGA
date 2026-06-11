from django.db import migrations


def crear_schedules(apps, schema_editor):
    try:
        Schedule = apps.get_model('django_q', 'Schedule')
    except LookupError:
        return
    from django.utils import timezone
    from datetime import timedelta
    hoy = timezone.now()

    tareas = [
        {
            'name': 'Vencimientos - Recordatorio 7 días',
            'func': 'api.tasks.verificar_vencimientos',
            'schedule_type': 'D',
            'next_run': hoy.replace(hour=8, minute=0, second=0, microsecond=0) + timedelta(days=1),
        },
        {
            'name': 'Vencidas - Marcar mora',
            'func': 'api.tasks.verificar_vencidas',
            'schedule_type': 'D',
            'next_run': hoy.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1),
        },
        {
            'name': 'Cortes - Marcar para corte físico',
            'func': 'api.tasks.verificar_cortes',
            'schedule_type': 'D',
            'next_run': hoy.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1),
        },
        {
            'name': 'Crear período automático (día 26)',
            'func': 'api.tasks.crear_periodo_si_aplica',
            'schedule_type': 'D',
            'next_run': hoy.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1),
        },
    ]

    for tarea in tareas:
        Schedule.objects.get_or_create(
            name=tarea['name'],
            defaults={
                'func': tarea['func'],
                'schedule_type': tarea['schedule_type'],
                'repeats': -1,
                'next_run': tarea['next_run'],
            }
        )


def eliminar_schedules(apps, schema_editor):
    try:
        Schedule = apps.get_model('django_q', 'Schedule')
    except LookupError:
        return
    nombres = [
        'Vencimientos - Recordatorio 7 días',
        'Vencidas - Marcar mora',
        'Cortes - Marcar para corte físico',
        'Crear período automático (día 26)',
    ]
    Schedule.objects.filter(name__in=nombres).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_lectura_periodo'),
    ]

    operations = [
        migrations.RunPython(crear_schedules, eliminar_schedules),
    ]
