# cloudapp/models.py
import uuid
from django.db import models

class CollaborationSession(models.Model):
    # Use a UUID or short unique ID as the token
    token = models.CharField(max_length=32, unique=True, default=uuid.uuid4)
    code = models.TextField(default="/* Start coding here... */")
    language = models.CharField(max_length=50, default='cpp')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.token)