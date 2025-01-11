const AWS = require("aws-sdk");
const s3 = new AWS.S3();

async function fetchDecryptedModelsFromS3(modelName, modelVersion) {
  const bucketName = process.env.S3_BUCKET_NAME; 

  try {
    if (!modelVersion) {
      throw new Error(`Version not found for model ${modelName}`);
    }

    const modelKey = `${modelName}-${modelVersion}`;  

    const modelFileParams = {
      Bucket: bucketName,
      Key: modelKey,  
    };

    const modelFile = await s3.getObject(modelFileParams).promise();

    return {
      modelFile: modelFile.Body, 
    };
  } catch (error) {
    console.error("Error fetching model from S3:", error);
    throw error; 
  }
}

async function fetchPrivateKeyFromS3() {
  const bucketName = process.env.S3_BUCKET_NAME; 

  try {
    const params = {
      Bucket: bucketName,
      Key: "keys/private_key.pem", 
    };
    
    const data = await s3.getObject(params).promise();
    return data.Body.toString("utf-8"); 
  } catch (error) {
    console.error("Error fetching private key from S3:", error);
    throw error;
  }
}

module.exports = { fetchDecryptedModelsFromS3 , fetchPrivateKeyFromS3};
