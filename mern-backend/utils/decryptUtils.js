const crypto = require("crypto");

/**
 * Decrypt an encrypted file using AES-256-CBC.
 * @param {Buffer} encryptedData - Encrypted file content
 * @param {Buffer} decryptedKey - Decrypted data key
 * @returns {Buffer} - Returns the decrypted file content
 */
const decryptFile = (encryptedData, decryptedKey) => {
  const algorithm = "aes-256-cbc"; // Ensure this matches your encryption logic
  const iv = Buffer.alloc(16, 0); // Fixed IV (adjust if you used a different IV setup)

  // Create a decipher instance
  const decipher = crypto.createDecipheriv(algorithm, decryptedKey, iv);

  // Perform decryption
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted; // Return the decrypted file content
};

module.exports = {
  decryptFile,
};
