from django.urls import path
from . import views_auth, views, create_session_view
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

    # Codeforces route
    # path('api/codeforces/fetch/', create_session_view.fetch_codeforces_problem, name='fetch_codeforces_problem')
    path('api/codeforces/fetch/', views.fetch_codeforces_problem, name='fetch_codeforces_problem'),
]
