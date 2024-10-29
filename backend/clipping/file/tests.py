from django.test import TestCase
from django.contrib.auth.models import User
from .models import File


class FileCRUDTestCase(TestCase):

    def setUp(self):
        # Setting up a user to associate with files
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='password123'
        )

        # Setting up an initial file
        self.file = File.objects.create(
            bucket_name='test-bucket',
            object_key='test-object-1',
            file_type=File.FileType.IMAGE,
            width=1920,
            height=1080,
            tag='test-tag',
            description='Test description',
            user_id=self.user
        )

    def test_file_creation(self):
        file = File.objects.create(
            bucket_name='new-bucket',
            object_key='new-object',
            file_type=File.FileType.VIDEO,
            width=1280,
            height=720,
            tag='new-tag',
            description='New file description',
            user_id=self.user
        )
        self.assertIsNotNone(file.file_id, "File ID should not be None after creation")
        self.assertEqual(file.bucket_name, 'new-bucket', "Bucket name does not match")
        self.assertEqual(file.object_key, 'new-object', "Object key does not match")
        self.assertEqual(file.file_type, File.FileType.VIDEO, "File type does not match")
        self.assertEqual(file.width, 1280, "Width does not match")
        self.assertEqual(file.height, 720, "Height does not match")
        self.assertEqual(file.tag, 'new-tag', "Tag does not match")
        self.assertEqual(file.description, 'New file description', "Description does not match")
        self.assertEqual(file.user_id, self.user, "Associated user does not match")

    def test_file_retrieve(self):
        file = File.objects.get(object_key='test-object-1')
        self.assertEqual(file.bucket_name, self.file.bucket_name, "Retrieved bucket name does not match")
        self.assertEqual(file.object_key, self.file.object_key, "Retrieved object key does not match")
        self.assertEqual(file.file_type, self.file.file_type, "Retrieved file type does not match")
        self.assertEqual(file.width, self.file.width, "Retrieved width does not match")
        self.assertEqual(file.height, self.file.height, "Retrieved height does not match")
        self.assertEqual(file.tag, self.file.tag, "Retrieved tag does not match")
        self.assertEqual(file.description, self.file.description, "Retrieved description does not match")
        self.assertEqual(file.user_id, self.file.user_id, "Retrieved user does not match")

    def test_file_update(self):
        file = File.objects.get(object_key='test-object-1')
        file.description = 'Updated description'
        file.width = 2560
        file.height = 1440
        file.tag = 'updated-tag'
        file.save()

        updated_file = File.objects.get(object_key='test-object-1')
        self.assertEqual(updated_file.description, 'Updated description', "Description was not updated correctly")
        self.assertEqual(updated_file.width, 2560, "Width was not updated correctly")
        self.assertEqual(updated_file.height, 1440, "Height was not updated correctly")
        self.assertEqual(updated_file.tag, 'updated-tag', "Tag was not updated correctly")

    def test_file_delete(self):
        file = File.objects.get(object_key='test-object-1')
        file.delete()

        with self.assertRaises(File.DoesNotExist, msg="File should no longer exist after being deleted"):
            File.objects.get(object_key='test-object-1')

    def test_file_width_height(self):
        file = File.objects.create(
            bucket_name='bucket-name',
            object_key='object-key-2',
            file_type=File.FileType.IMAGE,
            width=500,
            height=400,
            user_id=self.user
        )
        self.assertEqual(file.width, 500, "File width does not match expected value")
        self.assertEqual(file.height, 400, "File height does not match expected value")

    def test_file_tag_update(self):
        file = File.objects.create(
            bucket_name='bucket-name',
            object_key='object-key-3',
            file_type=File.FileType.IMAGE,
            tag='initial-tag',
            user_id=self.user
        )
        file.tag = 'updated-tag'
        file.save()
        updated_file = File.objects.get(object_key='object-key-3')
        self.assertEqual(updated_file.tag, 'updated-tag', "Tag update did not match expected value")

    def test_print_all_files(self):
        files = File.objects.all()
        for file in files:
            print(f'Object Key: {file.object_key}, Bucket: {file.bucket_name}, Description: {file.description}, '
                  f'Width: {file.width}, Height: {file.height}, Tag: {file.tag}, User: {file.user_id.username if file.user_id else "None"}')
