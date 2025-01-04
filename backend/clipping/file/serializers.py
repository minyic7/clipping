from rest_framework import serializers
from .models import File, FileInteraction
from django.utils import timezone
from django.conf import settings


class FileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()  # Use a method to get the URL

    class Meta:
        model = File
        fields = [
            'file_id', 'bucket_name', 'object_key', 'file_type',
            'width', 'height', 'tags', 'created_datetime',
            'last_updated_datetime', 'description', 'user_id', 'url'
        ]
        read_only_fields = ['file_id', 'created_datetime', 'last_updated_datetime', 'user_id']

    def get_url(self, obj):
        return obj.get_url()

    def to_internal_value(self, data):
        if 'file_type' in data:
            data['file_type'] = self.map_file_type(data['file_type'])

        data = super().to_internal_value(data)
        # Map string file_type to corresponding integer

        return data

    def validate_file_type(self, value):
        # Ensure that the mapped file_type is valid
        valid_file_types = [File.FileType.IMAGE, File.FileType.VIDEO, File.FileType.OTHER]
        if value not in valid_file_types:
            raise serializers.ValidationError("Invalid file_type. Allowed types: image, video, other.")
        return value

    def validate(self, data):
        return data

    def create(self, validated_data):
        # Ensure last_updated_datetime is set and provide default bucket_name if not in validated_data
        validated_data['last_updated_datetime'] = timezone.now()
        if 'bucket_name' not in validated_data:
            validated_data['bucket_name'] = settings.BUCKET_NAME

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Allow updating of specific fields and auto-update last_updated_datetime
        instance.tags = validated_data.get('tags', instance.tags)
        instance.description = validated_data.get('description', instance.description)
        instance.user_id = validated_data.get('user_id', instance.user_id)
        instance.last_updated_datetime = timezone.now()

        instance.save()
        return instance

    def map_file_type(self, file_type):
        file_type_map = {
            'image': File.FileType.IMAGE,
            'video': File.FileType.VIDEO,
            'other': File.FileType.OTHER,
            'others': File.FileType.OTHER,
            # Add any other mappings as needed
        }
        return file_type_map.get(file_type.lower(), File.FileType.OTHER)



class FileInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileInteraction
        fields = ['interaction_id', 'file', 'user', 'interaction_type', 'comment', 'created_datetime']
