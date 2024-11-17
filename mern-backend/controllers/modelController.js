const { fetchEncryptedFilesFromS3 } = require("../utils/s3utils");
// const { decryptDataKey } = require("../utils/kmsUtils");
// const { decryptFile } = require("../utils/decryptUtils");

/**
 * Fetch and decrypt all models from S3.
 */
exports.getAllEncryptedModels = async (req, res, next) => {
  try {
    const modelKey = "antispoofing.onnx"; // The model name you want to fetch
    fetchEncryptedFilesFromS3(modelKey)
      .then(({ modelFile, dataKey }) => {
        console.log("Encrypted model file:", modelFile);
        console.log("Encrypted data key:", dataKey);
      })
      .catch((error) => {
        console.error("Failed to fetch encrypted model and data key:", error);
      });
    res.json({ message: "success" });

    // Step 3: Return all decrypted models as JSON
    // res.status(200).json({
    //   models: decryptedModels,
    // });
  } catch (error) {
    console.error("Error fetching and decrypting models:", error);
    res.status(500).json({ error: "Failed to fetch and decrypt models." });
  }
};
