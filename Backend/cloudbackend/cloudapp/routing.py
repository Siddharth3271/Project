# cloudapp/routing.py
from django.urls import re_path
from . import consumers
import sys

print("--- CLOUDAPP ROUTING FILE LOADED ---", file=sys.stderr)

websocket_urlpatterns = [
    re_path(
        r'^ws/editor/(?P<document_id>[^/]+)/$',  # ✅ capture document_id
        consumers.CodeEditorConsumer.as_asgi()
    ),
]
