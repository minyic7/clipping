from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField  # Import ArrayField
from .services.r2_service import R2Service



class File(models.Model):
    class Meta:
        db_table = 'file'  # Custom table name if wanted, otherwise remove this line

    class FileType(models.IntegerChoices):
        IMAGE = 1, 'Image'
        VIDEO = 2, 'Video'
        OTHER = 3, 'Others'

    file_id = models.AutoField(primary_key=True)
    bucket_name = models.CharField(max_length=100, null=False, default=settings.BUCKET_NAME)
    object_key = models.CharField(max_length=255, null=False)
    file_type = models.SmallIntegerField(choices=FileType.choices, default=FileType.OTHER)
    width = models.IntegerField(null=True)
    height = models.IntegerField(null=True)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)  # Updated field
    created_datetime = models.DateTimeField(default=timezone.now)
    last_updated_datetime = models.DateTimeField(default=timezone.now)
    description = models.TextField(null=True, blank=True)
    user_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='user_id')

    def get_url(self):
        # Construct the URL for accessing the file
        url = R2Service.generate_public_url(self.object_key)
        return url

    # To update the 'last_updated_datetime' on model save
    def save(self, *args, **kwargs):
        self.last_updated_datetime = timezone.now()
        super().save(*args, **kwargs)

    def __repr__(self):
        return f'<File {self.object_key}>'

    __str__ = __repr__


class FileInteraction(models.Model):
    class Meta:
        db_table = 'file_interaction'

    class InteractionType(models.TextChoices):
        LIKE = 'like', 'Like'
        COMMENT = 'comment', 'Comment'

    interaction_id = models.AutoField(primary_key=True)
    file = models.ForeignKey('File', on_delete=models.CASCADE, related_name='interactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='file_interactions')
    interaction_type = models.CharField(max_length=10, choices=InteractionType.choices)
    comment = models.TextField(null=True, blank=True)  # Only used for 'comment' interaction type
    created_datetime = models.DateTimeField(default=timezone.now)

    def __repr__(self):
        return f'<FileInteraction file={self.file_id} user={self.user_id} type={self.interaction_type}>'

    def __str__(self):
        return self.__repr__()
