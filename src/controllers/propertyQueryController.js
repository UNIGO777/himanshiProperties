const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const Property = require('../models/Property');
const PropertyQuery = require('../models/PropertyQuery');
const User = require('../models/User');

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

const normalizeEmail = (email) => {
  const s = cleanString(email);
  return s ? s.toLowerCase() : undefined;
};

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

const error400 = (message, details) => {
  const err = new Error(message);
  err.status = 400;
  if (details) err.details = details;
  return err;
};

const createPropertyQuery = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;

  const propertyId = req.params.propertyId;
  if (!isValidObjectId(propertyId)) throw error400('Invalid property id');

  const message = cleanString(req.body && req.body.message);
  if (!message) throw error400('Message is required');

  const propertyExists = await Property.exists({ _id: propertyId });
  if (!propertyExists) return res.status(404).json({ message: 'Property not found' });

  const userId = req.user && req.user.userId;
  if (!userId || !isValidObjectId(userId)) return res.status(401).json({ message: 'Unauthorized' });

  const user = await User.findById(userId).select('name email phone');
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const name = cleanString(req.body && req.body.name) || user.name;
  const email = normalizeEmail((req.body && req.body.email) || user.email);
  const phone = normalizePhone((req.body && req.body.phone) || user.phone);

  const query = await PropertyQuery.create({
    property: propertyId,
    user: userId,
    name,
    email,
    phone,
    message,
    status: 'New',
  });

  res.status(201).json(query);
});

const listQueriesForProperty = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;

  const propertyId = req.params.propertyId;
  if (!isValidObjectId(propertyId)) throw error400('Invalid property id');

  const propertyExists = await Property.exists({ _id: propertyId });
  if (!propertyExists) return res.status(404).json({ message: 'Property not found' });

  const userId = req.user && req.user.userId;
  const role = req.user && req.user.role;

  const filter = { property: propertyId };
  if (role !== 'admin') {
    if (!userId || !isValidObjectId(userId)) return res.status(401).json({ message: 'Unauthorized' });
    filter.user = userId;
  }

  let query = PropertyQuery.find(filter).sort({ createdAt: -1 }).populate('property', 'title propertyType listingType price city state');
  if (role === 'admin') query = query.populate('user', 'name email phone');
  const queries = await query;

  res.status(200).json(queries);
});

const listAllQueries = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  const queries = await PropertyQuery.find()
    .sort({ createdAt: -1 })
    .populate('user', 'name email phone')
    .populate('property', 'title propertyType listingType price city state');
  res.status(200).json(queries);
});

const searchAllQueries = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;

  const q = cleanString(req.query.q);
  const status = cleanString(req.query.status);
  const propertyId = cleanString(req.query.propertyId);
  const userId = cleanString(req.query.userId);
  const from = parseDateParam(req.query.from);
  const to = parseDateParam(req.query.to);

  const page = Math.max(1, cleanNumber(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, cleanNumber(req.query.limit) || 20));

  const filter = {};

  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safe, 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { message: regex }, { notes: regex }];
  }

  if (status) {
    if (!['New', 'Contacted', 'Closed'].includes(status)) throw error400('Invalid status');
    filter.status = status;
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

  const query = PropertyQuery.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name email phone')
    .populate('property', 'title propertyType listingType price city state');

  const [items, total] = await Promise.all([query.exec(), PropertyQuery.countDocuments(filter)]);
  const pages = Math.max(1, Math.ceil(total / limit));

  res.status(200).json({ items, meta: { total, page, pages, limit } });
});

module.exports = { createPropertyQuery, listQueriesForProperty, listAllQueries, searchAllQueries };
