from rest_framework import serializers
from .models import AdminUser, AdminLog

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminUser
        fields = ['id', 'user', 'is_super_admin', 'created_at', 'last_login']

class AdminLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.CharField(source='admin.user.email', read_only=True)

    class Meta:
        model = AdminLog
        fields = ['id', 'admin', 'admin_email', 'action', 'details', 'ip_address', 'created_at']

    class Meta:
        model = AdminLog
        fields = ['id', 'admin', 'admin_email', 'action', 'details', 'ip_address', 'created_at'] 