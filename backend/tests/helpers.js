const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/database');

const PASSWORD = 'password123';

/** Wipe all application tables so each test starts clean. */
async function resetDb() {
  await pool.query(`
    TRUNCATE donor_responses, notifications, donations, donor_profiles,
             blood_requests, users
    RESTART IDENTITY CASCADE
  `);
}

/** Register a brand-new user (role REQUESTER by default). */
async function registerUser(body = {}) {
  const ts = Date.now() + Math.floor(Math.random() * 10000);
  return request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: `user${ts}@test.com`,
    password: PASSWORD,
    ...body,
  });
}

/** Register a user and return { token, user, res }. */
async function registerAndGetToken(body = {}) {
  const res = await registerUser(body);
  return { token: res.body.data.token, user: res.body.data.user, res };
}

/** Bump a user's role in the DB. */
async function setRole(email, role) {
  await pool.query('UPDATE users SET role = $2 WHERE email = $1', [email, role]);
}

/** An authenticated supertest request helper (agent carries the Bearer header). */
function authed(token) {
  return request.agent(app).set('Authorization', `Bearer ${token}`);
}

/** Create a DONOR user + verified donor profile at (lat, lng). */
async function makeVerifiedDonor({ bloodGroup = 'O_POSITIVE', lat = 40.005, lng = -74.0, notificationRadius = 15 } = {}) {
  const { token, user } = await registerAndGetToken({ role: 'DONOR' });
  const profileRes = await authed(token)
    .post('/api/donors/profile')
    .send({ bloodGroup, latitude: lat, longitude: lng, available: true, notificationRadius });
  const donorProfileId = profileRes.body.data.id;

  return { token, user, donorProfileId, profile: profileRes.body.data };
}

module.exports = {
  PASSWORD,
  resetDb,
  registerUser,
  registerAndGetToken,
  setRole,
  authed,
  makeVerifiedDonor,
};