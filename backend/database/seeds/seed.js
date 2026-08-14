/**
 * Seed script - creates demo Receiver and Donor accounts for instant live testing.
 * Usage: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../../src/config/database');

// Central test location: Hyderabad (17.3850, 78.4867) or customizable
const CENTER_LAT = 17.385044;
const CENTER_LNG = 78.486671;

async function seed() {
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create Receiver User
  const receiverRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, phone, role)
     VALUES ('Sarah Receiver', 'receiver@bloodconnect.test', $1, '+91 9876543210', 'REQUESTER')
     ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'REQUESTER'
     RETURNING id`,
    [passwordHash]
  );
  const receiverId = receiverRes.rows[0].id;
  console.log('Seeded Receiver: receiver@bloodconnect.test / Password@123');

  // 2. Donors with different blood groups and distances around center
  const demoDonors = [
    {
      name: 'Alex Rivera (O+)',
      email: 'donor.opos@bloodconnect.test',
      phone: '+91 9123456780',
      bloodGroup: 'O_POSITIVE',
      // ~1.8 km North-East
      lat: CENTER_LAT + 0.012,
      lng: CENTER_LNG + 0.010,
      radius: 15,
      available: true,
      lastDonationDate: '2026-01-10',
    },
    {
      name: 'David Chen (O-)',
      email: 'donor.oneg@bloodconnect.test',
      phone: '+91 9123456781',
      bloodGroup: 'O_NEGATIVE',
      // ~3.2 km South-East
      lat: CENTER_LAT - 0.022,
      lng: CENTER_LNG + 0.018,
      radius: 20,
      available: true,
      lastDonationDate: null,
    },
    {
      name: 'Priya Sharma (A+)',
      email: 'donor.apos@bloodconnect.test',
      phone: '+91 9123456782',
      bloodGroup: 'A_POSITIVE',
      // ~4.5 km North-West
      lat: CENTER_LAT + 0.032,
      lng: CENTER_LNG - 0.025,
      radius: 10,
      available: true,
      lastDonationDate: '2025-11-20',
    },
    {
      name: 'Marcus Vance (B+)',
      email: 'donor.bpos@bloodconnect.test',
      phone: '+91 9123456783',
      bloodGroup: 'B_POSITIVE',
      // ~6.0 km South-West
      lat: CENTER_LAT - 0.045,
      lng: CENTER_LNG - 0.030,
      radius: 12,
      available: true,
      lastDonationDate: null,
    },
    {
      name: 'Elena Rostova (AB+)',
      email: 'donor.abpos@bloodconnect.test',
      phone: '+91 9123456784',
      bloodGroup: 'AB_POSITIVE',
      // ~8.2 km East
      lat: CENTER_LAT + 0.005,
      lng: CENTER_LNG + 0.075,
      radius: 25,
      available: true,
      lastDonationDate: '2026-02-01',
    },
  ];

  for (const d of demoDonors) {
    const userRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, 'DONOR')
       ON CONFLICT (email) DO UPDATE SET name = $1, password_hash = $3, role = 'DONOR'
       RETURNING id`,
      [d.name, d.email, passwordHash, d.phone]
    );
    const userId = userRes.rows[0].id;

    await pool.query(
      `INSERT INTO donor_profiles (
         user_id, blood_group, location, available, last_donation_date, notification_radius, verified
       ) VALUES (
         $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6, $7, true
       )
       ON CONFLICT (user_id) DO UPDATE SET
         blood_group = $2,
         location = ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
         available = $5,
         last_donation_date = $6,
         notification_radius = $7,
         verified = true`,
      [userId, d.bloodGroup, d.lng, d.lat, d.available, d.lastDonationDate, d.radius]
    );
    console.log(`Seeded Donor: ${d.email} (${d.bloodGroup})`);
  }

  console.log('Seeding complete.');
}

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding error:', err);
    return pool.end().then(() => process.exit(1));
  });