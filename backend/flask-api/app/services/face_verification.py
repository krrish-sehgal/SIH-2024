import logging
from flask import jsonify
from .db_utils import get_embedding_by_aadhar, update_embedding
from .image_utils import decode_base64_to_image
from sklearn.metrics.pairwise import cosine_similarity
from deepface import DeepFace
import numpy as np
import datetime

def verify_face(request):
    try:

        if not request.is_json:
    
            return jsonify({"error": "Content-Type must be application/json"}), 400
            
        data = request.get_json()

        # Validate required fields
        required_fields = ["aadhaarNumber", "image", "timestamp"]
        for field in required_fields:
            if field not in data:
        
                return jsonify({"error": f"Missing required field: {field}"}), 400

        adhar_number = data["aadhaarNumber"]
        image_base64 = data['image']
        timestamp = data['timestamp']

        # Validate image data
        if not image_base64:
    
            return jsonify({"error": "Empty image data"}), 400
        
        try:
            # Step 1: Get face embedding from MongoDB using Aadhaar number
            db_embedding = get_embedding_by_aadhar(adhar_number)
            if db_embedding is None:
        
                return jsonify({"error": "No embedding found"}), 404
                
            db_timestamp = get_embedding(adhar_number)
            db_embedding=db_embedding.reshape(1,128)
            
            # Step 2: Decode the base64 image and generate embedding for the uploaded image
    
            uploaded_image = decode_base64_to_image(image_base64)
            print("hello0")
            # Convert the PIL image to NumPy array (required by DeepFace)
    
            uploaded_image_array = np.array(uploaded_image)
            # Step 3: Generate the embedding for the uploaded image
    
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
    
    
            return jsonify({"error": f"Image processing error: {str(e)}"}), 400

    except Exception as e:


        return jsonify({"error": str(e)}), 400

def authorize_face(request):
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
