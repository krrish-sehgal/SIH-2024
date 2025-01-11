const crypto = require('crypto');

function encryptModel(modelFile, aesKey, iv) {
  const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
  let encryptedModel = Buffer.concat([cipher.update(modelFile), cipher.final()]);
  return encryptedModel;
}
module.exports = { encryptModel};
