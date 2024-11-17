import os
from django.conf import settings
from utils.encryption_utils import encrypt_model

def encrypt_model_if_needed():
    # Paths for the model and encrypted model
    model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'model.onnx')
    encrypted_model_path = os.path.join(settings.MEDIA_ROOT, 'encrypted_models', 'model.onnx.enc')
    model_version_path = os.path.join(settings.MEDIA_ROOT, 'models', 'model_version.txt')
    
    # Ensure the encrypted_models directory exists
    if not os.path.exists(os.path.dirname(encrypted_model_path)):
        os.makedirs(os.path.dirname(encrypted_model_path))
    
    # Check if the encrypted model already exists
    if not os.path.exists(encrypted_model_path):
        print("Encrypted model not found or directory is empty. Encrypting the model.")
        
        # Encrypt the model and save it to the encrypted_models folder
        encrypt_model(model_path, encrypted_model_path)  # Pass the path to save the encrypted model
        
        # After encryption, create or update the model version file
        model_timestamp = str(int(os.path.getmtime(model_path)))
        with open(model_version_path, 'w') as f:
            f.write(model_timestamp)  # Store the current model's last modified timestamp
    else:
        # If encrypted model exists, check if an update is needed based on timestamps
        if os.path.exists(model_version_path):
            with open(model_version_path, 'r') as f:
                stored_timestamp = f.read().strip()  # Read the stored timestamp

            # Get the last modified timestamp of the model file
            model_timestamp = str(int(os.path.getmtime(model_path)))  # Last modified time as a string

            # Compare timestamps to determine if update is needed
            if model_timestamp != stored_timestamp:
                print("Model has been updated. Encrypting the updated model.")
                
                # Encrypt the model and save it to the encrypted_models folder
                encrypt_model(model_path, encrypted_model_path)  # Pass the path to save the encrypted model
                
                # Update the stored timestamp file
                with open(model_version_path, 'w') as f:
                    f.write(model_timestamp)  # Store the current model's last modified timestamp
        else:
            # If model_version.txt doesn't exist, assume the model needs to be encrypted
            print("Model version file not found. Encrypting the model.")
            model_timestamp = str(int(os.path.getmtime(model_path)))
            
            # Encrypt the model and save it to the encrypted_models folder
            encrypt_model(model_path, encrypted_model_path)  # Pass the path to save the encrypted model
            
            with open(model_version_path, 'w') as f:
                f.write(model_timestamp)  # Create the timestamp file with the current model's timestamp
