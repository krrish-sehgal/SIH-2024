const AWS = require("aws-sdk");
const kms = new AWS.KMS();
const fs = require('fs');  
const crypto = require('crypto');

const decryptDataKey = async (encryptedDataKey) => {
  const params = {
    CiphertextBlob: encryptedDataKey,
  };

  try {
    const data = await kms.decrypt(params).promise();
    return data.Plaintext; // Decrypted data key (buffer)
  } catch (error) {
    throw new Error("Error decrypting data key: " + error.message);
  }
};
async function decryptModel(encryptedModelBuffer, decryptedDataKeyBuffer) {
  try {
    // Convert the decrypted data key (Buffer) to string
    let decryptedDataKey = decryptedDataKeyBuffer;
    // Step 2: Extract IV (Assuming the first 16 bytes of the encrypted model file are the IV)
    const iv = encryptedModelBuffer.slice(0, 16);  // Extract IV (16 bytes)
    const encryptedModelWithoutIV = encryptedModelBuffer.slice(16);  // Rest of the ciphertext

    console.log("IV extracted:", iv);
    console.log("Decrypted data key length:", decryptedDataKey.length);
    console.log("Encrypted model length without IV:", encryptedModelWithoutIV.length);

    // Step 3: Decrypt the model using the decrypted data key and IV
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',    // AES-256-CBC algorithm
      decryptedDataKey, // Decrypted data key (32 bytes)
      iv                // IV (16 bytes)
    );

    // Decrypt the model
    let decryptedModel = decipher.update(encryptedModelWithoutIV);
    decryptedModel = Buffer.concat([decryptedModel, decipher.final()]);  // Finalize decryption

    console.log("Decrypted model:", decryptedModel);

    // If you want to save the decrypted model as a file:
    fs.writeFileSync('../../models/decrypted_spoofing_model.onnx', decryptedModel);
    
    return decryptedModel;
  } catch (error) {
    console.error("Error decrypting model:", error);
    throw error;  // Re-throw the error after logging
  }
}

module.exports = { decryptDataKey , decryptModel};
