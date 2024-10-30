from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['mobile']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()
    password = serializers.CharField(write_only=True, required=False)  # Make password optional

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'first_name', 'last_name', 'profile']

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)  # Make password optional in creation
        user = User(**validated_data)

        # Handle setting password if provided
        if password:
            user.set_password(password)
        user.save()

        # Create the UserProfile instance only if profile_data is provided
        if profile_data:
            UserProfile.objects.create(user=user, **profile_data)
        else:
            UserProfile.objects.create(user=user)  # Create an empty profile if not provided
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)

        # Update main user data
        instance = super().update(instance, validated_data)

        # Update password if provided
        if password:
            instance.set_password(password)
            instance.save()

        # Ensure the user's profile exists; create if it doesn't
        if not hasattr(instance, 'profile'):
            UserProfile.objects.create(user=instance)

        # Update profile data
        profile = instance.profile
        if profile_data:
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance
