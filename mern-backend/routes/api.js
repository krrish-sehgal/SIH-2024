const express = require("express");
const { getAllEncryptedModels, getPublicVerificationKey } = require("../controllers/modelController.js");

const router = express.Router();

<<<<<<< HEAD
router.post('/get-encrypted-model', getEncryptedModel);

module.exports = router;

=======
router.post("/encrypted-models", getAllEncryptedModels);
router.get("/public-verification-key", getPublicVerificationKey);

module.exports = router;
>>>>>>> 53bc14902bff97995de767afff5a86b247af3df8
