from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileViewSet, get_pre_signed_urls

router = DefaultRouter()
router.register(r'file', FileViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('get-pre-signed-urls/', get_pre_signed_urls, name='get_pre_signed_urls'),
]
