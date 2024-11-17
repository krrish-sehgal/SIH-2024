const crypto = require("crypto");
const fs = require("fs");

const AES_KEY = process.env.AES_SECRET_KEY; // 32 bytes
const AES_IV = process.env.AES_IV;         // 16 bytes

// Encrypt File
const encryptFile = (filePath) => {
  const cipher = crypto.createCipheriv("aes-256-cbc", AES_KEY, AES_IV);
  const input = fs.createReadStream(filePath);
  const encryptedPath = `${filePath}.enc`;
  const output = fs.createWriteStream(encryptedPath);

  input.pipe(cipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on("finish", () => resolve(encryptedPath));
    output.on("error", (err) => reject(err));
  });
};

// Decrypt File (For testing purposes)
const decryptFile = (encryptedPath) => {
  const decipher = crypto.createDecipheriv("aes-256-cbc", AES_KEY, AES_IV);
  const input = fs.createReadStream(encryptedPath);
  const decryptedPath = encryptedPath.replace(".enc", ".dec");
  const output = fs.createWriteStream(decryptedPath);

  input.pipe(decipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on("finish", () => resolve(decryptedPath));
    output.on("error", (err) => reject(err));
  });
};

module.exports = { encryptFile, decryptFile };
