import json
import logging

from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField  # Import ArrayField
from .services.r2_service import R2Service
from .services.generative_service import GPTService


# Define the custom logger
logger = logging.getLogger('my_logger')

def safe_gpt_generate(gpt_service, prompt_key, return_format, media_object):
    """Helper to safely call GPTService and handle errors."""
    try:
        result = gpt_service.generate(
            prompt_key=prompt_key,
            return_format=return_format,
            media_object=media_object
        )
        if 'error' in result:
            logger.error(f"GPTService error: {result['error']} for {media_object}")
            return None
        return result['content']
    except Exception as e:
        logger.error(f"Unexpected GPTService exception: {e}", exc_info=True)
        return None


class File(models.Model):
    class Meta:
        db_table = 'file'  # Custom table name if wanted, otherwise remove this line

    class FileType(models.IntegerChoices):
        IMAGE = 1, 'Image'
        VIDEO = 2, 'Video'
        OTHER = 3, 'Others'

    file_id = models.AutoField(primary_key=True)
    bucket_name = models.CharField(max_length=100, null=False, default=settings.BUCKET_NAME)
    object_key = models.CharField(max_length=255, null=False)
    file_type = models.SmallIntegerField(choices=FileType.choices, default=FileType.OTHER)
    width = models.IntegerField(null=True)
    height = models.IntegerField(null=True)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)  # Updated field
    created_datetime = models.DateTimeField(default=timezone.now)
    last_updated_datetime = models.DateTimeField(default=timezone.now)
    description = models.TextField(null=True, blank=True)
    file_caption = models.TextField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='user_id')

    def get_url(self):
        # Construct the URL for accessing the file
        url = R2Service.generate_public_url(self.object_key)
        return url

    # To update the 'last_updated_datetime' on model save
    def save(self, *args, **kwargs):
        # Check if this is a new object (creation)
        is_new = self.pk is None

        self.last_updated_datetime = timezone.now()

        # Construct the media object URL
        media_object = self.get_url()

        # Decide when to run GPT logic:
        # Trigger for new objects OR objects missing captions/tags
        should_generate_tags_and_captions = is_new or (
                self.file_type == self.FileType.IMAGE and (not self.file_caption))
        logger.info(f'should_generate_tags_and_captions: {should_generate_tags_and_captions}')

        if should_generate_tags_and_captions:
            try:
                gpt_service = GPTService()
                logger.debug(f"GPTService initialized for media object: {media_object}")

                # Generate the caption if missing
                if not self.file_caption:
                    caption_content = safe_gpt_generate(gpt_service, "generate_file_caption", "text", media_object)
                    if caption_content:
                        self.file_caption = caption_content
                        logger.info(f"Generated caption for {media_object}: {self.file_caption}")

                # Generate the tags if missing
                tags_content = safe_gpt_generate(gpt_service, "generate_tags", "list", media_object)
                if tags_content:
                    try:
                        generated_tags = json.loads(tags_content)
                        logger.debug(f"Parsed generated tags: {generated_tags}")
                    except json.JSONDecodeError:
                        logger.error(f"Error decoding tags response for {media_object}")
                        generated_tags = []

                    self.tags = self.tags + generated_tags
            except Exception as e:
                logger.exception(f"Error processing media object '{media_object}': {e}")
                self.file_caption = "Error generating caption."

        # Save the object to the database
        super().save(*args, **kwargs)

    def __repr__(self):
        return f'<File {self.object_key}>'

    __str__ = __repr__


class FileInteraction(models.Model):
    class Meta:
        db_table = 'file_interaction'

    class InteractionType(models.TextChoices):
        LIKE = 'like', 'Like'
        COMMENT = 'comment', 'Comment'

    interaction_id = models.AutoField(primary_key=True)
    file = models.ForeignKey('File', on_delete=models.CASCADE, related_name='interactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='file_interactions')
    interaction_type = models.CharField(max_length=10, choices=InteractionType.choices)
    comment = models.TextField(null=True, blank=True)  # Only used for 'comment' interaction type
    created_datetime = models.DateTimeField(default=timezone.now)

    def __repr__(self):
        return f'<FileInteraction file={self.file_id} user={self.user_id} type={self.interaction_type}>'

    def __str__(self):
        return self.__repr__()
