const { resetDb, registerAndGetToken, setRole, authed } = require('./helpers');

describe('Donor profiles', () => {
  beforeEach(async () => {
    await resetDb();
  });

  async function donorToken() {
    const { token, user } = await registerAndGetToken();
    await setRole(user.email, 'DONOR');
    return token;
  }

  test('DONOR can create a profile; exact location is never returned', async () => {
    const token = await donorToken();
    const res = await authed(token)
      .post('/api/donors/profile')
      .send({ bloodGroup: 'A_POSITIVE', latitude: 40.0, longitude: -74.0, available: true });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.blood_group).toBe('A_POSITIVE');
    expect(res.body.data.user_id).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toContain('"location');
    expect(res.body.data.location).toBeUndefined();
  });

  test('Creating a donor profile with an invalid blood group returns 400', async () => {
    const token = await donorToken();
    const res = await authed(token)
      .post('/api/donors/profile')
      .send({ bloodGroup: 'Z_POSITIVE', latitude: 40.0, longitude: -74.0 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Creating a donor profile with invalid coordinates returns 400', async () => {
    const token = await donorToken();
    const res = await authed(token)
      .post('/api/donors/profile')
      .send({ bloodGroup: 'O_NEGATIVE', latitude: 95, longitude: 200 });
    expect(res.status).toBe(400);
  });

  test('DONOR can toggle availability', async () => {
    const token = await donorToken();
    await authed(token).post('/api/donors/profile').send({
      bloodGroup: 'O_POSITIVE', latitude: 40.0, longitude: -74.0, available: false,
    });
    const res = await authed(token).patch('/api/donors/availability').send({ available: true });
    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(true);
  });

  test('Non-donor (REQUESTER) cannot create a donor profile (authorization)', async () => {
    const { token } = await registerAndGetToken();
    const res = await authed(token)
      .post('/api/donors/profile')
      .send({ bloodGroup: 'O_POSITIVE', latitude: 40.0, longitude: -74.0 });
    expect(res.status).toBe(403);
  });

  test('Donor eligibility endpoint computes a next eligible date server-side', async () => {
    const token = await donorToken();
    await authed(token).post('/api/donors/profile').send({
      bloodGroup: 'O_POSITIVE', latitude: 40.0, longitude: -74.0, available: true,
    });
    const res = await authed(token).get('/api/donors/eligibility');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('eligible');
    expect(res.body.data).toHaveProperty('intervalDays');
  });
});