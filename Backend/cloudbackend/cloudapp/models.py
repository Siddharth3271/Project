import uuid
from django.db import models
from django.conf import settings

class CollaborationSession(models.Model):
    language = models.CharField(max_length=50)
    code = models.TextField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return f"Session {self.id} ({self.language})"
