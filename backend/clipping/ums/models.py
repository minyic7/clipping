from django.db import models
from django.contrib.auth.models import User



class UserProfile(models.Model):
    user: 'User' = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    mobile = models.CharField(max_length=15, blank=True, null=True)
    is_guest = models.BooleanField(default=False)  # Flag to identify guest users

    def __str__(self):
        return self.user.username
