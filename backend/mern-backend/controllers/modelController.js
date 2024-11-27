const { combineAndSign } = require("../utils/hashUtils.js");
const { getEncryptedModelsAndHashes, fetchModelVersions } = require("../utils/processModel");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

exports.getAllEncryptedModels = async (req, res, next) => {
  const startTime = performance.now();
  try {
    console.log('Starting model encryption process...');
    
    const modelFetchStart = performance.now();
    const modelVersions = await fetchModelVersions();
    console.log(`Model versions fetched in ${performance.now() - modelFetchStart}ms`);

    const frontendPublicKeyBase64 = req.body.publicKey;
    if (!frontendPublicKeyBase64) {
      return res.status(400).json({ message: "Public key is required" });
    }
    
    const keyProcessStart = performance.now();
    const frontendPublicKey = Buffer.from(frontendPublicKeyBase64, 'base64');
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.generateKeys();
    const backendEphemeralPublicKey = ecdh.getPublicKey('base64'); 
    const sharedSecret = ecdh.computeSecret(frontendPublicKey);
    const aesKey = crypto.createHash("sha256").update(sharedSecret).digest();
    const iv = crypto.randomBytes(16);
    console.log(`Key processing completed in ${performance.now() - keyProcessStart}ms`);

    const encryptionStart = performance.now();
    const {encryptedModels, hashes} = await getEncryptedModelsAndHashes(modelVersions, aesKey, iv);
    console.log(`Model encryption completed in ${performance.now() - encryptionStart}ms`);

    const signingStart = performance.now();
    const signedHash = await combineAndSign(hashes);
    console.log(`Hash signing completed in ${performance.now() - signingStart}ms`);

    const response = {
      message: "Models encrypted and signed successfully",
      encryptedModels,
      iv: iv.toString("base64"),
      backendPublicKey: backendEphemeralPublicKey,
      signedCombinedHash: signedHash,
    };

    console.log(`Total processing time: ${performance.now() - startTime}ms`);
    res.status(200).json(response);
  } catch (error) {
    console.error(`Error after ${performance.now() - startTime}ms:`, error);
    res.status(500).json({ error: "Failed to fetch and process models." });
  }
};


exports.getPublicVerificationKey = async (req, res, next) => {
  try {
    const publicKey = fs.readFileSync(path.join(__dirname, "../digital_signature_keys/public_key.pem"), "utf8");
    res.status(200).json({ publicKey: publicKey });
  } catch (error) {
    console.error("Error fetching public key:", error);
    res.status(500).json({ error: "Failed to fetch public key." });
  }
}

exports.authenticate = async (req, res, next) => {
  res.status(200).json({ message: "Model verified and Authenticated." }); 
}
