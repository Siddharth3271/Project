from django.urls import path
from . import views_auth, views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
#app py
urlpatterns = [
    # Auth routes
    path('api/auth/signup/', views_auth.signup, name='signup'),
    path('api/auth/login/', views_auth.login_user, name='login'),

    # JWT Token endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Collaboration route
    path('api/sessions/create/', views.create_session, name='create_session'),
]
