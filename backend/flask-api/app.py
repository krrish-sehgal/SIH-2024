from flask import Flask, request, jsonify
from deepface import DeepFace
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import pymongo
import json

# Initialize Flask app
app = Flask(__name__)

# MongoDB connection setup
client = pymongo.MongoClient("mongodb://Krrish:krrish123@ac-7gvopvc-shard-00-00.1nxbntm.mongodb.net:27017,ac-7gvopvc-shard-00-01.1nxbntm.mongodb.net:27017,ac-7gvopvc-shard-00-02.1nxbntm.mongodb.net:27017/sih?replicaSet=atlas-11fue8-shard-0&ssl=true&authSource=admin&w=majority&appName=Cluster1")
db = client.sih  # Replace with your database name
collection = db.users  # Replace with your collection name

# Utility function to decode base64 image to PIL image
def decode_base64_to_image(base64_str):
    # Decode the image
    img_data = base64.b64decode(base64_str)
    img = Image.open(BytesIO(img_data))
    return img

def get_embedding_by_aadhar(aadhar_number):
    try:
        # Query MongoDB for the document with the given Aadhar number
        document = collection.find_one({"aadhar": aadhar_number})
        if not document:
            print("No entry found for the given Aadhar number.")
            return None

        # Extract the embedding and convert it to a numpy array
        embedding_vector = np.array(document["embedding"]).reshape(1, 128)  # Reshape to (1, 128)
        print(f"Embedding for Aadhar {aadhar_number}: {embedding_vector}")
        return embedding_vector

    except Exception as e:
        print(f"An error occurred while retrieving the embedding: {e}")
        return None

# Verify endpoint
@app.route('/verify', methods=['POST'])
def verify_face():
    try:
        # Get JSON data from request
        data = request.get_json()

        adhar_number = data['adhar_number']
        image_base64 = data['image']

        # Step 1: Get face embedding from MongoDB using Aadhaar number
        db_embedding = get_embedding_by_aadhar(adhar_number)
        db_embedding=db_embedding.reshape(1,128)
        print(db_embedding)
        print(db_embedding.shape)
        # Step 2: Decode the base64 image and generate embedding for the uploaded image
        uploaded_image = decode_base64_to_image(image_base64)

        # Convert the PIL image to NumPy array (required by DeepFace)
        uploaded_image_array = np.array(uploaded_image)
        # Step 3: Generate the embedding for the uploaded image
        uploaded_embedding = DeepFace.represent(img_path=uploaded_image_array, model_name="Facenet")

        # If the output is a list, access the first element
        if isinstance(uploaded_embedding, list):
            uploaded_embedding = uploaded_embedding[0]
        print("hello2")
        uploaded_vector = np.array(uploaded_embedding["embedding"]).reshape(1, -1)

        # Step 4: Calculate cosine similarity between the embeddings
        similarity = cosine_similarity(db_embedding, uploaded_vector)[0][0]
        print("hello3")
        # Step 5: Return the result
        return jsonify({
            "aadhaar_number": adhar_number,
            "similarity": similarity,
            "is_verified": bool(similarity > 0.7)
 # Example threshold for verification
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)

