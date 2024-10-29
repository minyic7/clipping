from rest_framework import serializers
from .models import File


class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = [
            'file_id', 'bucket_name', 'object_key', 'file_type',
            'width', 'height', 'tag', 'created_datetime',
            'last_updated_datetime', 'description', 'user_id'
        ]
        read_only_fields = ['file_id', 'created_datetime']
