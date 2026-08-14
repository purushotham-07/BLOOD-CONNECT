const request = require('supertest');
const app = require('../src/app');
const { resetDb, registerUser, PASSWORD } = require('./helpers');

describe('Authentication', () => {
  beforeEach(async () => {
    await resetDb();
  });

  test('POST /api/auth/register creates a user, returns token and NEVER the password', async () => {
    const res = await registerUser({ email: 'alice@test.com', name: 'Alice' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user).toMatchObject({
      email: 'alice@test.com',
      name: 'Alice',
      role: 'REQUESTER',
    });
    expect(JSON.stringify(res.body)).not.toContain('password_hash');
    expect(JSON.stringify(res.body)).not.toContain(PASSWORD);
  });

  test('POST /api/auth/register rejects duplicate emails with 409', async () => {
    await registerUser({ email: 'dup@test.com' });
    const res = await registerUser({ email: 'dup@test.com' });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register rejects a short password (validation)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: '123' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login succeeds with correct credentials and fails otherwise', async () => {
    await registerUser({ email: 'login@test.com' });

    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: PASSWORD });
    expect(ok.status).toBe(200);
    expect(ok.body.data.token).toBeTruthy();

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'wrongpass' });
    expect(bad.status).toBe(401);
    expect(bad.body.success).toBe(false);
  });

  test('GET /api/auth/me returns the authenticated user with a valid token', async () => {
    const { token } = await registerAndGetToken();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBeTruthy();
  });

  test('GET /api/auth/me rejects a missing or invalid token with 401', async () => {
    const missing = await request(app).get('/api/auth/me');
    expect(missing.status).toBe(401);

    const invalid = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.jwt');
    expect(invalid.status).toBe(401);
  });

  // eslint-disable-next-line jest/no-standalone-expect
  test('POST /api/auth/register rejects invalid email (validation)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Carol', email: 'not-an-email', password: PASSWORD });
    expect(res.status).toBe(400);
  });
});

async function registerAndGetToken() {
  const res = await registerUser();
  return { token: res.body.data.token };
}