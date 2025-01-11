import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize MongoDB client
MONGODB_URI = os.getenv("MONGODB_URI")
client = pymongo.MongoClient(MONGODB_URI)
db = client.sih
collection = db.users

def get_embedding_by_aadhar(aadhar_number):
    document = collection.find_one({"aadhaarNumber": aadhar_number})
    if document:
        return np.array(document["embedding"])
    return None

def update_embedding(aadhar_number, embedding, timestamp):
    collection.update_one(
        {"aadhaarNumber": aadhar_number},
        {"$set": {"embedding": embedding.tolist(), "timestamp": timestamp}}
    )
