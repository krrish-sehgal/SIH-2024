from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
import os

# Generate a new AES encryption key (e.g., 32 bytes for AES-256) and store it securely
def generate_key():
    return os.urandom(32)  # 32 bytes = 256 bits

# Load the key (stored securely, for example, as an environment variable)
def load_key():
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        raise ValueError("Encryption key not found. Set the ENCRYPTION_KEY environment variable.")
    return key.encode()  # Ensure the key is in bytes

# Encrypt model data using AES CBC mode
def encrypt_model(data):
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

    # Return IV + encrypted data so both are stored together
    return iv + encrypted_data

# Decrypt the encrypted model data
def decrypt_data(encrypted_data):
    key = load_key()
    
    # Extract the IV from the beginning of the encrypted data
    iv = encrypted_data[:16]
    encrypted_content = encrypted_data[16:]

    # Set up the cipher for decryption with the extracted IV
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()

    # Decrypt the data
    padded_data = decryptor.update(encrypted_content) + decryptor.finalize()

    # Unpad the decrypted data to restore the original
    unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
    data = unpadder.update(padded_data) + unpadder.finalize()

    return data
