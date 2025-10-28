# cloudapp/models.py
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username


# ✅ Your existing model (unchanged)
class CollaborationSession(models.Model):
    token = models.CharField(max_length=32, unique=True, default=uuid.uuid4)
    code = models.TextField(default="/* Start coding here... */")
    language = models.CharField(max_length=50, default='cpp')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.token)
