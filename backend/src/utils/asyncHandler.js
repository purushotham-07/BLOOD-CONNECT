/**
 * Wraps an async route handler so thrown errors / rejections are forwarded to the
 * centralized error middleware instead of crashing the process.
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;