const express = require('express');
const router = express.Router();
const { verifyOTP, fetchUserDetails } = require('../controllers/auth.controllers');

router.post('/verify-otp', verifyOTP);
router.post('/fetch-details', fetchUserDetails);

module.exports = router;
