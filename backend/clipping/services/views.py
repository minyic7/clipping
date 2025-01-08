from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from .shared_board import SharedBoard

# Instantiate a shared SharedBoard instance to be used across requests
shared_board = SharedBoard(max_messages=100)


class SharedBoardView(APIView):
    """
    Shared Board API endpoints to handle message posting and retrieval.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        """
        Handles POST requests to add a message to the shared board.
        Accepts JSON payload with `message` key.
        """
        # Parse the JSON message from the request
        message = request.data.get("message", None)

        # Validate message
        if not message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Post the message to the shared board
        shared_board.post_message(message)
        return Response({"status": "Message added successfully"}, status=status.HTTP_201_CREATED)

    def get(self, request, format=None):
        """
        Handles GET requests to fetch the latest message from the shared board.
        """
        # Fetch the latest message
        latest_message = shared_board.fetch_latest_message()

        if latest_message is None:
            return Response({"error": "No messages available"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"latest_message": latest_message}, status=status.HTTP_200_OK)
