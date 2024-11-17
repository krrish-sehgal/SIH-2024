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
  const privateKey = fs.readFileSync(path.join(__dirname, "../digital_signature_keys/private_key.pem"), "utf8");

  const sign = crypto.createSign("SHA256");
  sign.update(modelHash);
  const signedHash = sign.sign(privateKey, "base64");

  return signedHash;
}

module.exports = {
  generateModelHash,
  signModelHash,
};
