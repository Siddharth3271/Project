# Backend/cloudbackend/asgi.py

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
import cloudapp.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cloudbackend.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    #Use AllowedHostsOriginValidator to prevent rejection
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                cloudapp.routing.websocket_urlpatterns
            )
        )
    ),
})