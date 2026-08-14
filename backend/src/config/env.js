require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/bloodconnect',
  jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  // Default notification radius used when a donor does not supply one.
  bloodRequestRadiusKm: parseFloat(process.env.BLOOD_REQUEST_RADIUS_KM) || 10,

  // Request search radius (km) selected by urgency. Configurable, never hardcoded.
  matchingRadiusNormalKm: parseFloat(process.env.MATCHING_RADIUS_NORMAL_KM) || 10,
  matchingRadiusUrgentKm: parseFloat(process.env.MATCHING_RADIUS_URGENT_KM) || 20,
  matchingRadiusCriticalKm: parseFloat(process.env.MATCHING_RADIUS_CRITICAL_KM) || 30,

  // Upper bound on donors returned per request (performance, spec: LIMIT).
  matchingResultLimit: parseInt(process.env.MATCHING_RESULT_LIMIT, 10) || 50,

  donationIntervalDays: parseInt(process.env.DONATION_INTERVAL_DAYS, 10) || 56,
};