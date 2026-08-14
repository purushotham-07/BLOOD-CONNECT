const { validationResult } = require('express-validator');

/**
 * Express middleware that runs after one or more express-validator validation
 * chains. If any rule failed, respond 400 with the first error message.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  return next();
}

module.exports = validate;