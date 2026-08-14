/**
 * Centralized error type. Attach an HTTP status code to any thrown error so the
 * error middleware can return a consistent JSON response.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

module.exports = AppError;