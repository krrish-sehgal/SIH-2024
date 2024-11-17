const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

exports.getEncryptedModel = async (req, res, next) => {
    try {
        // Step 1: Read the public key from the request
        const publicKeyBase64 = req.body.publicKey;
        if (!publicKeyBase64) {
            return res.status(400).json({ message: "Public key is required" });
        }

        // Step 2: Convert the Base64 public key into proper format
        const publicKeyDer = Buffer.from(publicKeyBase64, 'base64');
        const publicKey = crypto.createPublicKey({
            key: publicKeyDer,
            format: 'der',
            type: 'spki'
        });

        console.log("Converted Public Key in PEM format:", publicKey); // Log for debugging

        // Step 3: Load the ML model file
        const modelPath = path.join(__dirname, "../models/antispoofing.onnx");
        if (!fs.existsSync(modelPath)) {
            return res.status(404).json({ message: "Model file not found" });
        }
        const modelData = fs.readFileSync(modelPath);

        // Step 4: Generate a random AES key (256 bits)
        const aesKey = crypto.randomBytes(32);  // AES-256

        // Step 5: Encrypt the model using the AES key
        const iv = crypto.randomBytes(16); // Initialization Vector for AES
        const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
        let encryptedModel = cipher.update(modelData);
        encryptedModel = Buffer.concat([encryptedModel, cipher.final()]);

        // Step 6: Encrypt the AES key using the RSA public key with proper padding
        const encryptedAesKey = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            aesKey
        );

        // Step 7: Send the encrypted model and encrypted AES key back to the frontend
        res.status(200).json({
            message: "Model encrypted successfully",
            encryptedModel: encryptedModel.toString("base64"),
            encryptedAesKey: encryptedAesKey.toString("base64"),
            iv: iv.toString("base64"), // Send the IV so it can be used for decryption
        });
    } catch (error) {
        console.error("Error in getEncryptedModel:", error); // Enhanced logging
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
            stack: error.stack  // Add stack trace for debugging
        });
    }
};
