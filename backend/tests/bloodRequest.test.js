const request = require('supertest');
const app = require('../src/app');
const { resetDb, registerAndGetToken, authed } = require('./helpers');

describe('Blood requests', () => {
  beforeEach(async () => {
    await resetDb();
  });

  const REQUEST_BODY = {
    bloodGroup: 'O_POSITIVE',
    component: 'RED_CELLS',
    unitsRequired: 1,
    hospitalName: 'City Hospital',
    latitude: 40.0,
    longitude: -74.0,
    urgency: 'URGENT',
  };

  test('Any authenticated receiver can create a request; it starts in MATCHING status', async () => {
    const { token } = await registerAndGetToken({ role: 'REQUESTER' });
    const res = await authed(token).post('/api/blood-requests').send(REQUEST_BODY);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('MATCHING');
    expect(res.body.data.blood_group).toBe('O_POSITIVE');
  });

  test('Invalid blood group returns 400', async () => {
    const { token } = await registerAndGetToken();
    const res = await authed(token)
      .post('/api/blood-requests')
      .send({ ...REQUEST_BODY, bloodGroup: 'NO_SUCH_GROUP' });
    expect(res.status).toBe(400);
  });

  test('Invalid coordinates return 400', async () => {
    const { token } = await registerAndGetToken();
    const res = await authed(token)
      .post('/api/blood-requests')
      .send({ ...REQUEST_BODY, latitude: 91 });
    expect(res.status).toBe(400);
  });

  test('Invalid component returns 400', async () => {
    const { token } = await registerAndGetToken();
    const res = await authed(token)
      .post('/api/blood-requests')
      .send({ ...REQUEST_BODY, component: 'MAGIC_DUST' });
    expect(res.status).toBe(400);
  });

  test('Missing hospital name returns 400', async () => {
    const { token } = await registerAndGetToken();
    const res = await authed(token)
      .post('/api/blood-requests')
      .send({ ...REQUEST_BODY, hospitalName: '' });
    expect(res.status).toBe(400);
  });

  test('A requester only sees their own requests', async () => {
    const a = await registerAndGetToken({ role: 'REQUESTER' });
    const b = await registerAndGetToken({ role: 'REQUESTER' });

    const createdA = await authed(a.token).post('/api/blood-requests').send(REQUEST_BODY);
    await authed(b.token).post('/api/blood-requests').send(REQUEST_BODY);

    const list = await authed(a.token).get('/api/blood-requests');
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].id).toBe(createdA.body.data.id);
  });

  test('Authorized owner can cancel a request', async () => {
    const { token } = await registerAndGetToken();
    const created = await authed(token).post('/api/blood-requests').send(REQUEST_BODY);
    const res = await authed(token).patch(`/api/blood-requests/${created.body.data.id}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  test('Another user cannot cancel your request (403); cancelling twice is an invalid transition (400)', async () => {
    const { token } = await registerAndGetToken();
    const other = await registerAndGetToken();
    const created = await authed(token).post('/api/blood-requests').send(REQUEST_BODY);
    const id = created.body.data.id;

    const forbidden = await authed(other.token).patch(`/api/blood-requests/${id}/cancel`);
    expect(forbidden.status).toBe(403);

    await authed(token).patch(`/api/blood-requests/${id}/cancel`);
    const again = await authed(token).patch(`/api/blood-requests/${id}/cancel`);
    expect(again.status).toBe(400); // CANCELLED -> CANCELLED is rejected
  });

  test('Unauthenticated request creation is rejected with 401', async () => {
    const res = await request(app).post('/api/blood-requests').send(REQUEST_BODY);
    expect(res.status).toBe(401);
  });
});