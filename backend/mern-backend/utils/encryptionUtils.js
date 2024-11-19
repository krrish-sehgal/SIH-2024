const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function encryptModel(modelFile, publicKeyBase64) {
    try {
        if (!publicKeyBase64) {
            throw new Error("Public key is required");
        }

        // Convert base64 to DER format
        const publicKeyDer = Buffer.from(publicKeyBase64, 'base64');

        // Create public key object using spki format
        const publicKey = crypto.createPublicKey({
            key: publicKeyDer,
            format: 'der',
            type: 'spki'
        });

        // Generate AES key and IV
        const aesKey = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);

        // Encrypt the model with AES
        const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
        let encryptedModel = Buffer.concat([
            cipher.update(modelFile),
            cipher.final()
        ]);

        // Encrypt the AES key with RSA
        const encryptedAesKey = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            aesKey
        );

        return {
            encryptedModel: encryptedModel.toString('base64'),
            encryptedAesKey: encryptedAesKey.toString('base64'),
            iv: iv.toString('base64')
        };
    } catch (error) {
        console.error("Encryption error:", error);
        throw error;
    }
}

module.exports = { encryptModel };