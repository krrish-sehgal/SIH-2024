const AWS = require("aws-sdk");
const s3 = new AWS.S3();


async function fetchEncryptedFilesFromS3(modelKey) {
  const bucketName = process.env.S3_BUCKET_NAME; // Ensure this is set in your environment

  try {
    // Fetch the encrypted model file from S3
    const modelFileParams = {
      Bucket: bucketName,
      Key: `${modelKey}.enc`, // Assuming the model file is saved with '.enc' extension
    };

    const modelFile = await s3.getObject(modelFileParams).promise();

    // Fetch the encrypted data key from S3
    const dataKeyParams = {
      Bucket: bucketName,
      Key: `${modelKey}.dataKey.enc`, // Assuming the data key is saved with '.dataKey.enc' extension
    };

    const dataKey = await s3.getObject(dataKeyParams).promise();

    // Return both files as buffers
    return {
      modelFile: modelFile.Body, // The content of the encrypted model
      dataKey: dataKey.Body, // The content of the encrypted data key
    };
  } catch (error) {
    console.error("Error fetching files from S3:", error);
    throw error; // Rethrow the error for the caller to handle
  }
}

module.exports = { fetchEncryptedFilesFromS3};
