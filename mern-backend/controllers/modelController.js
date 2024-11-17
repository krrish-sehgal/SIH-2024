const {fetchEncryptedFilesFromS3} = require("../utils/s3utils");
const { encryptModel } = require("../utils/encryptionUtils.js");
const { generateModelHash, signModelHash } = require("../utils/hashUtils.js");  
const fs = require("fs");   
const path = require("path");
exports.getAllEncryptedModels = async (req, res, next) => {
  try {
    const modelKey = "antispofing.onnx"; 

    const { modelFile } = await fetchEncryptedFilesFromS3(
      modelKey
    );

    console.log("Decrypted model file:", modelFile);

    const publicKeyBase64 = req.body.publicKey;
        if (!publicKeyBase64) {
            return res.status(400).json({ message: "Public key is required" });
        }

        const { encryptedModel, encryptedAesKey, iv } = encryptModel(modelFile, publicKeyBase64);

        const modelHash = await generateModelHash(modelFile); // Add await here
        console.log("Model hash:", modelHash);
        const signedHash = signModelHash(modelHash);
        console.log("Signed hash:", signedHash);
        res.status(200).json({
            message: "Model encrypted and signed successfully",
            encryptedModel: encryptedModel.toString("base64"),
            encryptedAesKey: encryptedAesKey.toString("base64"),
            iv: iv.toString("base64"), 
            signedHash: signedHash,  
        });
  } catch (error) {
    console.error("Error fetching and decrypting models:", error);
    res.status(500).json({ error: "Failed to fetch and decrypt models." });
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