const express = require('express');
const { getEncryptedModel } = require('../controllers/modelController');

const router = express.Router();

router.post('/get-encrypted-model', getEncryptedModel);

module.exports = router;

