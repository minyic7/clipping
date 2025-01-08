from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,  # Import TokenVerifyView
)

urlpatterns = [
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/token/verify/', TokenVerifyView.as_view(), name='token_verify'),  # Add token verify endpoint
    path('admin/', admin.site.urls),
    path('api/v1/', include('ums.urls')),
    path('api/v1/', include('file.urls')),
    path('api/v1/', include('services.urls')),
]
