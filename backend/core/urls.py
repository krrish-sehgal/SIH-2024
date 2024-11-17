# core/urls.py
from django.urls import path
from .views import ModelDownloadView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('download-encrypted-model/', ModelDownloadView.as_view(), name='download-encrypted-model'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
