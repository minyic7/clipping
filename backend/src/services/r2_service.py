import os
import boto3
from botocore.client import Config
from typing import List, Dict, Optional

# Credential
TOKEN_VALUE = os.getenv('TOKEN_VALUE')
ACCESS_KEY_ID = os.getenv('ACCESS_KEY_ID')
SECRET_ACCESS_KEY = os.getenv('SECRET_ACCESS_KEY')

# R2 Setting
ACCOUNT_ID = 'f56837f054997f21174c350c33df8c1a'
ENDPOINT_URL = f'https://{ACCOUNT_ID}.r2.cloudflarestorage.com'
BUCKET_NAME = 'clipping'


class R2Service:
    def __init__(self) -> None:
        # Configure the S3 client for Cloudflare R2
        self.s3_client = boto3.client(
            's3',
            endpoint_url=ENDPOINT_URL,
            aws_access_key_id=ACCESS_KEY_ID,
            aws_secret_access_key=SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4')
        )

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

    def get_pre_signed_url(self, object_key: str, expiration: int = 3600) -> Optional[str]:
        """Generates a pre-signed URL for the specified object key."""
        try:
            pre_signed_url = self.s3_client.generate_pre_signed_url(
                'put_object',
                Params={'Bucket': BUCKET_NAME, 'Key': object_key},
                ExpiresIn=expiration
            )
            return pre_signed_url
        except Exception as e:
            print(f"Failed to generate pre-signed URL for {object_key}: {e}")
            return None

    def get_pre_signed_urls(self, object_keys: List[str], expiration: int = 3600) -> Dict[str, Optional[str]]:
        """Generates pre-signed URLs for a list of object keys."""
        pre_signed_urls = {}
        for key in object_keys:
            url = self.get_pre_signed_url(key, expiration)
            pre_signed_urls[key] = url
        return pre_signed_urls


# Example Usage
if __name__ == "__main__":
    r2_service = R2Service()

    print(r2_service.get_pre_signed_url('test2.jpg'))

    # Upload a file
    # r2_service.upload_file('test.jpg', 'test.jpg')

    # Download a file
    # r2_service.download_file('test.jpg', 'test.jpg')
