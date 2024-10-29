from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# Create your models here.
class File(models.Model):
    class Meta:
        db_table = 'file'  # custom table name if wanted, otherwise remove this line

    class FileType(models.IntegerChoices):
        IMAGE = 1, 'Image'
        VIDEO = 2, 'Video'
        OTHER = 3, 'Others'

    file_id = models.AutoField(primary_key=True)
    bucket_name = models.CharField(max_length=100, null=False)
    object_key = models.CharField(max_length=255, null=False)
    file_type = models.SmallIntegerField(choices=FileType.choices, default=FileType.OTHER)
    width = models.IntegerField(null=True)
    height = models.IntegerField(null=True)
    tag = models.CharField(max_length=50, null=True)
    created_datetime = models.DateTimeField(default=timezone.now)
    last_updated_datetime = models.DateTimeField(default=timezone.now)
    description = models.TextField(null=True)
    user_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='user_id')

    # To update the 'last_updated_datetime' on model save
    def save(self, *args, **kwargs):
        self.last_updated_datetime = timezone.now()
        super().save(*args, **kwargs)

    def __repr__(self):
        return f'<File {self.object_key}>'

    __str__ = __repr__
