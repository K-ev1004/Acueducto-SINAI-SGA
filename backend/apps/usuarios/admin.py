from django.contrib import admin
from django.contrib.auth.models import User, Group

admin.site.unregister(User)
admin.site.unregister(Group)


class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_superuser', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_superuser', 'is_staff', 'is_active', 'groups')


class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'user_count')

    def user_count(self, obj):
        return obj.user_set.count()
    user_count.short_description = 'Usuarios'


admin.site.register(User, UserAdmin)
admin.site.register(Group, GroupAdmin)
