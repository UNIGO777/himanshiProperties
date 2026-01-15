const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const Rating = require('../models/Rating');
const Property = require('../models/Property');
const User = require('../models/User');
const transporter = require('../config/email');
const { buildMailOptions } = require('../utils/emailSender');

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

const cleanNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const parseDateParam = (value) => {
  const s = cleanString(value);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const error400 = (message, details) => {
  const err = new Error(message);
  err.status = 400;
  if (details) err.details = details;
  return err;
};

const sendAdminRatingEmail = async ({ rating, property, user, isUpdate }) => {
  const to = (process.env.ADMIN_EMAIL || '').trim();
  if (!to) return;

  const subject = isUpdate ? 'Rating updated' : 'New rating received';
  const starsLine = `${rating.stars} / 5`;
  const comment = cleanString(rating.comment) || '-';

  const text = [
    subject,
    '',
    `Property: ${property?.title || '-'} (${property?._id || rating.property})`,
    `User: ${user?.name || '-'} (${user?.email || '-'})`,
    `Stars: ${starsLine}`,
    `Comment: ${comment}`,
    `Time: ${rating.createdAt ? new Date(rating.createdAt).toISOString() : '-'}`,
  ].join('\n');

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.4;">
      <h2 style="margin: 0 0 12px 0;">${subject}</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 720px;">
        <tr><td style="padding: 6px 0; color: #334155;">Property</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${property?.title || '-'}</td></tr>
        <tr><td style="padding: 6px 0; color: #334155;">Property ID</td><td style="padding: 6px 0; color: #0f172a;">${property?._id || rating.property}</td></tr>
        <tr><td style="padding: 6px 0; color: #334155;">User</td><td style="padding: 6px 0; color: #0f172a;">${user?.name || '-'} (${user?.email || '-'})</td></tr>
        <tr><td style="padding: 6px 0; color: #334155;">Stars</td><td style="padding: 6px 0; color: #0f172a;">${starsLine}</td></tr>
        <tr><td style="padding: 6px 0; color: #334155;">Comment</td><td style="padding: 6px 0; color: #0f172a;">${comment}</td></tr>
        <tr><td style="padding: 6px 0; color: #334155;">Time</td><td style="padding: 6px 0; color: #0f172a;">${rating.createdAt ? new Date(rating.createdAt).toLocaleString('en-IN') : '-'}</td></tr>
      </table>
    </div>
  `;

  const mail = buildMailOptions({ to, subject, text, html });
  await transporter.sendMail(mail);
};

const createPropertyRating = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;

  const propertyId = req.params.propertyId;
  if (!isValidObjectId(propertyId)) throw error400('Invalid property id');

  const userId = req.user && req.user.userId;
  if (!userId || !isValidObjectId(userId)) return res.status(401).json({ message: 'Unauthorized' });

  const stars = cleanNumber(req.body && req.body.stars);
  if (!stars || stars < 1 || stars > 5) throw error400('Stars must be between 1 and 5');
  const comment = cleanString(req.body && req.body.comment);

  const property = await Property.findById(propertyId).select('title propertyType listingType price city state');
  if (!property) return res.status(404).json({ message: 'Property not found' });

  const user = await User.findById(userId).select('name email phone');
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  let rating = await Rating.findOne({ property: propertyId, user: userId });
  const isUpdate = Boolean(rating);

  if (rating) {
    rating.stars = stars;
    rating.comment = comment;
    await rating.save();
  } else {
    rating = await Rating.create({ property: propertyId, user: userId, stars, comment });
  }

  try {
    await sendAdminRatingEmail({ rating, property, user, isUpdate });
  } catch {}

  res.status(isUpdate ? 200 : 201).json(rating);
});

const listAllRatings = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  const ratings = await Rating.find()
    .sort({ createdAt: -1 })
    .populate('user', 'name email phone')
    .populate('property', 'title propertyType listingType price city state');
  res.status(200).json(ratings);
});

const searchAllRatings = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;

  const q = cleanString(req.query.q);
  const stars = cleanNumber(req.query.stars);
  const propertyId = cleanString(req.query.propertyId);
  const userId = cleanString(req.query.userId);
  const from = parseDateParam(req.query.from);
  const to = parseDateParam(req.query.to);

  const page = Math.max(1, cleanNumber(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, cleanNumber(req.query.limit) || 20));

  const filter = {};

  if (stars !== undefined) {
    if (stars < 1 || stars > 5) throw error400('Invalid stars');
    filter.stars = stars;
  }

  if (propertyId) {
    if (!isValidObjectId(propertyId)) throw error400('Invalid propertyId');
    filter.property = propertyId;
  }

  if (userId) {
    if (!isValidObjectId(userId)) throw error400('Invalid userId');
    filter.user = userId;
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = startOfDay(from);
    if (to) filter.createdAt.$lte = endOfDay(to);
  }

  const query = Rating.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name email phone')
    .populate('property', 'title propertyType listingType price city state');

  const [items, total] = await Promise.all([query.exec(), Rating.countDocuments(filter)]);
  const pages = Math.max(1, Math.ceil(total / limit));

  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safe, 'i');
    const filtered = items.filter((x) => {
      const userMatch = regex.test(x.user?.name || '') || regex.test(x.user?.email || '') || regex.test(x.user?.phone || '');
      const propertyMatch = regex.test(x.property?.title || '') || regex.test(x.property?.city || '') || regex.test(x.property?.state || '');
      const commentMatch = regex.test(x.comment || '');
      return userMatch || propertyMatch || commentMatch;
    });
    return res.status(200).json({ items: filtered, meta: { total, page, pages, limit } });
  }

  res.status(200).json({ items, meta: { total, page, pages, limit } });
});

const getRatingById = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  const id = req.params.id;
  if (!isValidObjectId(id)) throw error400('Invalid rating id');
  const rating = await Rating.findById(id)
    .populate('user', 'name email phone')
    .populate('property', 'title propertyType listingType price city state');
  if (!rating) return res.status(404).json({ message: 'Rating not found' });
  res.status(200).json(rating);
});

module.exports = { createPropertyRating, listAllRatings, searchAllRatings, getRatingById };

