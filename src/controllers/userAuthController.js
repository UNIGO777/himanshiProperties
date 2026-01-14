const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const { generateOtp } = require('../utils/otp');
const { setOtp, verifyOtp } = require('../services/otpStore');
const { sendUserOtp } = require('../emails');
const { generateToken } = require('../utils/token');

const requireDb = (res) => {
  if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
    res.status(500).json({ message: 'Database not configured' });
    return false;
  }
  return true;
};

const cleanString = (value) => {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s.length ? s : undefined;
};

const normalizeEmail = (email) => String(email).toLowerCase().trim();

const normalizePhone = (phone) => {
  const s = cleanString(phone);
  if (!s) return undefined;
  return s.replace(/[^\d+]/g, '');
};

const signup = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  const { name, phone, email, password } = req.body;
  if (!name || !phone || !email || !password) {
    return res.status(400).json({ message: 'Name, phone, email and password required' });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedName = cleanString(name);
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedName) return res.status(400).json({ message: 'Invalid name' });
  if (!normalizedPhone || normalizedPhone.length < 7) return res.status(400).json({ message: 'Invalid phone' });

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing && existing.isVerified) return res.status(409).json({ message: 'User already exists' });

  const hashed = await bcrypt.hash(String(password), 10);
  const user = existing
    ? await User.findOneAndUpdate(
        { email: normalizedEmail },
        { name: normalizedName, phone: normalizedPhone, password: hashed, isVerified: false },
        { new: true }
      )
    : await User.create({
        name: normalizedName,
        phone: normalizedPhone,
        email: normalizedEmail,
        password: hashed,
        isVerified: false,
      });

  const code = generateOtp(6);
  setOtp(`user:signup:${normalizedEmail}`, code, 5 * 60 * 1000);
  await sendUserOtp(user.email, code, 5, 'signup');

  res.status(200).json({ message: 'OTP sent for signup' });
});

const verifySignupOtp = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

  const normalizedEmail = String(email).toLowerCase().trim();
  const ok = verifyOtp(`user:signup:${normalizedEmail}`, String(otp).trim());
  if (!ok) return res.status(400).json({ message: 'Invalid or expired OTP' });

  const user = await User.findOneAndUpdate({ email: normalizedEmail }, { isVerified: true }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const token = generateToken({ role: 'user', userId: String(user._id), email: user.email });
  res.status(200).json({ token });
});

const login = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (!user.isVerified) return res.status(403).json({ message: 'User not verified' });

  const okPassword = await bcrypt.compare(String(password), user.password);
  if (!okPassword) return res.status(401).json({ message: 'Invalid credentials' });

  const code = generateOtp(6);
  setOtp(`user:login:${normalizedEmail}`, code, 5 * 60 * 1000);
  await sendUserOtp(user.email, code, 5, 'login');

  res.status(200).json({ message: 'OTP sent for login' });
});

const verifyLoginOtp = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

  const normalizedEmail = String(email).toLowerCase().trim();
  const ok = verifyOtp(`user:login:${normalizedEmail}`, String(otp).trim());
  if (!ok) return res.status(400).json({ message: 'Invalid or expired OTP' });

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.isVerified) return res.status(403).json({ message: 'User not verified' });

  const token = generateToken({ role: 'user', userId: String(user._id), email: user.email });
  res.status(200).json({ token });
});

module.exports = { signup, verifySignupOtp, login, verifyLoginOtp };
