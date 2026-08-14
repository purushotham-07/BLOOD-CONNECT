const { Pool } = require('pg');
const env = require('./env');

const isProduction = env.nodeEnv === 'production';
const requiresSsl =
  isProduction ||
  env.databaseUrl.includes('render.com') ||
  env.databaseUrl.includes('supabase') ||
  env.databaseUrl.includes('neon.tech') ||
  env.databaseUrl.includes('sslmode=require') ||
  process.env.PGSSLMODE === 'require';

const poolConfig = {
  connectionString: env.databaseUrl,
};

// Enable SSL with rejectUnauthorized: false for hosted cloud PostgreSQL instances (Render, Supabase, Neon, AWS RDS, etc.)
if (requiresSsl && !env.databaseUrl.includes('localhost') && !env.databaseUrl.includes('127.0.0.1')) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

// Single reusable connection pool for the whole application
const pool = new Pool(poolConfig);

// Emitted when a client in the pool encounters an idle error (e.g. DB restarted)
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;