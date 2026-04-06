import { HttpError } from '../utils/http-error.js';

export const notFoundMiddleware = (req, res, next) => {
  next(new HttpError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`));
};
