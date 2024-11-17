const express = require("express");
const { getAllEncryptedModels } = require("../controllers/modelController.js");

const router = express.Router();

router.post("/get-encrypted-model", getAllEncryptedModels);

module.exports = router;
