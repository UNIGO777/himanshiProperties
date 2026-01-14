const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const Property = require('../models/Property');

const PROPERTY_TYPES = new Set([
  'Apartment',
  'House',
  'Villa',
  'Plot',
  'Land',
  'Office',
  'Shop',
  'Showroom',
  'Warehouse',
  'Farmhouse',
  'PG',
  'Hostel',
  'Commercial',
  'Industrial',
]);

const LISTING_TYPES = new Set(['Sale', 'Rent', 'Lease']);
const STATUSES = new Set(['Available', 'Booked', 'Sold', 'Under Construction']);
const FURNISHED = new Set(['Furnished', 'Semi-Furnished', 'Unfurnished']);
const LISTED_BY = new Set(['Owner', 'Agent', 'Builder']);

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

const error400 = (message, details) => {
  const err = new Error(message);
  err.status = 400;
  if (details) err.details = details;
  return err;
};

const normalizeArrayStrings = (value) => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.map(cleanString).filter(Boolean);
  const one = cleanString(value);
  return one ? [one] : [];
};

const pickAllowed = (obj, allowed) => {
  const out = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key];
  }
  return out;
};

const validateAndBuildPayload = (input, { partial }) => {
  const allowed = [
    'title',
    'description',
    'propertyType',
    'listingType',
    'status',
    'price',
    'securityDeposit',
    'maintenanceCharge',
    'address',
    'city',
    'state',
    'pincode',
    'country',
    'coordinates',
    'area',
    'bedrooms',
    'bathrooms',
    'balconies',
    'floor',
    'totalFloors',
    'facing',
    'furnishedStatus',
    'ageOfProperty',
    'amenities',
    'images',
    'videoUrl',
    'ownerName',
    'ownerContact',
    'listedBy',
    'verified',
    'documents',
    'views',
    'isFeatured',
  ];

  const raw = pickAllowed(input || {}, allowed);
  const payload = {};
  const errors = [];

  const title = cleanString(raw.title);
  if (!partial || raw.title !== undefined) {
    if (!title) errors.push('title is required');
    else payload.title = title;
  }

  const description = cleanString(raw.description);
  if (description !== undefined) payload.description = description;

  const propertyType = cleanString(raw.propertyType);
  if (!partial || raw.propertyType !== undefined) {
    if (!propertyType || !PROPERTY_TYPES.has(propertyType)) errors.push('propertyType is invalid');
    else payload.propertyType = propertyType;
  }

  const listingType = cleanString(raw.listingType);
  if (!partial || raw.listingType !== undefined) {
    if (!listingType || !LISTING_TYPES.has(listingType)) errors.push('listingType is invalid');
    else payload.listingType = listingType;
  }

  const status = cleanString(raw.status);
  if (status !== undefined) {
    if (!STATUSES.has(status)) errors.push('status is invalid');
    else payload.status = status;
  }

  const price = cleanNumber(raw.price);
  if (!partial || raw.price !== undefined) {
    if (price === undefined || price < 0) errors.push('price must be a valid number');
    else payload.price = price;
  }

  const securityDeposit = cleanNumber(raw.securityDeposit);
  if (securityDeposit !== undefined) {
    if (securityDeposit < 0) errors.push('securityDeposit must be >= 0');
    else payload.securityDeposit = securityDeposit;
  }

  const maintenanceCharge = cleanNumber(raw.maintenanceCharge);
  if (maintenanceCharge !== undefined) {
    if (maintenanceCharge < 0) errors.push('maintenanceCharge must be >= 0');
    else payload.maintenanceCharge = maintenanceCharge;
  }

  const address = cleanString(raw.address);
  if (address !== undefined) payload.address = address;
  const city = cleanString(raw.city);
  if (city !== undefined) payload.city = city;
  const state = cleanString(raw.state);
  if (state !== undefined) payload.state = state;
  const pincode = cleanString(raw.pincode);
  if (pincode !== undefined) payload.pincode = pincode;
  const country = cleanString(raw.country);
  if (country !== undefined) payload.country = country;

  if (raw.coordinates !== undefined) {
    const lat = raw.coordinates && cleanNumber(raw.coordinates.lat);
    const lng = raw.coordinates && cleanNumber(raw.coordinates.lng);
    if (lat === undefined || lng === undefined) errors.push('coordinates.lat and coordinates.lng must be numbers');
    else payload.coordinates = { lat, lng };
  }

  const area = cleanNumber(raw.area);
  if (area !== undefined) {
    if (area < 0) errors.push('area must be >= 0');
    else payload.area = area;
  }

  const bedrooms = cleanNumber(raw.bedrooms);
  if (bedrooms !== undefined) payload.bedrooms = bedrooms;
  const bathrooms = cleanNumber(raw.bathrooms);
  if (bathrooms !== undefined) payload.bathrooms = bathrooms;
  const balconies = cleanNumber(raw.balconies);
  if (balconies !== undefined) payload.balconies = balconies;
  const floor = cleanNumber(raw.floor);
  if (floor !== undefined) payload.floor = floor;
  const totalFloors = cleanNumber(raw.totalFloors);
  if (totalFloors !== undefined) payload.totalFloors = totalFloors;
  const facing = cleanString(raw.facing);
  if (facing !== undefined) payload.facing = facing;

  const furnishedStatus = cleanString(raw.furnishedStatus);
  if (furnishedStatus !== undefined) {
    if (!FURNISHED.has(furnishedStatus)) errors.push('furnishedStatus is invalid');
    else payload.furnishedStatus = furnishedStatus;
  }

  const ageOfProperty = cleanNumber(raw.ageOfProperty);
  if (ageOfProperty !== undefined) {
    if (ageOfProperty < 0) errors.push('ageOfProperty must be >= 0');
    else payload.ageOfProperty = ageOfProperty;
  }

  const amenities = normalizeArrayStrings(raw.amenities);
  if (amenities !== undefined) payload.amenities = amenities;

  const images = normalizeArrayStrings(raw.images);
  if (images !== undefined) payload.images = images;
  const videoUrl = cleanString(raw.videoUrl);
  if (videoUrl !== undefined) payload.videoUrl = videoUrl;

  const ownerName = cleanString(raw.ownerName);
  if (ownerName !== undefined) payload.ownerName = ownerName;
  const ownerContact = cleanString(raw.ownerContact);
  if (ownerContact !== undefined) payload.ownerContact = ownerContact;

  const listedBy = cleanString(raw.listedBy);
  if (listedBy !== undefined) {
    if (!LISTED_BY.has(listedBy)) errors.push('listedBy is invalid');
    else payload.listedBy = listedBy;
  }

  if (raw.verified !== undefined) payload.verified = Boolean(raw.verified);
  if (raw.isFeatured !== undefined) payload.isFeatured = Boolean(raw.isFeatured);

  const documents = normalizeArrayStrings(raw.documents);
  if (documents !== undefined) payload.documents = documents;

  const views = cleanNumber(raw.views);
  if (views !== undefined) {
    if (views < 0) errors.push('views must be >= 0');
    else payload.views = views;
  }

  if (errors.length) throw error400('Invalid property payload', errors);
  return payload;
};

const listProperties = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  const properties = await Property.find().sort({ createdAt: -1 });
  res.status(200).json(properties);
});

const getProperty = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  if (!isValidObjectId(req.params.id)) throw error400('Invalid property id');
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: 'Property not found' });
  res.status(200).json(property);
});

const createProperty = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  const payload = validateAndBuildPayload(req.body, { partial: false });
  if (req.user && req.user.userId) payload.createdBy = req.user.userId;
  const property = await Property.create(payload);
  res.status(201).json(property);
});

const updateProperty = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  if (!isValidObjectId(req.params.id)) throw error400('Invalid property id');
  const payload = validateAndBuildPayload(req.body, { partial: true });
  if (Object.keys(payload).length === 0) throw error400('No valid fields to update');
  const property = await Property.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!property) return res.status(404).json({ message: 'Property not found' });
  res.status(200).json(property);
});

const deleteProperty = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;
  if (!isValidObjectId(req.params.id)) throw error400('Invalid property id');
  const property = await Property.findByIdAndDelete(req.params.id);
  if (!property) return res.status(404).json({ message: 'Property not found' });
  res.status(200).json({ message: 'Property deleted' });
});

const searchProperties = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;

  const q = cleanString(req.query.q);
  const city = cleanString(req.query.city);
  const state = cleanString(req.query.state);
  const pincode = cleanString(req.query.pincode);
  const propertyType = cleanString(req.query.propertyType);
  const listingType = cleanString(req.query.listingType);
  const status = cleanString(req.query.status);
  const furnishedStatus = cleanString(req.query.furnishedStatus);
  const listedBy = cleanString(req.query.listedBy);
  const facing = cleanString(req.query.facing);
  const verified = req.query.verified !== undefined ? String(req.query.verified) === 'true' : undefined;
  const isFeatured = req.query.isFeatured !== undefined ? String(req.query.isFeatured) === 'true' : undefined;
  const minPrice = cleanNumber(req.query.minPrice);
  const maxPrice = cleanNumber(req.query.maxPrice);
  const minArea = cleanNumber(req.query.minArea);
  const maxArea = cleanNumber(req.query.maxArea);
  const minBedrooms = cleanNumber(req.query.minBedrooms);
  const minBathrooms = cleanNumber(req.query.minBathrooms);
  const amenitiesParam = cleanString(req.query.amenities);

  const page = Math.max(1, cleanNumber(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, cleanNumber(req.query.limit) || 20));
  const sortBy = cleanString(req.query.sortBy) || 'createdAt';
  const sortOrder = (cleanString(req.query.sortOrder) || 'desc').toLowerCase() === 'asc' ? 1 : -1;

  const filter = {};

  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { title: regex },
      { description: regex },
      { address: regex },
      { city: regex },
      { state: regex },
      { pincode: regex },
      { ownerName: regex },
    ];
  }

  if (city) filter.city = city;
  if (state) filter.state = state;
  if (pincode) filter.pincode = pincode;
  if (propertyType) {
    if (PROPERTY_TYPES.has(propertyType)) filter.propertyType = propertyType;
  }
  if (listingType) {
    if (LISTING_TYPES.has(listingType)) filter.listingType = listingType;
  }
  if (status) {
    if (STATUSES.has(status)) filter.status = status;
  }
  if (furnishedStatus) {
    if (FURNISHED.has(furnishedStatus)) filter.furnishedStatus = furnishedStatus;
  }
  if (listedBy) {
    if (LISTED_BY.has(listedBy)) filter.listedBy = listedBy;
  }
  if (facing) filter.facing = facing;
  if (verified !== undefined) filter.verified = verified;
  if (isFeatured !== undefined) filter.isFeatured = isFeatured;

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (minArea !== undefined || maxArea !== undefined) {
    filter.area = {};
    if (minArea !== undefined) filter.area.$gte = minArea;
    if (maxArea !== undefined) filter.area.$lte = maxArea;
  }
  if (minBedrooms !== undefined) filter.bedrooms = { $gte: minBedrooms };
  if (minBathrooms !== undefined) filter.bathrooms = { $gte: minBathrooms };

  if (amenitiesParam) {
    const amenities = amenitiesParam.split(',').map((s) => cleanString(s)).filter(Boolean);
    if (amenities.length) filter.amenities = { $all: amenities };
  }

  const sort = {};
  if (['createdAt', 'price', 'area', 'views'].includes(sortBy)) sort[sortBy] = sortOrder;
  else sort.createdAt = -1;

  const query = Property.find(filter).sort(sort).skip((page - 1) * limit).limit(limit);

  const [items, total] = await Promise.all([query.exec(), Property.countDocuments(filter)]);
  const pages = Math.max(1, Math.ceil(total / limit));

  res.status(200).json({ items, meta: { total, page, pages, limit } });
});

module.exports = { listProperties, getProperty, createProperty, updateProperty, deleteProperty, searchProperties };
