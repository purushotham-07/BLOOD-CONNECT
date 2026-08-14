const { Pool } = require('pg');
const env = require('./env');

// A single reusable connection pool for the whole application.
// Do NOT create a new connection per request.
const pool = new Pool({
  connectionString: env.databaseUrl,
});

// Emitted when a client in the pool encounters an idle error (e.g. DB restarted).
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;