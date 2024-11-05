import time

import boto3
from botocore.client import Config
from typing import List, Dict, Optional, Tuple
from django.conf import settings

# Credential
TOKEN_VALUE = settings.TOKEN_VALUE
ACCESS_KEY_ID = settings.ACCESS_KEY_ID
SECRET_ACCESS_KEY = settings.SECRET_ACCESS_KEY

# R2 Setting
ACCOUNT_ID = settings.ACCOUNT_ID
ENDPOINT_URL = settings.ENDPOINT_URL
BUCKET_NAME = settings.BUCKET_NAME


class R2Service:
    FILE_TYPE_MAP = {
        'image': 'image/jpeg',
        'video': 'video/mp4',
    }

    def __init__(self) -> None:
        # Configure the S3 client for Cloudflare R2
        self.s3_client = boto3.client(
            's3',
            endpoint_url=ENDPOINT_URL,
            aws_access_key_id=ACCESS_KEY_ID,
            aws_secret_access_key=SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4')
        )

        print(TOKEN_VALUE, ACCESS_KEY_ID, SECRET_ACCESS_KEY)

    def upload_file(self, file_path: str, object_key: str) -> None:
        """Uploads a file to the specified bucket and object key."""
        try:
            self.s3_client.upload_file(file_path, BUCKET_NAME, object_key)
            print(f"File {file_path} uploaded to {object_key}.")
        except Exception as e:
            print(f"Failed to upload {file_path} to {object_key}: {e}")

    def upload_files(self, files: List[Dict[str, str]]) -> None:
        """Uploads multiple files to the specified bucket.
        Parameters:
        files (list of dict): A list of dictionaries each containing 'file_path' and 'object_key'.
        """
        for file in files:
            self.upload_file(file['file_path'], file['object_key'])

    def download_file(self, object_key: str, file_path: str) -> None:
        """Downloads a file from the specified bucket and object key."""
        try:
            self.s3_client.download_file(BUCKET_NAME, object_key, file_path)
            print(f"File {object_key} downloaded to {file_path}.")
        except Exception as e:
            print(f"Failed to download {object_key} to {file_path}: {e}")

    def download_files(self, files: List[Dict[str, str]]) -> None:
        """Downloads multiple files from the specified bucket.
        Parameters:
        files (list of dict): A list of dictionaries each containing 'object_key' and 'file_path'.
        """
        for file in files:
            self.download_file(file['object_key'], file['file_path'])

    def get_pre_signed_url(self, object_key: str, file_type: str, expiration: int = 3600) -> Optional[Tuple[str, str]]:
        """Generates a pre-signed URL for the specified object key with a timestamp."""
        try:
            # Append the current timestamp to the object key
            timestamp = int(time.time())
            object_key_suffix = object_key.split('.')[-1]
            key_with_timestamp = f"{''.join(object_key.split('.')[:-1])}_{timestamp}.{object_key_suffix}"

            # Determine the content type based on file_type
            content_type = self.FILE_TYPE_MAP.get(file_type, 'application/octet-stream')

            pre_signed_url = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': BUCKET_NAME,
                    'Key': key_with_timestamp,
                    'ContentType': content_type
                },
                ExpiresIn=expiration
            )
            return pre_signed_url, key_with_timestamp, content_type
        except Exception as e:
            print(f"Failed to generate pre-signed URL for {object_key}: {e}")
            return None

    def get_pre_signed_urls(self, objects: List[dict], expiration: int = 3600) -> List[Dict[str, Optional[str]]]:
        """Generates pre-signed URLs for a list of object keys, ensuring unique keys."""

        def preprocess_key(key: str) -> str:
            """Preprocess the key to remove invalid characters and ensure it's suitable for S3."""
            # Remove leading and trailing spaces
            key = key.strip().lower()
            # Remove or replace invalid characters
            key = ''.join(c if c.isalnum() or c in '-._/' else '_' for c in key)
            # Ensure the key is not empty
            if not key:
                raise ValueError("Invalid object key.")
            return key

        pre_signed_urls = []
        key_count = {}

        for _object in objects:
            processed_key = preprocess_key(_object['object_key'])
            file_type = _object['file_type']

            if processed_key in key_count:
                key_count[processed_key] += 1
                new_key = f"{processed_key}_{key_count[processed_key]}"
            else:
                key_count[processed_key] = 0
                new_key = processed_key

            pre_signed_url, unique_object_key, content_type = self.get_pre_signed_url(new_key, file_type, expiration)

            pre_signed_urls.append(
                {
                    "original_object_key": _object['object_key'],
                    "unique_object_key": unique_object_key,
                    "pre_signed_url": pre_signed_url,
                    "content_type": content_type
                }
            )

        return pre_signed_urls


# Example Usage
if __name__ == "__main__":
    r2_service = R2Service()

    print(r2_service.get_pre_signed_url('test2.jpg', 'image'))  # For image type

    # Upload a file
    # r2_service.upload_file('test.jpg', 'test.jpg')

    # Download a file
    # r2_service.download_file('test.jpg', 'test.jpg')
