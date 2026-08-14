const env = require('./env');

const configuredOrigins = (env.clientUrl || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

/**
 * Validates whether an incoming request Origin is allowed.
 * Supports configured domains, all Vercel preview/production URLs (*.vercel.app),
 * localhost/local development, and non-browser clients (origin is undefined).
 */
function isOriginAllowed(origin) {
  if (!origin) return true; // Server-to-server, mobile app, postman, curl

  const normalized = origin.replace(/\/$/, '');

  // Exact match with configured CLIENT_URL(s)
  if (configuredOrigins.includes(normalized) || configuredOrigins.includes('*')) {
    return true;
  }

  // Allow any *.vercel.app deployment
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(normalized)) {
    return true;
  }

  // Allow local dev origins
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
    return true;
  }

  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

module.exports = {
  isOriginAllowed,
  corsOptions,
};
