const express = require('express');
const router = express.Router();
const { verifyOTP, fetchUserDetails } = require('../controllers/authController');

router.post('/verify-otp', verifyOTP);
router.get('/fetch-details', fetchUserDetails);

module.exports = router;
