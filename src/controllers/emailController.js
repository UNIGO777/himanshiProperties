const mongoose = require('mongoose');
const transporter = require('../config/email');
const EmailLog = require('../models/EmailLog');
const asyncHandler = require('../utils/asyncHandler');

const sendEmail = asyncHandler(async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to || (!text && !html)) {
    return res.status(400).json({ message: 'Missing email fields' });
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const info = await transporter.sendMail({ from, to, subject, text, html });

  try {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      await EmailLog.create({
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      });
    }
  } catch {}

  res.status(200).json({
    message: 'Email sent',
    id: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });
});

module.exports = { sendEmail };
