const pool = require('../../config/database');

// Columns we are safe to return to clients (never includes password_hash).
const SAFE_COLUMNS =
  'id, name, email, phone, role, enabled, created_at, updated_at';

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

/** Includes password_hash - only used internally for login verification. */
async function findByEmailWithHash(email) {
  const { rows } = await pool.query(
    `SELECT id, name, email, phone, role, enabled, password_hash
       FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function create({ name, email, passwordHash, phone, role }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${SAFE_COLUMNS}`,
    [name, email, passwordHash, phone || null, role || 'REQUESTER']
  );
  return rows[0];
}

async function updateProfile(id, { name, phone }) {
  const { rows } = await pool.query(
    `UPDATE users
        SET name = COALESCE($2, name),
            phone = COALESCE($3, phone),
            updated_at = now()
      WHERE id = $1
      RETURNING ${SAFE_COLUMNS}`,
    [id, name || null, phone || null]
  );
  return rows[0] || null;
}

/** Return the user's saved location (PostGIS point) or null if unset. */
async function getLocation(id) {
  const { rows } = await pool.query(
    `SELECT
       ST_X(location::geometry) AS longitude,
       ST_Y(location::geometry) AS latitude
     FROM users
     WHERE id = $1 AND location IS NOT NULL`,
    [id]
  );
  return rows[0] || null;
}

/** Save the user's location as a PostGIS geography point. */
async function setLocation(id, latitude, longitude) {
  const { rows } = await pool.query(
    `UPDATE users
        SET location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
            updated_at = now()
      WHERE id = $1
      RETURNING
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude`,
    [id, longitude, latitude]
  );
  return rows[0] || null;
}

module.exports = {
  findById,
  findByEmail,
  findByEmailWithHash,
  create,
  updateProfile,
  getLocation,
  setLocation,
};