from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from .models import File
from .serializers import FileSerializer
from .services.r2_service import R2Service  # Ensure this is the correct import
import logging


# FileViewSet remains as is
class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
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
        serializer.save(user_id=user)


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
        print(type(objects[0]), objects, '--------------')

        # Instantiate the R2Service
        r2_service = R2Service()

        # Get pre-signed URLs for the object keys
        pre_signed_urls = r2_service.get_pre_signed_urls(objects)
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
