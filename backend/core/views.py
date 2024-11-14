
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.core.files.storage import default_storage
from django.views import View
import os
from django.http import FileResponse, HttpResponse
from django.conf import settings


# Example of a face authentication view (add actual authentication logic here)
@api_view(['POST'])
def face_authenticate(request):
    if request.method == 'POST':
        image = request.FILES.get('image')
        if image:
            # Save the image temporarily or process it for face authentication
            file_path = default_storage.save('temp/' + image.name, image)
            # Here, you would add your face authentication logic (e.g., compare with a stored model)
            # For this demo, assume authentication is successful
            result = {'success': True, 'user': 'John Doe'}  # Example response
            return JsonResponse(result)
        else:
            return JsonResponse({'success': False, 'message': 'No image provided.'})


class ModelDownloadView(View):
    def get(self, request):
        model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'model.onnx')
        if os.path.exists(model_path):
            response = FileResponse(open(model_path, 'rb'))
            response['Content-Disposition'] = 'attachment; filename="your_model.onnx"'
            return response
        else:
            return HttpResponse(status=404)
        

def serve_encrypted_model(request):
    encrypted_model_path = os.path.join("encrypted_models", "encrypted_model.onnx.enc")
    return FileResponse(open(encrypted_model_path, "rb"), as_attachment=True, filename="encrypted_model.onnx.enc")

