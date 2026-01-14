const transporter = require('../config/email');
const otpTemplate = require('./templates/otp');
const userOtpTemplate = require('./templates/userOtp');
const { buildMailOptions } = require('../utils/emailSender');

const sendTemplate = async (to, templateFn, params) => {
  if (!process.env.SMTP_HOST) throw new Error('SMTP not configured');
  const { subject, text, html } = templateFn(params);
  const mail = buildMailOptions({ to, subject, text, html });
  return transporter.sendMail(mail);
};

const sendAdminOtp = async (to, code, minutes) => {
  return sendTemplate(to, otpTemplate, { code, minutes });
};

const sendUserOtp = async (to, code, minutes, purpose) => {
  return sendTemplate(to, userOtpTemplate, { code, minutes, purpose });
};

module.exports = { sendTemplate, sendAdminOtp, sendUserOtp };
