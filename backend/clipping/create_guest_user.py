import os
import django

# Set the settings module for Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "clipping.settings")  # Replace 'clipping' with your Django project name
django.setup()

from django.contrib.auth.models import User, Permission
from django.contrib.contenttypes.models import ContentType
from ums.models import UserProfile  # Import the UserProfile model


def create_read_only_user(username, email, password, app_label, model_name):
    """
    Create a user with read-only permissions for a specific app and model.
    Set the 'is_guest' field to True in the user's UserProfile.

    Args:
        username (str): The username for the new user.
        email (str): The email for the new user.
        password (str): The password for the new user.
        app_label (str): The Django app label (e.g., 'file').
        model_name (str): The model name in the app to which the user gets permissions.

    Returns:
        User: The created user instance.
    """
    try:
        # Create the user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name='Guest',
            last_name='User',
            is_staff=False,  # Prevents access to the Django admin
            is_superuser=False  # Prevents elevated permissions
        )
        print(f"User '{user.username}' created successfully with minimal privileges!")

        # Create the user's profile with the 'is_guest' field set to True
        UserProfile.objects.create(user=user, is_guest=True)
        print(f"User profile for '{user.username}' created with is_guest=True.")

        # Assign view permissions to the user for the specified model
        try:
            content_type = ContentType.objects.get(app_label=app_label, model=model_name)
            permission_codename = f'view_{model_name}'
            permission = Permission.objects.get(codename=permission_codename, content_type=content_type)

            # Add the view permission to the user
            user.user_permissions.add(permission)
            print(f"Assigned read-only (view) permission for {app_label}.{model_name} to user '{user.username}'.")
        except ContentType.DoesNotExist:
            print(f"Error: ContentType for app '{app_label}' and model '{model_name}' not found.")
        except Permission.DoesNotExist:
            print(f"Error: Permission '{permission_codename}' for app '{app_label}' not found.")

        return user

    except Exception as e:
        print(f"Error creating user: {e}")
        return None


if __name__ == "__main__":
    try:
        # Prompt for user input
        username = input("Enter username: ").strip()
        email = input("Enter email: ").strip()
        password = input("Enter password: ").strip()

        # Define the app and model for the permission
        app_label = "file"  # Replace this with your app's label
        model_name = "file"  # Replace this with your model's name

        # Create the user with limited permissions
        user = create_read_only_user(username, email, password, app_label, model_name)

        if user:
            print(f"User '{user.username}' has been successfully created.")
        else:
            print("User creation failed.")
    except KeyboardInterrupt:
        print("\nOperation cancelled.")
