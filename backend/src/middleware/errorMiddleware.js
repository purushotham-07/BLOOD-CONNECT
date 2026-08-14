/**
 * Centralized error handler. Always returns a consistent JSON error shape.
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (statusCode >= 500) {
    // Never leak stack traces or internal details to clients in production.
    console.error(err);
  }

  res.status(statusCode).json({ success: false, message });
}

module.exports = errorMiddleware;