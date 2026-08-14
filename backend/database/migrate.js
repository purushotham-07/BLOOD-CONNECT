/**
 * Simple, readable migration runner.
 *
 * - Reads .sql files from ./migrations in filename order.
 * - Tracks applied migrations in a `migrations` bookkeeping table.
 * - Wraps each migration in a transaction.
 *
 * Usage: npm run migrate
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function createBookkeepingTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      name        TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function pendingMigrations() {
  const { rows } = await pool.query('SELECT name FROM migrations');
  const applied = new Set(rows.map((r) => r.name));
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .filter((f) => !applied.has(f));
}

async function main() {
  await createBookkeepingTable();
  const pending = await pendingMigrations();
  if (pending.length === 0) {
    console.log('No pending migrations.');
  }
  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
      await client.query('COMMIT');
      console.log(`Applied: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Failed: ${file}`);
      throw err;
    } finally {
      client.release();
    }
  }
}

main()
  .then(() => {
    console.log('Migrations complete.');
    return pool.end();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    return pool.end().then(() => process.exit(1));
  });