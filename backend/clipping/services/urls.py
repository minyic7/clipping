from django.urls import path
from .views import SharedBoardView  # Import the ShardBoardView from your views

urlpatterns = [
    path('sharedboard/', SharedBoardView.as_view(), name='shared_board'),
]