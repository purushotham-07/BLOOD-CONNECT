// Runs before each test file, in the same process, so the pg pool is created
// against a dedicated TEST database derived from the real .env credentials.
require('dotenv').config();

const base =
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@localhost:5432/bloodconnect';
// Swap the database name for an isolated test database.
const testUrl = process.env.TEST_DATABASE_URL || base.replace(/\/[^/]+$/, '/bloodconnect_test');

process.env.DATABASE_URL = testUrl;
process.env.JWT_SECRET = 'test_secret_123';
process.env.NODE_ENV = 'test';