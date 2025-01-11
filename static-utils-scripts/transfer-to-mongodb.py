from deepface import DeepFace
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from pymongo import MongoClient
import datetime
import cv2 

# Connect to MongoDB
client = MongoClient("mongodb_cluster_id")  
db = client.sih # Choose your database name
collection = db.users # Choose your collection name

# Ask for the number of entries
num_entries = int(input("Enter the number of entries: "))

for i in range(num_entries):
    try:
        print(f"\nProcessing entry {i + 1} of {num_entries}...")

        # Capture an image from the webcam
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Could not access the webcam.")
            break

        print("Press 'Space' to capture the image or 'q' to quit.")
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to capture frame from webcam.")
                break

            # Display the video feed
            cv2.imshow("Webcam - Press Space to Capture", frame)

            # Wait for the user to press 'Space' (key code 32) or 'q' (key code 113)
            key = cv2.waitKey(1) & 0xFF
            if key == 32:  # Space key
                image_path = f"captured_image_{i + 1}.jpg"
                cv2.imwrite(image_path, frame)
                print(f"Image captured and saved as {image_path}")
                break
            elif key == ord('q'):
                print("Exiting...")
                cap.release()
                cv2.destroyAllWindows()
                exit()

        cap.release()
        cv2.destroyAllWindows()

        # Step 1: Generate face embeddings
        embedding = DeepFace.represent(img_path=image_path, model_name="Facenet")

        # If the output is a list, access the first element
        if isinstance(embedding, list):
            embedding = embedding[0]

        # Extracting embedding vector
        vector = np.array(embedding["embedding"]).flatten()
        vector.flatten()

        # Collect metadata from the user
        name = input("Enter name: ")
        aadhar = int(input("Enter the Aadhar number: "))

        # Prepare the data to store in MongoDB
        data = {
            "image_path": image_path,
            "embedding": vector.tolist(),  # Convert the flattened numpy array to a list for MongoDB compatibility
            "name": name,
            "aadhaarNumber": aadhar,
            "timestamp": datetime.datetime.now()
        }

        # Insert the data into MongoDB
        collection.insert_one(data)
        print("Data successfully stored in MongoDB.")

    except Exception as e:
        print(f"An error occurred: {e}")
