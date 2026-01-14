const express = require('express');
const { loginAdmin, verifyAdminOtp } = require('../controllers/adminAuthController');

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/verify-otp', verifyAdminOtp);

module.exports = router;
