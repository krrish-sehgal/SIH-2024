import base64
from PIL import Image
from io import BytesIO

def decode_base64_to_image(base64_str):
    img_data = base64.b64decode(base64_str)
    return Image.open(BytesIO(img_data))
