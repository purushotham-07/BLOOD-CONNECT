/**
 * Catch-all 404 handler for unknown routes.
 */
function notFoundMiddleware(req, res) {
  res.status(404).json({
    success: false,
    message: `Not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFoundMiddleware;