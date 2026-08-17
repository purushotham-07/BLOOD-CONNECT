const request = require('supertest');
const app = require('../src/app');
const { resetDb, registerAndGetToken, authed } = require('./helpers');

describe('Donation Camps', () => {
  beforeEach(async () => {
    await resetDb();
  });

  const CAMP_DATA = {
    title: 'City Community Blood Drive',
    organizerName: 'Red Cross Chapter',
    contactPhone: '+91 9876543210',
    campDate: '2026-09-15',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    targetDonors: 100,
    venueName: 'Civic Community Hall',
    venueAddress: 'Road 5, Main Circle',
    latitude: 17.385044,
    longitude: 78.486671,
    description: 'Refreshments provided',
  };

  test('Authenticated user can create a donation camp', async () => {
    const { token } = await registerAndGetToken({ role: 'REQUESTER' });
    const res = await authed(token).post('/api/camps').send(CAMP_DATA);
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('City Community Blood Drive');
    expect(res.body.data.target_donors).toBe(100);
  });

  test('Public can list upcoming camps and filter by proximity', async () => {
    const { token } = await registerAndGetToken();
    await authed(token).post('/api/camps').send(CAMP_DATA);

    const res = await request(app).get('/api/camps').query({
      latitude: 17.385044,
      longitude: 78.486671,
      radius: 20,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].distance_km).toBeDefined();
  });

  test('Donor can pledge attendance for a camp and cancel pledge', async () => {
    const organizer = await registerAndGetToken({ role: 'REQUESTER' });
    const donor = await registerAndGetToken({ role: 'DONOR' });

    const created = await authed(organizer.token).post('/api/camps').send(CAMP_DATA);
    const campId = created.body.data.id;

    // Pledge
    const pledgeRes = await authed(donor.token).post(`/api/camps/${campId}/pledge`);
    expect(pledgeRes.status).toBe(201);

    // Cancel pledge
    const cancelRes = await authed(donor.token).delete(`/api/camps/${campId}/pledge`);
    expect(cancelRes.status).toBe(200);
  });
});
