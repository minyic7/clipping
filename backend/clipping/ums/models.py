from django.db import models
from django.contrib.auth.models import User
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.contrib.auth.models import User


class UserProfile(models.Model):
    user: 'User' = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    mobile = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return self.user.username