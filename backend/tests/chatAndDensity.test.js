const request = require('supertest');
const app = require('../src/app');
const { resetDb, registerAndGetToken, authed, makeVerifiedDonor } = require('./helpers');

describe('Coordination Chat & Donor Density', () => {
  beforeEach(async () => {
    await resetDb();
  });

  const REQUEST_POINT = { latitude: 17.385, longitude: 78.486 };

  async function setupAcceptedScenario() {
    const donor = await makeVerifiedDonor({ bloodGroup: 'O_POSITIVE', lat: 17.39, lng: 78.49 });
    const requester = await registerAndGetToken({ role: 'REQUESTER' });

    const created = await authed(requester.token).post('/api/blood-requests').send({
      bloodGroup: 'O_POSITIVE',
      component: 'RED_CELLS',
      unitsRequired: 1,
      hospitalName: 'Apollo Hospital',
      urgency: 'URGENT',
      ...REQUEST_POINT,
    });
    const requestId = created.body.data.id;

    // Donor accepts the request
    await authed(donor.token)
      .post(`/api/blood-requests/${requestId}/respond`)
      .send({ status: 'ACCEPTED' });

    return { donor, requester, requestId };
  }

  test('Accepted donor and requester can send and view coordination chat messages', async () => {
    const { donor, requester, requestId } = await setupAcceptedScenario();

    // 1. Donor sends message
    const msg1 = await authed(donor.token)
      .post(`/api/chat/${requestId}`)
      .send({ message: "I'm on my way, ETA 25 minutes!" });
    expect(msg1.status).toBe(201);
    expect(msg1.body.data.message).toBe("I'm on my way, ETA 25 minutes!");

    // 2. Requester sends reply
    const msg2 = await authed(requester.token)
      .post(`/api/chat/${requestId}`)
      .send({ message: 'Thank you so much! Please ask for the Blood Bank on 2nd Floor.' });
    expect(msg2.status).toBe(201);

    // 3. Fetch chat history
    const history = await authed(requester.token).get(`/api/chat/${requestId}`);
    expect(history.status).toBe(200);
    expect(history.body.data).toHaveLength(2);
    expect(history.body.data[0].sender_name).toBe(donor.user.name);
    expect(history.body.data[1].sender_name).toBe(requester.user.name);
  });

  test('Unrelated user or unaccepted donor is forbidden from coordination chat (403)', async () => {
    const { requester, requestId } = await setupAcceptedScenario();
    const otherUser = await registerAndGetToken({ role: 'DONOR' });

    const res = await authed(otherUser.token).get(`/api/chat/${requestId}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/donors/density returns anonymous spatial cluster aggregation', async () => {
    // Seed 2 donors
    await makeVerifiedDonor({ bloodGroup: 'O_POSITIVE', lat: 17.385, lng: 78.486 });
    await makeVerifiedDonor({ bloodGroup: 'O_POSITIVE', lat: 17.388, lng: 78.489 });

    const { token } = await registerAndGetToken();
    const res = await authed(token).get('/api/donors/density?bloodGroup=O_POSITIVE');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const cluster = res.body.data[0];
    expect(cluster.donor_count).toBeGreaterThanOrEqual(1);
    expect(cluster.cluster_lat).toBeDefined();
    expect(cluster.cluster_lng).toBeDefined();
    // Identity fields must NOT be present
    expect(cluster.user_id).toBeUndefined();
    expect(cluster.donor_name).toBeUndefined();
  });
});
