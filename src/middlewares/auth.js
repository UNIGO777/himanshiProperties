const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return res.status(401).json({ message: 'Unauthorized' });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ message: 'JWT_SECRET not configured' });

  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
};

const requireUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') return res.status(403).json({ message: 'Forbidden' });
  next();
};

module.exports = { protect, requireAdmin, requireUser };
