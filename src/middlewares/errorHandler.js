const notFound = (req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  const isMulter = err && (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE');
  const isMongooseValidation = err && err.name === 'ValidationError';
  const isMongooseCast = err && err.name === 'CastError';
  const isMongoDuplicate = err && err.code === 11000;
  const isJwt = err && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError');

  let status =
    err && (err.status || err.statusCode)
      ? Number(err.status || err.statusCode)
      : isMulter
        ? 400
        : isJwt
          ? 401
          : isMongooseValidation || isMongooseCast || isMongoDuplicate
            ? 400
            : 500;

  if (!Number.isFinite(status) || status < 100 || status > 599) status = 500;

  let message = err && err.message ? String(err.message) : 'Server Error';
  let details = err && err.details ? err.details : undefined;

  if (isMongooseValidation && err.errors) {
    message = 'Validation failed';
    details = Object.values(err.errors)
      .map((e) => e && e.message)
      .filter(Boolean);
  }

  if (isMongooseCast) {
    message = 'Invalid value';
  }

  if (isMongoDuplicate) {
    message = 'Duplicate value';
    details = err.keyValue ? err.keyValue : undefined;
  }

  if (isMulter) {
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large';
  }

  const payload = { message };
  if (details) payload.details = details;

  res.status(status).json(payload);
};

module.exports = { notFound, errorHandler };
