from django.urls import path
from . import views_auth
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('api/auth/signup/', views_auth.signup, name='signup'),
    path('api/auth/login/', views_auth.login_user, name='login'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
