const express = require("express");
const { getAllEncryptedModels, getPublicVerificationKey } = require("../controllers/modelController.js");
const { verifyModel } = require("../middleware/verifyModel.js");

const router = express.Router();

router.post("/encrypted-models", getAllEncryptedModels);
router.get("/public-verification-key", getPublicVerificationKey);
// router.post("/authenticate", verifyModel, authenticate);
module.exports = router;
