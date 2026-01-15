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

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

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

const cleanNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const parseDateParam = (value) => {
  const s = cleanString(value);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const parseBooleanParam = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const s = String(value).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return undefined;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const error400 = (message, details) => {
  const err = new Error(message);
  err.status = 400;
  if (details) err.details = details;
  return err;
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
  if (user.isBlocked) return res.status(403).json({ message: 'User blocked' });

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
  if (user.isBlocked) return res.status(403).json({ message: 'User blocked' });

  const token = generateToken({ role: 'user', userId: String(user._id), email: user.email });
  res.status(200).json({ token });
});

const listAllUsers = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  const users = await User.find()
    .sort({ createdAt: -1 })
    .select('name email phone isVerified isBlocked createdAt updatedAt');
  res.status(200).json(users);
});

const searchAllUsers = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;

  const q = cleanString(req.query.q);
  const verified = parseBooleanParam(req.query.verified);
  const blocked = parseBooleanParam(req.query.blocked);
  const from = parseDateParam(req.query.from);
  const to = parseDateParam(req.query.to);

  const page = Math.max(1, cleanNumber(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, cleanNumber(req.query.limit) || 20));

  const filter = {};
  if (verified !== undefined) filter.isVerified = verified;
  if (blocked !== undefined) filter.isBlocked = blocked;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = startOfDay(from);
    if (to) filter.createdAt.$lte = endOfDay(to);
  }

  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const query = User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('name email phone isVerified isBlocked createdAt updatedAt');

  const [items, total] = await Promise.all([query.exec(), User.countDocuments(filter)]);
  const pages = Math.max(1, Math.ceil(total / limit));
  res.status(200).json({ items, meta: { total, page, pages, limit } });
});

const setUserBlocked = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  const id = req.params.id;
  if (!isValidObjectId(id)) throw error400('Invalid user id');

  const isBlocked = req.body ? parseBooleanParam(req.body.isBlocked) : undefined;
  if (isBlocked === undefined) throw error400('isBlocked must be boolean');

  const user = await User.findByIdAndUpdate(id, { isBlocked }, { new: true }).select('name email phone isVerified isBlocked createdAt updatedAt');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.status(200).json(user);
});

module.exports = { signup, verifySignupOtp, login, verifyLoginOtp, listAllUsers, searchAllUsers, setUserBlocked };
