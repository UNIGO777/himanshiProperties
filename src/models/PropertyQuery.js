const mongoose = require('mongoose');

const propertyQuerySchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    message: { type: String, required: true, trim: true },

    status: { type: String, enum: ['New', 'Contacted', 'Closed'], default: 'New', index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

propertyQuerySchema.index({ property: 1, createdAt: -1 });

module.exports = mongoose.model('PropertyQuery', propertyQuerySchema);
