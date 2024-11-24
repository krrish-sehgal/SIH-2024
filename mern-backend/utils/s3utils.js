const AWS = require("aws-sdk");
const s3 = new AWS.S3();


async function fetchDecryptedModelsFromS3(modelName, modelVersions) {
  const bucketName = process.env.S3_BUCKET_NAME; // Ensure this is set in your environment

  try {
    const modelVersion = modelVersions[modelName]; 
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
      modelFile: modelFile.Body, // The content of the model
    };
  } catch (error) {
    console.error("Error fetching model from S3:", error);
    throw error; // Rethrow the error for the caller to handle
  }
}

async function fetchPrivateKeyFromS3() {
  const bucketName = process.env.S3_BUCKET_NAME; // Ensure this is set in your environment

  try {
    const params = {
      Bucket: bucketName,
      Key: "keys/private_key.pem", // Path to your private key in S3
    };

    // Fetch the private key from S3
    const data = await s3.getObject(params).promise();
    return data.Body.toString("utf-8"); // Return the private key as a string
  } catch (error) {
    console.error("Error fetching private key from S3:", error);
    throw error;
  }
}

module.exports = { fetchDecryptedModelsFromS3 , fetchPrivateKeyFromS3};
