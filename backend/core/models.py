from django.db import models
from django.contrib.auth.models import User


class FaceAuthentication(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='face_images/')
    model = models.FileField(upload_to='models/')
    timestamp = models.DateTimeField(auto_now_add=True)
