from rest_framework import serializers
from .models import File
from django.utils import timezone
from django.conf import settings


class FileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()  # Use a method to get the URL

    class Meta:
        model = File
        fields = [
            'file_id', 'bucket_name', 'object_key', 'file_type',
            'width', 'height', 'tag', 'created_datetime',
            'last_updated_datetime', 'description', 'user_id', 'url'
        ]
        read_only_fields = ['file_id', 'created_datetime', 'last_updated_datetime']

    def get_url(self, obj):
        return obj.get_url()

    def create(self, validated_data):
        # Ensure last_updated_datetime is set and provide default bucket_name if not in validated_data
        validated_data['last_updated_datetime'] = timezone.now()
        if 'bucket_name' not in validated_data:
            validated_data['bucket_name'] = settings.BUCKET_NAME
        return super(FileSerializer, self).create(validated_data)

    def update(self, instance, validated_data):
        # Allow updating of specific fields and auto-update last_updated_datetime
        instance.tag = validated_data.get('tag', instance.tag)
        instance.description = validated_data.get('description', instance.description)
        instance.user_id = validated_data.get('user_id', instance.user_id)
        instance.last_updated_datetime = timezone.now()
        instance.save()
        return instance
