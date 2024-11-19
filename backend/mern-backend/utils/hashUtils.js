const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function generateModelHash(input) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");

    if (Buffer.isBuffer(input)) {
      // If input is a buffer, hash it directly
      hash.update(input);
      resolve(hash.digest("hex"));
    } else if (typeof input === "string") {
      // If input is a file path, stream it
      const stream = fs.createReadStream(input);

      stream.on("data", (chunk) => {
        hash.update(chunk);
      });

      stream.on("end", () => {
        resolve(hash.digest("hex"));
      });

      stream.on("error", (error) => {
        reject(error);
      });
    } else {
      reject(new Error("Input must be a file path string or Buffer"));
    }
  });
}

function signModelHash(modelHash) {
  try {
    const privateKeyPath = path.join(__dirname, "../digital_signature_keys/private_key.pem");
    console.log("Reading private key from:", privateKeyPath);

    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    console.log("Private key loaded, length:", privateKey.length);

    const sign = crypto.createSign("SHA256");
    sign.update(Buffer.from(modelHash, 'hex')); // Ensure hash is properly formatted
    const signedHash = sign.sign(privateKey, "base64");
    console.log("Hash signed successfully, length:", signedHash.length);

    return signedHash;
  } catch (error) {
    console.error("Error signing hash:", error);
    throw error;
  }
}

// Add a new function to get the public verification key
function getPublicVerificationKey() {
  try {
    const publicKeyPath = path.join(__dirname, "../digital_signature_keys/public_key.pem");
    return fs.readFileSync(publicKeyPath, "utf8");
  } catch (error) {
    console.error("Error reading public key:", error);
    throw error;
  }
}

module.exports = {
  generateModelHash,
  signModelHash,
  getPublicVerificationKey
};
