const { fetchDecryptedModelsFromS3 } = require("../utils/s3utils");
const { encryptModel } = require("../utils/encryptionUtils.js");
const { generateModelHash, signModelHash } = require("../utils/hashUtils.js");
const fs = require("fs");
const path = require("path");
const { fetchDecryptedModelsFromS3 } = require("./fetchDecryptedModelsFromS3");
const fs = require("fs").promises;
const path = require("path");
const { encryptModel, generateModelHash, signModelHash } = require("./encryptionUtils"); // Assuming these utility functions are implemented elsewhere

exports.getAllEncryptedModels = async (req, res, next) => {
  try {
    // Load the versioning file
    const versionsFilePath = path.resolve(__dirname, "../model_versions.json");
    const modelVersions = JSON.parse(await fs.readFile(versionsFilePath, "utf-8"));

    // Extract the public key from the request body
    const publicKeyBase64 = req.body.publicKey;
    if (!publicKeyBase64) {
      return res.status(400).json({ message: "Public key is required" });
    }

    // Prepare response for all models
    const encryptedModels = await Promise.all(
      Object.keys(modelVersions).map(async (modelName) => {
        try {
          // Fetch the decrypted model from S3
          const { modelFile } = await fetchDecryptedModelsFromS3(modelName);

          console.log(`Decrypted model file for ${modelName}:`, modelFile);

          // Encrypt the model
          const { encryptedModel, encryptedAesKey, iv } = encryptModel(modelFile, publicKeyBase64);

          // Generate and sign the model hash
          const modelHash = await generateModelHash(modelFile);
          console.log(`Model hash for ${modelName}:`, modelHash);
          const signedHash = signModelHash(modelHash);
          console.log(`Signed hash for ${modelName}:`, signedHash);

          // Return encrypted model data
          return {
            modelName,
            encryptedModel: encryptedModel.toString("base64"),
            encryptedAesKey: encryptedAesKey.toString("base64"),
            iv: iv.toString("base64"),
            signedHash,
            version: modelVersions[modelName],
          };
        } catch (error) {
          console.error(`Error processing model ${modelName}:`, error);
          throw error; // Continue processing other models
        }
      })
    );

    res.status(200).json({
      message: "Models encrypted and signed successfully",
      encryptedModels,
    });
  } catch (error) {
    console.error("Error fetching and processing models:", error);
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