// globalSetup: once per test run, ensure the dedicated test database exists and
// run all migrations against it. Credentials are derived from the real .env
// (DATABASE_URL) so tests work regardless of the local postgres password.
module.exports = async () => {
  const fs = require('fs');
  const path = require('path');
  const { Pool } = require('pg');
  require('dotenv').config();

  const baseUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/bloodconnect';
  const dbName = 'bloodconnect_test';
  const testUrl = baseUrl.replace(/\/[^/]+$/, `/${dbName}`);

  // 1) Ensure the test database exists (connect to the live DB from .env).
  const maintenance = new Pool({ connectionString: baseUrl });
  try {
    const { rowCount } = await maintenance.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    if (rowCount === 0) {
      await maintenance.query(`CREATE DATABASE ${dbName}`);
    }
  } catch (err) {
    console.error(
      `\nCould not reach PostgreSQL at ${baseUrl}. Backend tests require a running database.\n`,
      err.message
    );
  } finally {
    await maintenance.end().catch(() => {});
  }

  // 2) Run migrations idempotently against the test database.
  const pool = new Pool({ connectionString: testUrl });
  try {
    const dir = path.join(__dirname, '..', 'database', 'migrations');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    }
  } finally {
    await pool.end().catch(() => {});
  }
};