const pool = require('../../config/database');

async function create({ donorProfileId, donationDate, component }) {
  const { rows } = await pool.query(
    `INSERT INTO donations (donor_id, donation_date, component)
     VALUES ($1, $2, $3)
     RETURNING id, donor_id, donation_date, component, verified, created_at`,
    [donorProfileId, donationDate, component]
  );
  return rows[0];
}

async function listByDonorProfileId(donorProfileId) {
  const { rows } = await pool.query(
    `SELECT id, donor_id, donation_date, component, verified, verified_by, created_at
       FROM donations
      WHERE donor_id = $1
      ORDER BY donation_date DESC`,
    [donorProfileId]
  );
  return rows;
}

module.exports = { create, listByDonorProfileId };