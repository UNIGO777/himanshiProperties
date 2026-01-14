const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    propertyType: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    listingType: { type: String, enum: ['Sale', 'Rent', 'Lease'], required: true },
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Sold', 'Under Construction'],
      default: 'Available',
    },

    price: { type: Number, required: true },
    securityDeposit: { type: Number },
    maintenanceCharge: { type: Number },

    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: 'India' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },

    area: { type: Number },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    balconies: { type: Number },
    floor: { type: Number },
    totalFloors: { type: Number },
    facing: { type: String },
    furnishedStatus: { type: String, enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'] },
    ageOfProperty: { type: Number },

    amenities: [{ type: String }],

    images: [{ type: String }],
    videoUrl: { type: String },

    ownerName: { type: String },
    ownerContact: { type: String },
    

    verified: { type: Boolean, default: false },
    documents: [{ type: String }],

    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Property', propertySchema);
