from django.test import TestCase
from django.contrib.auth.models import User
from django.db.utils import IntegrityError


class UserCRUDTestCase(TestCase):

    def setUp(self):
        # Setting up a user to start with
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='password123',
            first_name='Test',
            last_name='User'
        )

    def test_user_creation(self):
        user = User.objects.create_user(
            username='newuser',
            email='newuser@example.com',
            password='newpassword',
            first_name='New',
            last_name='User'
        )
        self.assertIsNotNone(user.id, "User ID should not be None after creation")
        self.assertEqual(user.username, 'newuser', "Username does not match the expected value")
        self.assertTrue(user.check_password('newpassword'), "Password does not match the expected value")
        self.assertEqual(user.email, 'newuser@example.com', "Email does not match the expected value")
        self.assertEqual(user.first_name, 'New', "First name does not match the expected value")
        self.assertEqual(user.last_name, 'User', "Last name does not match the expected value")

    def test_user_retrieve(self):
        user = User.objects.get(username='testuser')
        self.assertEqual(user.username, self.user.username, "Retrieved username does not match expected value")
        self.assertEqual(user.email, self.user.email, "Retrieved email does not match expected value")
        self.assertEqual(user.first_name, self.user.first_name, "Retrieved first name does not match expected value")
        self.assertEqual(user.last_name, self.user.last_name, "Retrieved last name does not match expected value")

    def test_user_update(self):
        user = User.objects.get(username='testuser')
        user.email = 'updated@example.com'
        user.save()

        updated_user = User.objects.get(username='testuser')
        self.assertEqual(updated_user.email, 'updated@example.com', "User email was not updated correctly")

    def test_user_delete(self):
        user = User.objects.get(username='testuser')
        user.delete()

        with self.assertRaises(User.DoesNotExist, msg="User should no longer exist after being deleted"):
            User.objects.get(username='testuser')

    def test_duplicate_username(self):
        with self.assertRaises(IntegrityError,
                               msg="Creating a user with a duplicate username should raise an IntegrityError"):
            User.objects.create_user(
                username='testuser',
                email='duplicate@example.com',
                password='password123'
            )

    def test_unique_email(self):
        user = User.objects.create_user(
            username='uniqueuser',
            email='unique@example.com',
            password='password123'
        )
        self.assertTrue(User.objects.filter(email='unique@example.com').exists(),
                        "Email should be unique and able to be retrieved")

    def test_incorrect_password(self):
        user = User.objects.get(username='testuser')
        self.assertFalse(user.check_password('wrongpassword'), "Password check should fail with a wrong password")

    def test_print_all_users(self):
        users = User.objects.all()
        for user in users:
            print(
                f'Username: {user.username}, Email: {user.email}, First name: {user.first_name}, Last name: {user.last_name}')
