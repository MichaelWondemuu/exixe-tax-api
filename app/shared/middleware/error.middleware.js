import { HttpError } from '../utils/http-error.js';
import { logger } from '../logger/logger.js';

export const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const isProd = (process.env.NODE_ENV ?? 'development') === 'production';
  let statusCode = err instanceof HttpError ? err.statusCode : 500;
  let message = err?.message ?? 'Internal Server Error';
  let details = err instanceof HttpError ? err.details : undefined;

  // Handle Sequelize Errors
  if (err && (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError')) {
    statusCode = 400;
    message = 'Validation Error';
    if (err.errors && Array.isArray(err.errors)) {
      details = {
        issues: err.errors.map(e => ({
          path: e.path,
          message: e.message,
          value: e.value,
          type: e.type
        }))
      };
      // Combine messages for simple strings
      message = `${message}: ${err.errors.map(e => e.message).join(', ')}`;
    }
  }

  const payload = {
    error: {
      message: message,
      code: err instanceof HttpError ? err.code : (err?.code || 'INTERNAL_SERVER_ERROR')
    }
  };

  if (details) {
    payload.error.details = details;
  }

  if (!isProd) {
    payload.error.stack = err?.stack;
    if (err?.error) payload.error.originalError = err.error; // Sometimes nested
  }

  // Log error with Winston
  const logData = {
    statusCode,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    error: {
      message: message,
      code: payload.error.code,
      stack: err?.stack,
      details
    }
  };

  if (statusCode >= 500) {
    logger.error('Server Error', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client Error', logData);
  } else {
    logger.info('Error Handled', logData);
  }

  res.status(statusCode).json(payload);
};
