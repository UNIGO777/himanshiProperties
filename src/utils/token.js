const jwt = require('jsonwebtoken');

const generateToken = (payload, expiresIn = '6h') => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign(payload, secret, { expiresIn });
};

module.exports = { generateToken };
