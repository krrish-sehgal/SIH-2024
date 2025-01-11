const express = require("express");
const { getAllEncryptedModels,authenticate,getPublicVerificationKey,getModelVersions } = require("../controllers/model.controllers.js");
const { verifyModel } = require("../middleware/verifyModel.middleware.js");

const router = express.Router();

router.post("/encrypted-models", getAllEncryptedModels);
router.get("/public-verification-key", getPublicVerificationKey);
router.post("/authenticate", verifyModel, authenticate);
router.get("/model-versions", getModelVersions);

module.exports = router;
