/**
 * Merge x-user-id / x-pin headers into body so a single Yup schema can validate verify-PIN.
 */
export function mergePinVerifyBody(req, res, next) {
  const base =
    req.body && typeof req.body === 'object' && !Array.isArray(req.body)
      ? { ...req.body }
      : {};
  req.body = {
    ...base,
    userId: base.userId ?? req.headers['x-user-id'],
    pin: base.pin ?? req.headers['x-pin'],
  };
  next();
}
