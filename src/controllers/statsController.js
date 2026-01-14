const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const Property = require('../models/Property');
const PropertyQuery = require('../models/PropertyQuery');
const User = require('../models/User');
const EmailLog = require('../models/EmailLog');

const requireDb = (res) => {
  if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
    res.status(500).json({ message: 'Database not configured' });
    return false;
  }
  return true;
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const toISODate = (d) => {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const listWebsiteStats = asyncHandler(async (req, res) => {
  if (!requireDb(res)) return;

  const now = new Date();
  const days = Math.max(7, Math.min(90, Number(req.query.days) || 30));
  const fromDate = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

  const [
    totalUsers,
    verifiedUsers,
    newUsersRange,
    totalProperties,
    verifiedProperties,
    featuredProperties,
    totalQueries,
    totalEmails,
    propertiesByType,
    propertiesByListingType,
    propertiesByStatus,
    topCities,
    queriesByStatus,
    queriesPerDay,
    queriesByPropertyType,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ createdAt: { $gte: fromDate } }),
    Property.countDocuments({}),
    Property.countDocuments({ verified: true }),
    Property.countDocuments({ isFeatured: true }),
    PropertyQuery.countDocuments({}),
    EmailLog.countDocuments({}),
    Property.aggregate([{ $group: { _id: '$propertyType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Property.aggregate([{ $group: { _id: '$listingType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Property.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Property.aggregate([
      { $match: { city: { $ne: null } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    PropertyQuery.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    PropertyQuery.aggregate([
      { $match: { createdAt: { $gte: fromDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    PropertyQuery.aggregate([
      { $match: { createdAt: { $gte: fromDate } } },
      { $lookup: { from: 'properties', localField: 'property', foreignField: '_id', as: 'propertyDoc' } },
      { $unwind: { path: '$propertyDoc', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$propertyDoc.propertyType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const dayBuckets = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(fromDate.getTime() + i * 24 * 60 * 60 * 1000);
    dayBuckets.push(toISODate(d));
  }

  const perDayMap = new Map(queriesPerDay.map((x) => [x._id, x.count]));
  const queriesTimeline = dayBuckets.map((label) => ({ date: label, count: perDayMap.get(label) || 0 }));

  res.status(200).json({
    range: { days, from: fromDate.toISOString(), to: now.toISOString() },
    totals: {
      users: totalUsers,
      verifiedUsers,
      newUsersRange,
      properties: totalProperties,
      verifiedProperties,
      featuredProperties,
      queries: totalQueries,
      emails: totalEmails,
    },
    properties: {
      byType: propertiesByType.map((x) => ({ label: x._id || 'Unknown', value: x.count })),
      byListingType: propertiesByListingType.map((x) => ({ label: x._id || 'Unknown', value: x.count })),
      byStatus: propertiesByStatus.map((x) => ({ label: x._id || 'Unknown', value: x.count })),
      topCities: topCities.map((x) => ({ label: x._id || 'Unknown', value: x.count })),
    },
    queries: {
      byStatus: queriesByStatus.map((x) => ({ label: x._id || 'Unknown', value: x.count })),
      timeline: queriesTimeline,
      byPropertyType: queriesByPropertyType.map((x) => ({ label: x._id || 'Unknown', value: x.count })),
    },
  });
});

module.exports = { listWebsiteStats };
