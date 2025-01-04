from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .serializers import UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def get_user_id(self, request):
        """
        Custom action to get the user ID by username.
        """
        username = request.query_params.get('username')  # Retrieve 'username' from query parameters
        print(username, '----------')
        if not username:
            return Response({'error': 'Username parameter is required'}, status=400)

        # Fetch the user or return a 404 if not found
        user = get_object_or_404(User, username=username)

        # Return only the user_id in the response
        return Response({'user_id': user.id})
