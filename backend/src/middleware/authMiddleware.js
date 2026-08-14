const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userRepository = require('../modules/users/user.repository');

/**
 * Authentication middleware.
 * 1. Read the Authorization header.
 * 2. Verify the Bearer token.
 * 3. Decode the user id and role.
 * 4. Load the user and attach them to req.user.
 */
async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized, token missing' });
  }

  const token = header.slice(7);
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized, invalid token' });
  }

  const user = await userRepository.findById(decoded.id).catch(() => null);
  if (!user || !user.enabled) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized' });
  }

  req.user = user;
  return next();
}

/**
 * Role-based authorization middleware. Usage: requireRole('ADMIN') or
 * requireRole('ADMIN', 'DONOR').
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: 'Forbidden: insufficient role' });
    }
    return next();
  };
}

module.exports = { protect, requireRole };