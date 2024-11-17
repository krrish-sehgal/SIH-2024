const express = require("express");
const { getAllEncryptedModels, getPublicVerificationKey } = require("../controllers/modelController.js");

const router = express.Router();

router.post("/encrypted-model", getAllEncryptedModels);
router.get("/public-verification-key", getPublicVerificationKey);

module.exports = router;
