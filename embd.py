from deepface import DeepFace
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Paths to the two images
image_path_1 = "/Users/KRRISH/Downloads/img1.jpeg"
image_path_2 = "/Users/KRRISH/Downloads/img2.jpeg"

# Step 1: Generate face embeddings for each image
try:
    embedding_1 = DeepFace.represent(img_path=image_path_1, model_name="Facenet")# Facenet
    embedding_2 = DeepFace.represent(img_path=image_path_2, model_name="Facenet")

    # If the output is a list, access the first element
    if isinstance(embedding_1, list):
        embedding_1 = embedding_1[0]
    if isinstance(embedding_2, list):
        embedding_2 = embedding_2[0]

    # Extracting embedding vectors
    vector_1 = np.array(embedding_1["embedding"]).reshape(1, -1)
    vector_2 = np.array(embedding_2["embedding"]).reshape(1, -1)

    print("The np array of face embeddings of the first image:")
    print(vector_1)
    print("The np array of face embeddings of the second image:")
    print(vector_2)
    
    print("\n \n ")
    print("the shape of the embeddingaare ")
    print(vector_1.shape)

    # Step 2: Calculate cosine similarity
    similarity = cosine_similarity(vector_1, vector_2)[0][0]

    print(f"Cosine Similarity: {similarity}")
except Exception as e:
    print(f"An error occurred: {e}")