// processModel.js
const fs = require("fs/promises");
const path = require("path");
const { fetchDecryptedModelsFromS3 } = require("./s3utils");
const { encryptModel } = require("./encryptionUtils");
const { generateModelHash } = require("./hashUtils");

async function processModel(modelName, modelVersion, aesKey, iv) {
  try {
    console.log(`Processing model ${modelName} version ${modelVersion}`);
    const { modelFile } = await fetchDecryptedModelsFromS3(modelName, modelVersion);
    console.log("modelFile", modelFile);
    const encryptedModel = encryptModel(modelFile, aesKey, iv);

    const modelHash = await generateModelHash(modelFile);
    
    return {
      modelName,
      encryptedModel: encryptedModel.toString("base64"),
      version: modelVersion,
      modelHash: modelFile,
    };
  } catch (error) {
    console.error(`Error processing model ${modelName}:`, error);
    throw error;
  }
}

async function getEncryptedModelsAndHashes(modelVersions, aesKey, iv) {
    const encryptedModels = [];
    const hashes = [];
  
    for (const modelName of Object.keys(modelVersions)) {
      const { encryptedModel, modelHash, version } = await processModel(
        modelName,
        modelVersions[modelName],
        aesKey,
        iv
      );
  
      encryptedModels.push({
        modelName,
        encryptedModel,
        version,
      });
  
      hashes.push(modelHash);
      
    }
    return { encryptedModels, hashes };
  };

  async function fetchModelVersions() {
    const versionsFilePath = path.resolve(__dirname, "../../model_versions.json");
    return JSON.parse(await fs.readFile(versionsFilePath, { encoding: "utf-8" }));
  }
module.exports = { getEncryptedModelsAndHashes , fetchModelVersions};
