const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema(
  {
    to: [{ type: String }],
    subject: { type: String },
    text: { type: String },
    html: { type: String },
    messageId: { type: String },
    accepted: [{ type: String }],
    rejected: [{ type: String }],
    response: { type: String },
    error: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailLog', EmailLogSchema);
