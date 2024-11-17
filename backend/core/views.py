
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.core.files.storage import default_storage
from django.views import View
import os
from django.http import FileResponse, HttpResponse
from django.conf import settings

class ModelDownloadView(View):
    def get(self, request):
        # Path to the encrypted model
        encrypted_model_path = os.path.join(settings.MEDIA_ROOT, 'encrypted_models', 'model.onnx.enc')

        if os.path.exists(encrypted_model_path):
            # Open the encrypted model file for reading
            response = FileResponse(open(encrypted_model_path, 'rb'))
            # Set the content disposition to force a download
            response['Content-Disposition'] = 'attachment; filename="encrypted_model.onnx.enc"'
            return response
        else:
            return HttpResponse(status=404)
