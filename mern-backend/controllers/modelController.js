const { fetchDecryptedModelsFromS3 } = require("../utils/s3utils");
const { encryptModel } = require("../utils/encryptionUtils.js");
const { fetchPrivateKeyFromS3 } = require("../utils/s3utils"); // Import the function

const { generateModelHash, signModelHash } = require("../utils/hashUtils.js");
const fs = require("fs/promises"); // Ensure this is being used
const crypto = require("crypto");

const path = require("path");
const { versions } = require("process");

exports.getAllEncryptedModels = async (req, res, next) => {
  try {
    const versionsFilePath = path.resolve(__dirname, "../../model_versions.json");
    const modelVersions = JSON.parse(await fs.readFile(versionsFilePath, { encoding: "utf-8" }));


    // Extract the public key from the request body
    const publicKeyBase64 = req.body.publicKey;
    if (!publicKeyBase64) {
      return res.status(400).json({ message: "Public key is required" });
    }

    const aesKey = crypto.randomBytes(32); 
    const iv = crypto.randomBytes(16);

    const encryptedModels = []; 
    const hashes = []; 

    for (const modelName of Object.keys(modelVersions)) {
      try {

        const { modelFile } = await fetchDecryptedModelsFromS3(modelName,modelVersions);

        const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
        let encryptedModel = Buffer.concat([cipher.update(modelFile), cipher.final()]);

        const modelHash = await generateModelHash(modelFile);

        encryptedModels.push({
          modelName,
          encryptedModel: encryptedModel.toString("base64"),
          version: modelVersions[modelName],
        });

        hashes.push(Buffer.from(modelHash, "hex")); 
      } catch (error) {
        console.error(`Error processing model ${modelName}:`, error);
        throw error;
      }
    }

   const combinedHash = crypto.createHash("sha256").update(Buffer.concat(hashes)).digest();
    console.log(`Combined hash: ${combinedHash.toString("hex")}`);

    const privateKey = await fetchPrivateKeyFromS3();

    const signedHash = await signModelHash(combinedHash.toString("hex"), privateKey);
    console.log(`Signed combined hash: ${signedHash}`);
    
        // Convert base64 to DER format
        const publicKeyDer = Buffer.from(publicKeyBase64, 'base64');

        // Create public key object using spki format
        const publicKey = crypto.createPublicKey({
            key: publicKeyDer,
            format: 'der',
            type: 'spki'
        });

   
    const encryptedAesKey = crypto.publicEncrypt(
      {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
      },
      aesKey
  );
    res.status(200).json({
      message: "Models encrypted and signed successfully",
      encryptedModels,
      encryptedAesKey: encryptedAesKey.toString("base64"),
      iv: iv.toString("base64"),
      signedCombinedHash: signedHash,
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