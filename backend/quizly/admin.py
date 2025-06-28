from django.contrib import admin
from .models import AdminUser, AdminLog

@admin.register(AdminUser)
class AdminUserAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_super_admin', 'created_at', 'last_login']
    search_fields = ['user__email']
    list_filter = ['is_super_admin', 'created_at']

@admin.register(AdminLog)
class AdminLogAdmin(admin.ModelAdmin):
    list_display = ['admin', 'action', 'ip_address', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['admin__user__email']
    readonly_fields = ['created_at']