# core/urls.py
from django.urls import path
from . import views
from .views import ModelDownloadView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('authenticate-face/', views.face_authenticate, name='authenticate_face'),
    path('download-model/', ModelDownloadView.as_view(), name='download-model'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)