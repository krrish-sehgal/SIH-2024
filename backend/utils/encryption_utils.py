from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
import os
import base64

def load_key():
    key = os.getenv('ENCRYPTION_KEY')
    if not key:
        raise ValueError("Encryption key not found. Set the ENCRYPTION_KEY environment variable.")
    
    # Decode the base64 key back into bytes
    decoded_key = base64.b64decode(key)
    return decoded_key

def encrypt_model(model_path, encrypted_model_path):
    # Read the model file
    with open(model_path, 'rb') as f:
        data = f.read()

    # Ensure data is in bytes (if it's a string, convert it to bytes)
    if isinstance(data, str):
        data = data.encode('utf-8')  # Convert string to bytes

    # Load encryption key
    key = load_key()

    # Generate a random IV (Initialization Vector)
    iv = os.urandom(16)

    # Set up the cipher with AES-CBC mode and padding
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()

    # Pad the data to fit AES block size requirements
    padder = padding.PKCS7(algorithms.AES.block_size).padder()
    padded_data = padder.update(data) + padder.finalize()

    # Encrypt the data
    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()

    # Save the IV + encrypted data to the specified file
    with open(encrypted_model_path, 'wb') as f:
        f.write(iv + encrypted_data)  # Write the IV followed by the encrypted data

    print(f"Model encrypted and saved to {encrypted_model_path}")
