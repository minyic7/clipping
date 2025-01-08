from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from .models import File, FileInteraction
from .serializers import FileSerializer, FileInteractionSerializer
from .services.r2_service import R2Service  # Ensure this is the correct import
import logging
from collections import Counter
from rest_framework.exceptions import PermissionDenied  # Import for 403 responses


# FileViewSet remains as is
class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all().order_by('-created_datetime')
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):

        if isinstance(request.data, list):
            # Handle bulk creation
            serializer = self.get_serializer(data=request.data, many=True)
        else:
            # Handle single creation
            serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(user=user)

    def destroy(self, request, *args, **kwargs):
        """
        Override the default delete (destroy) method to ensure the file belongs to the requesting user.
        """
        file = self.get_object()  # Retrieve the file instance corresponding to file_id
        user = request.user  # Currently authenticated user

        # Check if the authenticated user owns the file
        if file.user_id != user:
            raise PermissionDenied(detail="You do not have permission to delete this file.")

        # If the user is the owner, proceed with deletion
        self.perform_destroy(file)
        return Response({"message": "File deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        """
        Perform the deletion of the file instance.
        """
        instance.delete()

    # Custom action for deleting all files, e.g. /api/v1/file/delete_all/, WARNING: use this method with caution
    @action(detail=False, methods=['delete'], permission_classes=[IsAuthenticated])
    def delete_all(self, request):
        try:
            # Count interactions before deleting files
            interaction_count = FileInteraction.objects.count()

            # Delete all files (this will also cascade delete all interactions due to on_delete=models.CASCADE)
            file_count, _ = File.objects.all().delete()

            return Response({
                'success': True,
                'message': f"Deleted {file_count} file(s) and {interaction_count} interaction(s)."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logging.error(f"Exception occurred while deleting all files and interactions: {e}")
            return Response({
                'success': False,
                'message': 'An error occurred while trying to delete all files and interactions.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def unique_tags(self, request):
        """
        Custom endpoint to retrieve all unique tags from File model,
        count their occurrences, and rank them by frequency.
        """
        tags_counter = Counter()
        files = self.get_queryset().values('tags')

        for file in files:
            tags_counter.update(file['tags'])  # Update counter with tags from each file

        # Convert counter to a list of dictionaries sorted by count
        sorted_tags = sorted(tags_counter.items(), key=lambda x: x[1], reverse=True)
        ranked_tags = [{"tag": tag, "count": count} for idx, (tag, count) in enumerate(sorted_tags)]

        return Response({"tags": ranked_tags}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def interact(self, request, pk=None):
        """
        Handle user interaction (like or comment) for a file.

        - A like is exclusive: a user can like only one file at a time, unless the previous like is removed.
        - For comments:
            - If `interaction_id` is provided, update the comment.
            - If `interaction_id` is not provided, create a new comment.
        """
        file = self.get_object()
        user = request.user
        interaction_type = request.data.get('interaction_type')
        comment = request.data.get('comment', None)
        interaction_id = request.data.get('interaction_id', None)

        # Validate interaction type
        if interaction_type not in FileInteraction.InteractionType.values:
            return Response({"error": "Invalid interaction type."}, status=status.HTTP_400_BAD_REQUEST)

        # Handle the exclusive 'like' logic
        if interaction_type == FileInteraction.InteractionType.LIKE:
            # Check if the user has already liked this file
            existing_like = FileInteraction.objects.filter(
                user=user,
                interaction_type=FileInteraction.InteractionType.LIKE,
                file=file
            ).first()

            if existing_like:
                return Response({"error": "You have already liked this file."}, status=status.HTTP_400_BAD_REQUEST)

            # Create a new "LIKE" interaction
            like_interaction = FileInteraction.objects.create(
                file=file,
                user=user,
                interaction_type=FileInteraction.InteractionType.LIKE
            )

            # Return the created "like" interaction
            serializer = FileInteractionSerializer(like_interaction)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # Handle the 'comment' logic
        if interaction_type == FileInteraction.InteractionType.COMMENT:
            if interaction_id:
                # If `interaction_id` is provided, try to update the existing comment
                try:
                    interaction = FileInteraction.objects.get(
                        interaction_id=interaction_id,
                        user=user,
                        file=file,
                        interaction_type=FileInteraction.InteractionType.COMMENT
                    )
                    interaction.comment = comment
                    interaction.save()
                    serializer = FileInteractionSerializer(interaction)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                except FileInteraction.DoesNotExist:
                    return Response({"error": "Interaction not found."}, status=status.HTTP_404_NOT_FOUND)
            else:
                # If `interaction_id` is not provided, create a new comment interaction
                new_comment = FileInteraction.objects.create(
                    file=file,
                    user=user,
                    interaction_type=FileInteraction.InteractionType.COMMENT,
                    comment=comment
                )
                serializer = FileInteractionSerializer(new_comment)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        # If the interaction type is neither 'like' nor 'comment', return an error
        return Response({"error": "Unsupported interaction type."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def interactions(self, request, pk=None):
        """
        Get all interactions for the given file (likes, comments) along with username and user_id.
        """
        file = self.get_object()
        interactions = FileInteraction.objects.filter(file=file).select_related('user')

        # Prepare a custom response to include username and user_id
        interaction_list = []
        for interaction in interactions:
            interaction_list.append({
                'interaction_id': interaction.interaction_id,
                'user_id': interaction.user.id,
                'username': interaction.user.username,
                'interaction_type': interaction.interaction_type,
                'comment': interaction.comment,
                'created_datetime': interaction.created_datetime
            })

        return Response(interaction_list, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def delete_interaction(self, request, pk=None):
        """
        Allow a user to delete their specific interaction (like, dislike, or comment) for a file.

        - Only the interaction matching `interaction_id` will be deleted.
        - Ensure the user who created the interaction is the one deleting it.
        """
        file = self.get_object()
        user = request.user

        # Extract "interaction_type" and "interaction_id" from the request
        interaction_id = request.data.get('interaction_id')
        interaction_type = request.data.get('interaction_type')

        # Check if the interaction_id is provided
        if not interaction_id:
            return Response({"error": "Interaction ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate interaction type
        if interaction_type not in FileInteraction.InteractionType.values:
            return Response({"error": "Invalid interaction type."}, status=status.HTTP_400_BAD_REQUEST)

        # Find the specific interaction by ID, type, user, and file
        try:
            interaction = FileInteraction.objects.get(
                interaction_id=interaction_id,  # Ensure the specific ID matches
                file=file,
                user=user,
                interaction_type=interaction_type
            )
        except FileInteraction.DoesNotExist:
            return Response({"error": "Interaction not found."}, status=status.HTTP_404_NOT_FOUND)

        # Finally, delete the interaction
        interaction.delete()
        return Response({"message": f"{interaction_type.capitalize()} interaction deleted successfully."},
                        status=status.HTTP_204_NO_CONTENT)


# Standalone view to get pre-signed URLs
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_pre_signed_urls(request):
    # Extract the list of object keys from the POST request
    objects = request.data

    print(f"Received request to generate pre-signed URLs for: {objects}")

    # Validate that object_keys is a list of strings
    if not isinstance(objects, list) or not all(isinstance(key['object_key'], str) for key in objects):
        print(f"Invalid input: {objects}")
        return Response({
            'success': False,
            'message': 'Invalid input, expected a list of object keys.',
            'data': None
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Extract the actual keys from dictionaries
        # Get pre-signed URLs for the object keys
        pre_signed_urls = R2Service.get_pre_signed_urls(objects)
        if pre_signed_urls is None:
            raise ValueError("Failed to generate pre-signed URLs due to a service error.")

    except Exception as e:
        print(f"Error generating pre-signed URLs: {e}")
        return Response({
            'success': False,
            'message': 'An error occurred while generating pre-signed URLs.',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'success': True,
        'message': 'Pre-signed URLs generated successfully.',
        'data': pre_signed_urls
    }, status=status.HTTP_200_OK)
