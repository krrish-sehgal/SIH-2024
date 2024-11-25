const crypto = require('crypto');
// Function to encrypt the model using AES-256-CBC
function encryptModel(modelFile, aesKey, iv) {
  const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
  let encryptedModel = Buffer.concat([cipher.update(modelFile), cipher.final()]);
  return encryptedModel;
}

// Function to encrypt the AES key with the public key
function encryptAesKey(aesKey, publicKeyBase64) {

    const publicKeyDer = Buffer.from(publicKeyBase64, 'base64');

    const publicKey = crypto.createPublicKey({
        key: publicKeyDer,
        format: 'der',
        type: 'spki'
    });

  return crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    aesKey
  );
}

module.exports = { encryptModel, encryptAesKey };
