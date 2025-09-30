# cloudapp/urls.py (Create this file if it doesn't exist)
from django.urls import path
from . import views

urlpatterns = [
    # API endpoint for generating the token
    path('api/sessions/create/', views.create_session, name='create_session'),
]

# Don't forget to include this in your project's main cloudbackend/urls.py