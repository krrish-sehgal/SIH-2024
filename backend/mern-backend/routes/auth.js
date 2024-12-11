const express = require('express');
const router = express.Router();
const { verifyOTP } = require('../controllers/authController');

router.post('/verify-otp', verifyOTP);

module.exports = router;
