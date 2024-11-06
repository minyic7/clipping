import time
from typing import List, Dict, Optional, Tuple

import boto3
from botocore.client import Config
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

    # Configure the S3 client for Cloudflare R2 as a class attribute
    s3_client = boto3.client(
        's3',
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4')
    )

    @classmethod
    def upload_file(cls, file_path: str, object_key: str) -> None:
        """Uploads a file to the specified bucket and object key."""
        try:
            cls.s3_client.upload_file(file_path, BUCKET_NAME, object_key)
            print(f"File {file_path} uploaded to {object_key}.")
        except Exception as e:
            print(f"Failed to upload {file_path} to {object_key}: {e}")

    @classmethod
    def upload_files(cls, files: List[Dict[str, str]]) -> None:
        """Uploads multiple files to the specified bucket.
        Parameters:
        files (list of dict): A list of dictionaries each containing 'file_path' and 'object_key'.
        """
        for file in files:
            cls.upload_file(file['file_path'], file['object_key'])

    @classmethod
    def download_file(cls, object_key: str, file_path: str) -> None:
        """Downloads a file from the specified bucket and object key."""
        try:
            cls.s3_client.download_file(BUCKET_NAME, object_key, file_path)
            print(f"File {object_key} downloaded to {file_path}.")
        except Exception as e:
            print(f"Failed to download {object_key} to {file_path}: {e}")

    @classmethod
    def download_files(cls, files: List[Dict[str, str]]) -> None:
        """Downloads multiple files from the specified bucket.
        Parameters:
        files (list of dict): A list of dictionaries each containing 'object_key' and 'file_path'.
        """
        for file in files:
            cls.download_file(file['object_key'], file['file_path'])

    @classmethod
    def get_pre_signed_url(cls, object_key: str, file_type: str, expiration: int = 3600) -> Optional[
        Tuple[str, str, str]]:
        """Generates a pre-signed URL for the specified object key with a timestamp."""
        try:
            timestamp = int(time.time())
            object_key_suffix = object_key.split('.')[-1]
            key_with_timestamp = f"{''.join(object_key.split('.')[:-1])}_{timestamp}.{object_key_suffix}"

            content_type = cls.FILE_TYPE_MAP.get(file_type, 'application/octet-stream')

            pre_signed_url = cls.s3_client.generate_presigned_url(
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

    @classmethod
    def get_pre_signed_urls(cls, objects: List[dict], expiration: int = 3600) -> List[Dict[str, Optional[str]]]:
        """Generates pre-signed URLs for a list of object keys, ensuring unique keys."""

        def preprocess_key(key: str) -> str:
            key = key.strip().lower()
            key = ''.join(c if c.isalnum() or c in '-._/' else '_' for c in key)
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

            pre_signed_url, unique_object_key, content_type = cls.get_pre_signed_url(new_key, file_type, expiration)

            pre_signed_urls.append(
                {
                    "original_object_key": _object['object_key'],
                    "unique_object_key": unique_object_key,
                    "pre_signed_url": pre_signed_url,
                    "content_type": content_type
                }
            )

        return pre_signed_urls

    @classmethod
    def generate_public_url(cls, object_key: str, expiration: int = 3600) -> Optional[str]:
        """
        Generates a public URL for the specified object key with a timestamp.

        Parameters:
        object_key (str): The key of the object to generate the URL for.
        expiration (int): Time in seconds for the URL to remain valid. Default is 3600 seconds (1 hour).

        Returns:
        str: The pre-signed URL or None if an error occurred.
        """
        try:
            pre_signed_url = cls.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': BUCKET_NAME,
                    'Key': object_key,
                },
                ExpiresIn=expiration
            )
            return pre_signed_url
        except Exception as e:
            print(f"Failed to generate public URL for {object_key}: {e}")
            return None


# Example Usage
if __name__ == "__main__":
    # Generate instance to invoke class methods
    print(R2Service.get_pre_signed_url('test2.jpg', 'image'))  # For image type

    # Generate a public URL
    print(R2Service.generate_public_url('test2.jpg', 3600))  # The URL will expire in 1 hour

    # Upload a file
    # R2Service.upload_file('test.jpg', 'test.jpg')

    # Download a file
    # R2Service.download_file('test.jpg', 'test.jpg')
