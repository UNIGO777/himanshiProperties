const asyncHandler = require('../utils/asyncHandler');
const { generateOtp } = require('../utils/otp');
const { setOtp, verifyOtp } = require('../services/otpStore');
const { sendAdminOtp } = require('../emails');
const { generateToken } = require('../utils/token');

const loginAdmin = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  if (email !== process.env.ADMIN_EMAIL) return res.status(401).json({ message: 'Invalid admin email' });

  const code = generateOtp(6);
  setOtp(`admin:${email}`, code, 5 * 60 * 1000);
  await sendAdminOtp(process.env.ADMIN_EMAIL, code, 5);

  res.status(200).json({ message: 'OTP sent to admin email' });
});

const verifyAdminOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
  if (email !== process.env.ADMIN_EMAIL) return res.status(401).json({ message: 'Invalid admin email' });

  const ok = verifyOtp(`admin:${email}`, otp);
  if (!ok) return res.status(400).json({ message: 'Invalid or expired OTP' });

  const token = generateToken({ role: 'admin', email });
  res.status(200).json({ token });
});

module.exports = { loginAdmin, verifyAdminOtp };
