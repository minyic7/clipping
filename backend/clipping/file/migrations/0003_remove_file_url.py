# Generated by Django 5.1.2 on 2024-11-05 05:24

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('file', '0002_file_url'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='file',
            name='url',
        ),
    ]
