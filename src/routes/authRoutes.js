const express = require('express');
const { signup, verifySignupOtp, login, verifyLoginOtp } = require('../controllers/userAuthController');

const router = express.Router();

router.post('/signup', signup);
router.post('/signup/verify-otp', verifySignupOtp);
router.post('/login', login);
router.post('/login/verify-otp', verifyLoginOtp);

module.exports = router;
