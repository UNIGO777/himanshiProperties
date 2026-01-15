const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stars: { type: Number, required: true, min: 1, max: 5, index: true },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

ratingSchema.index({ property: 1, user: 1 }, { unique: true });
ratingSchema.index({ property: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', ratingSchema);

