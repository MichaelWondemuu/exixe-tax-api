import express from 'express';

/**
 * Wraps async route handlers so rejected promises call `next(err)` (Express error middleware).
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => unknown} fn
 */
export const exceptionHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function isMountedRouter(fn) {
  return typeof fn === 'function' && Array.isArray(fn.stack);
}

/**
 * Wraps the last applicable handler in a route registration (middleware/controller).
 * Skips mounted routers and Express error handlers (arity 4).
 */
function wrapLastHandler(args) {
  const out = [...args];
  for (let i = out.length - 1; i >= 0; i--) {
    const fn = out[i];
    if (typeof fn !== 'function') continue;
    if (fn.length === 4) break;
    if (isMountedRouter(fn)) return out;
    out[i] = exceptionHandler(fn);
    break;
  }
  return out;
}

/**
 * Express {@link express.Router} that automatically applies {@link exceptionHandler}
 * to the last handler on each `use` / `get` / `post` / `put` / `patch` / `delete` / `all` call.
 *
 * @param {import('express').RouterOptions} [options]
 */
export function createAsyncRouter(options) {
  const router = express.Router(options);
  const methods = ['use', 'get', 'post', 'put', 'patch', 'delete', 'all'];
  for (const method of methods) {
    const original = router[method].bind(router);
    router[method] = (...args) => original(...wrapLastHandler(args));
  }
  return router;
}
