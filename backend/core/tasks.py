# core/tasks.py

# from celery import shared_task
import os
from django.conf import settings

from utils.encryption_utils import encrypt_model

# @shared_task
def encrypt_model_if_needed():
    model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'model.onnx')
    model_version_path = os.path.join(settings.MEDIA_ROOT, 'models', 'model_version.txt')
    
    # Check if the model needs to be updated
    if os.path.exists(model_version_path):
        with open(model_version_path, 'r') as f:
            stored_version = f.read().strip()

        # Compare version or timestamp to determine if update is needed
        current_version = get_model_version(model_path)  # Implement this function based on your versioning strategy
        
        if current_version != stored_version:
            encrypt_model(model_path)  # Call encryption function
            # Update stored version file
            with open(model_version_path, 'w') as f:
                f.write(current_version)
