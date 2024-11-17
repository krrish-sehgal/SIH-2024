const {
  fetchEncryptedFilesFromS3,

} = require("../utils/s3utils");
const {   decryptDataKey,
    decryptModel} = require("../utils/decryptUtils");

/**
 * Fetch and decrypt all models from S3.
 */
exports.getAllEncryptedModels = async (req, res, next) => {
  try {
    const modelKey = "antispofing.onnx"; // The model name you want to fetch

    // Fetch encrypted files from S3
    const { modelFile } = await fetchEncryptedFilesFromS3(
      modelKey
    );

    console.log("Decrypted model file:", modelFile);

    // You can now send the decrypted model back or use it in your application
    res.status(200).send({ message: "data key decrypted successfully." });
  } catch (error) {
    console.error("Error fetching and decrypting models:", error);
    res.status(500).json({ error: "Failed to fetch and decrypt models." });
  }
};
