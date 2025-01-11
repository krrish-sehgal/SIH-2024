const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { fetchPrivateKeyFromS3 } = require("./s3utils");


async function combineAndSign(hashes) {
  try {
    const combinedHash = crypto.createHash("sha256").update(Buffer.concat(hashes)).digest();
    console.log(`Combined hash: ${combinedHash.toString("hex")}`);

    const privateKey = await fetchPrivateKeyFromS3();
    const sign = crypto.createSign("SHA256");
    sign.update(combinedHash);  
    const signedHash = sign.sign(privateKey, "base64");
    
    console.log("Hash signed successfully, length:", signedHash.length);

    return signedHash;
  } catch (error) {
    console.error("Error combining and signing hashes:", error);
    throw error;
  }
}
function generateModelHash(input) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");

    if (Buffer.isBuffer(input)) {

      hash.update(input);
      resolve(hash.digest("hex"));
    } else if (typeof input === "string") {

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

module.exports = {
  generateModelHash,
  combineAndSign,
};
