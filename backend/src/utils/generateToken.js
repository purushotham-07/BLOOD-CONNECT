const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign a short-lived, stateless JWT for the authenticated user.
 * The payload contains only the user id and role (no password, no secrets).
 */
function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

module.exports = generateToken;