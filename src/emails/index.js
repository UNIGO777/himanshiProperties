const transporter = require('../config/email');
const otpTemplate = require('./templates/otp');
const userOtpTemplate = require('./templates/userOtp');

const sendTemplate = async (to, templateFn, params) => {
  if (!process.env.SMTP_HOST) throw new Error('SMTP not configured');
  if (!process.env.SMTP_USER && !process.env.SMTP_FROM) throw new Error('SMTP sender not configured');
  const { subject, text, html } = templateFn(params);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  return transporter.sendMail({ from, to, subject, text, html });
};

const sendAdminOtp = async (to, code, minutes) => {
  return sendTemplate(to, otpTemplate, { code, minutes });
};

const sendUserOtp = async (to, code, minutes, purpose) => {
  return sendTemplate(to, userOtpTemplate, { code, minutes, purpose });
};

module.exports = { sendTemplate, sendAdminOtp, sendUserOtp };
