const AWS = require("aws-sdk");
const kms = new AWS.KMS();

/**
 * Decrypt an encrypted data key using AWS KMS.
 * @param {Buffer} encryptedKey - Encrypted data key as a Buffer
 * @returns {Promise<Buffer>} - Returns the decrypted plaintext key
 */
const decryptDataKey = async (encryptedKey) => {
  const result = await kms
    .decrypt({
      CiphertextBlob: encryptedKey,
    })
    .promise();

  return result.Plaintext; // Return the decrypted data key
};

module.exports = {
  decryptDataKey,
};
