from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import pymongo
import json
import datetime
import logging
import traceback

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app) 

# MongoDB connection setup
client = pymongo.MongoClient("mongodb://Krrish:krrish123@ac-7gvopvc-shard-00-00.1nxbntm.mongodb.net:27017,ac-7gvopvc-shard-00-01.1nxbntm.mongodb.net:27017,ac-7gvopvc-shard-00-02.1nxbntm.mongodb.net:27017/sih?replicaSet=atlas-11fue8-shard-0&ssl=true&authSource=admin&w=majority&appName=Cluster1")
db = client.sih  
collection = db.users  

# Utility function to decode base64 image to PIL image
def decode_base64_to_image(base64_str):
    # Decode the image
    img_data = base64.b64decode(base64_str)
    img = Image.open(BytesIO(img_data))
    return img

def get_embedding_by_aadhar(aadhar_number):
    try:
        # Query MongoDB for the document with the given Aadhar number
        document = collection.find_one({"aadhaarNumber": aadhar_number})
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

def get_embedding(aadhar_number):
    try:
        # Query MongoDB for the document with the given Aadhar number
        document = collection.find_one({"aadhaarNumber": aadhar_number})
        if not document:
            print("No entry found for the given Aadhar number.")
            return None

        return document["timestamp"]

    except Exception as e:
        print(f"An error occurred while retrieving the embedding: {e}")
        return None


# Verify endpoint
@app.route('/authenticate', methods=['POST'])
def verify_face():
    try:
        logger.info("Received authentication request")
        
        # Log request headers
        logger.debug("Request Headers: %s", request.headers)
        
        # Get and validate JSON data
        if not request.is_json:
            logger.error("Request doesn't contain JSON data")
            return jsonify({"error": "Content-Type must be application/json"}), 400
            
        data = request.get_json()
        logger.debug("Request data: %s", {k: '...' if k == 'image' else v for k, v in data.items()})
        
        # Validate required fields
        required_fields = ["aadhaarNumber", "image", "timestamp"]
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return jsonify({"error": f"Missing required field: {field}"}), 400

        adhar_number = data["aadhaarNumber"]
        image_base64 = data['image']
        timestamp = data['timestamp']

        # Validate image data
        if not image_base64:
            logger.error("Empty image data received")
            return jsonify({"error": "Empty image data"}), 400

        logger.info(f"Processing request for Aadhaar: {adhar_number}")
        
        try:
            # Step 1: Get face embedding from MongoDB using Aadhaar number
            db_embedding = get_embedding_by_aadhar(adhar_number)
            if db_embedding is None:
                logger.error(f"No embedding found for Aadhaar: {adhar_number}")
                return jsonify({"error": "No embedding found"}), 404
                
            db_timestamp = get_embedding(adhar_number)
            db_embedding=db_embedding.reshape(1,128)
            
            # Step 2: Decode the base64 image and generate embedding for the uploaded image
            logger.debug("Decoding base64 image")
            uploaded_image = decode_base64_to_image(image_base64)
            print("hello0")
            # Convert the PIL image to NumPy array (required by DeepFace)
            logger.debug("Converting to numpy array")
            uploaded_image_array = np.array(uploaded_image)
            # Step 3: Generate the embedding for the uploaded image
            logger.debug("Generating face embedding")
            uploaded_embedding = DeepFace.represent(img_path=uploaded_image_array, model_name="Facenet")
            print("hello1")
            # Modified timestamp handling
            if isinstance(db_timestamp, str):
                db_timestamp = datetime.datetime.strptime(db_timestamp, "%Y-%m-%dT%H:%M:%S.%f+00:00")
            elif isinstance(db_timestamp, datetime.datetime):
                # Already a datetime object, no conversion needed
                pass
                
            if isinstance(timestamp, str):
                uploaded_timestamp = datetime.datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S.%f+00:00")
            elif isinstance(timestamp, datetime.datetime):
                uploaded_timestamp = timestamp

            # Calculate time difference
            time_difference = uploaded_timestamp - db_timestamp
            months_difference = time_difference.days / 30  # Approximate months

            # If the output is a list, access the first element
            if isinstance(uploaded_embedding, list):
                uploaded_embedding = uploaded_embedding[0]
            uploaded_vector = np.array(uploaded_embedding["embedding"]).reshape(1, -1)

            # Step 4: Calculate cosine similarity between the embeddings
            similarity = cosine_similarity(db_embedding, uploaded_vector)[0][0]
            is_verified = bool(similarity > 0.7)

            # Only update if verified AND more than 6 months old
            if is_verified and months_difference > 6:
                print("Updating embedding - verification successful and older than 6 months")
                collection.update_one(
                    {"aadhaarNumber": adhar_number},
                    {
                        "$set": {
                            "embedding": uploaded_vector.tolist()[0],
                            "timestamp": timestamp
                        }
                    }
                )

            # Step 5: Return the result
            return jsonify({
                "aadhaarNumber": adhar_number,
                "similarity": similarity,
                "is_verified": is_verified
            })

        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({"error": f"Image processing error: {str(e)}"}), 400

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 400

@app.route('/authorize', methods=['POST'])
def authorize_face():
    try:
        # Get JSON data from request
        data = request.get_json()
        adhar_number = data["aadhaarNumber"]
        image_base64 = data['image']
        print("in authorise")
        # Get stored embedding from MongoDB
        db_embedding = get_embedding_by_aadhar(adhar_number)
        if db_embedding is None:
            return jsonify({"error": "No matching Aadhaar record found"}), 404
        
        db_embedding = db_embedding.reshape(1, 128)

        # Process uploaded image
        uploaded_image = decode_base64_to_image(image_base64)
        uploaded_image_array = np.array(uploaded_image)
        
        # Generate embedding for uploaded image
        uploaded_embedding = DeepFace.represent(img_path=uploaded_image_array, model_name="Facenet")
        
        if isinstance(uploaded_embedding, list):
            uploaded_embedding = uploaded_embedding[0]
        
        uploaded_vector = np.array(uploaded_embedding["embedding"]).reshape(1, -1)

        # Calculate similarity
        similarity = cosine_similarity(db_embedding, uploaded_vector)[0][0]

        return jsonify({
            "aadhaarNumber": adhar_number,
            "similarity": similarity,
            "is_authorized": bool(similarity > 0.7)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)

