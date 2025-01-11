
![SecureFace](https://socialify.git.ci/krrish-sehgal/SecureFace/image?description=1&forks=1&issues=1&name=1&owner=1&pulls=1&theme=Light)

# SecureFace
SecureFace is a project developed for UIDAI, an organization under the Indian government that provides unique identification to residents of India. It demonstrates a method for deploying machine learning models for real-time face authentication within web browsers, focusing on security.

Its a secure solution for browser-based ML applications where models are transmitted and executed on the client side. Its architecture can be extended to other applications requiring secure communication between the server and client.

For more info read my blog post [here](https://medium.com/@krrishsehgal03/how-we-secured-ml-models-for-real-time-authentication-on-browsers-3411ae40bc05).

## ⚙️ Features
- Browser Based Face Authentication
- Spoof detection
- Liveness detection
- Secure model transmission
- Tampering detection through digital signatures

---

## Project Structure and How to Get Started

### Backend/MERN API
Handles fetching models from S3, encryption using DHKE, serving the models to clients and the database(CIDR) operations.

**Steps to Run:**
1. Navigate to the `mern-api` directory:
```bash 
cd backend/mern-api
```
2. Install dependencies:
```bash
npm install
```
3. Configure the environment variables by copying `.env.example` to `.env` and filling in the required details.
4. Start the server:
```bash
node app.js
```

### Backend/Flask API
Handles face verification (i.e., verifying the user's face against the database).  

**Steps to Run:**
1. Configure the environment variables by copying `.env.example` to `.env` and filling in the required details.
2. Install dependencies:

```bash
pip install -r requirements.txt
```
3. Start the server:
```bash
python main.py
```
---

## Frontend

**Steps to Run:**
1. Navigate to the frontend directory.
2. Install dependencies:
```bash
npm install
```
3. Start the server:
```bash
npm start
```

---

## Cloud Configurations

### S3 Setup
1. Configure an S3 storage bucket.
2. Enable KMS encryption on the bucket.
3. Obtain the following keys and details:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `KMS_KEY_ID`
- `S3_BUCKET_NAME`

### GitHub CI/CD
1. Update the `backend/model_versions.json` file to trigger a new deployment.
2. Place the updated models in the `backend/s3-uploads` folder.
3. The CI/CD pipeline will automatically upload the models to S3.

Now the project is ready to run!

---

## 📸 Screenshots

|||
|:----------------------------------------:|:-----------------------------------------:|
| ![Imgur](https://i.imgur.com/nn0mglY.png) | ![Imgur](https://i.imgur.com/ofUs0re.png) |
| ![Imgur](https://i.imgur.com/JDlxUXk.png) | ![Imgur](https://i.imgur.com/TCgxsRR.png) |
| ![Imgur](https://i.imgur.com/TCgxsRR.png) | ![Imgur](https://i.imgur.com/DAyPZCJ.png) |
| ![Imgur](https://i.imgur.com/yl47zvk.png) | 

# Built With 🛠

- [NodeJS](https://nodejs.org/en/)  
  Node.js is an open-source, cross-platform, back-end JavaScript runtime environment.  
- [Express.js](https://expressjs.com/)  
  A minimal and flexible Node.js web application framework.  
- [MongoDB](https://www.mongodb.com/)  
  MongoDB is a document-oriented NoSQL database for modern applications.  
- [AWS](https://aws.amazon.com)  
  - [AWS S3](https://aws.amazon.com/s3/)  
    Amazon Simple Storage Service (Amazon S3) is an object storage service that offers scalability, data availability, security, and performance.  
  - [AWS EC2](https://aws.amazon.com/ec2/)  
    Amazon Elastic Compute Cloud (Amazon EC2) provides scalable computing capacity in the AWS cloud.  
- [NGINX](https://nginx.org/en/)  
  A high-performance web server, load balancer, and reverse proxy.  
- [React.js](https://reactjs.org/)  
  A JavaScript library for building user interfaces.  

---

## Techniques Used to Maintain Security 🔒

1. **KMS Encryption**:  
   Enabled at AWS S3 to secure stored models.  
2. **DHKE with RSA Encryption**:  
   Used for secure model transfer between the client and server.  
3. **Digital Signature Verification**:  
   Ensures tamper detection at the client side.  
4. **Script Obfuscation**:  
   Prevents reverse engineering and knowledge of model usage.  


