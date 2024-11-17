const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function encryptModel(modelFile, publicKeyBase64) {
    if (!publicKeyBase64) {
        throw new Error("Public key is required");
    }

    const publicKeyDer = Buffer.from(publicKeyBase64, 'base64');
    const publicKey = crypto.createPublicKey({
        key: publicKeyDer,
        format: 'der',
        type: 'spki'
    });

    console.log("Converted Public Key in PEM format:", publicKey); 

    const aesKey = crypto.randomBytes(32); 

    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
    let encryptedModel = cipher.update(modelFile);
    encryptedModel = Buffer.concat([encryptedModel, cipher.final()]);

    const encryptedAesKey = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        aesKey
    );

    return {
        encryptedModel,
        encryptedAesKey,
        iv
    };
}

module.exports = {
    encryptModel
};