import os
import base64

def generate_and_store_key():
    # Generate a 256-bit (32 bytes) key for AES-256
    key = os.urandom(32)

    # Encode the key to base64 or hexadecimal for storage
    encoded_key = base64.b64encode(key).decode('utf-8')  # Base64 encoded key
    print(f"Base64 encoded AES key: {encoded_key}")

    return encoded_key

# Store the key somewhere safe (e.g., .env file, DB, etc.)
encoded_key = generate_and_store_key()
