require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { notFound, errorHandler } = require('./src/middlewares/errorHandler');
const adminAuthRoutes = require('./src/routes/adminAuthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const propertyRoutes = require('./src/routes/propertyRoutes');
const { router: propertyQueryRoutes, adminRouter: allQueryRoutes } = require('./src/routes/propertyQueryRoutes');
const { router: propertyRatingRoutes, adminRouter: allRatingRoutes } = require('./src/routes/ratingRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const { connectDB } = require('./src/config/db');

const redactValue = (value, depth = 0) => {
  if (depth > 3) return '[Truncated]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    if (value.length > 20) return [...value.slice(0, 20).map((v) => redactValue(v, depth + 1)), `…(+${value.length - 20})`];
    return value.map((v) => redactValue(v, depth + 1));
  }
  if (typeof value === 'object') {
    const out = {};
    const keys = Object.keys(value);
    const sliced = keys.slice(0, 30);
    for (const k of sliced) {
      if (/(authorization|cookie|set-cookie|password|pass|otp|token|secret|key)/i.test(k)) out[k] = '[REDACTED]';
      else out[k] = redactValue(value[k], depth + 1);
    }
    if (keys.length > sliced.length) out._moreKeys = `+${keys.length - sliced.length}`;
    return out;
  }
  return String(value);
};

const requestLogger = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const headers = redactValue(req.headers);
    const body = req.body ? redactValue(req.body) : undefined;
    const query = req.query && Object.keys(req.query).length ? redactValue(req.query) : undefined;
    const params = req.params && Object.keys(req.params).length ? redactValue(req.params) : undefined;

    const log = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
      user: req.user ? redactValue(req.user) : undefined,
      query,
      params,
      body,
      headers,
    };

    const parts = [
      `[${new Date().toISOString()}]`,
      `${log.method} ${log.path}`,
      `${log.status}`,
      `${log.durationMs}ms`,
    ];
    console.log(parts.join(' '));
    console.log(JSON.stringify(log, null, 2));
  });

  next();
};

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
if (process.env.NODE_ENV !== 'production') app.use(requestLogger);

connectDB();

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/properties/:propertyId/queries', propertyQueryRoutes);
app.use('/api/properties/:propertyId/ratings', propertyRatingRoutes);
app.use('/api/queries', allQueryRoutes);
app.use('/api/ratings', allRatingRoutes);
app.use('/api/admin/stats', statsRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}/`);
});
