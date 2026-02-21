/**
 * Wraps async route handlers to automatically catch errors
 * and pass them to Express error middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
