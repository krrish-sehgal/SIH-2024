import base64

def image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        # Encode the image in base64
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return encoded_string

# Example usage
image_path = "/Users/ANJANEYA/Desktop/sanat.jpeg"  # Replace with the path to your image
base64_string = image_to_base64(image_path)
print(base64_string)

# from PIL import Image
# import numpy as np

# def image_to_array(image_path):
#     """
#     Convert an image to a NumPy ndarray.

#     Parameters:
#         image_path (str): The file path of the image.

#     Returns:
#         np.ndarray: The image as a NumPy array.
#     """
#     try:
#         # Load the image
#         image = Image.open(image_path)
        
#         # Convert the image to a NumPy array
#         image_array = np.array(image)
        
#         return image_array
#     except Exception as e:
#         print(f"Error: {e}")
#         return None

# # Example usage
# if __name__ == "__main__":
#     path = '/Users/KRRISH/Downloads/img1.jpeg'  # Replace with your image path
#     array = image_to_array(path)
#     if array is not None:
#         print("Image successfully converted to NumPy array.")
#         print("Shape:", array.shape)
#         print("Data type:", array.dtype)
