const { resetDb, registerAndGetToken, authed, makeVerifiedDonor } = require('./helpers');

// Coordinates: donor at (40.0005, -74.0) vs request at (40.0, -74.0) => ~55m apart.
const DONOR_POINT = { lat: 40.0005, lng: -74.0 };
const REQUEST_POINT = { latitude: 40.0, longitude: -74.0 };

describe('Matching & donor responses (Pure 2-Tier Architecture)', () => {
  beforeEach(async () => {
    await resetDb();
  });

  // Create: donor, a compatible request -> automatically matched upon creation!
  async function setupMatchedRequest(overrides = {}) {
    const donor = await makeVerifiedDonor({ ...DONOR_POINT, ...overrides });

    const requester = await registerAndGetToken({ role: 'REQUESTER' });
    const created = await authed(requester.token)
      .post('/api/blood-requests')
      .send({
        bloodGroup: 'O_POSITIVE',
        component: 'RED_CELLS',
        unitsRequired: 1,
        hospitalName: 'City Hospital',
        urgency: 'NORMAL',
        ...REQUEST_POINT,
      });
    const requestId = created.body.data.id;

    return { donor, requester, requestId, created: created.body.data };
  }

  test('Creating a request immediately matches nearby compatible donors (distance sorted, no exact coords)', async () => {
    const { requester, requestId } = await setupMatchedRequest();

    const list = await authed(requester.token).get(`/api/blood-requests/${requestId}/matches`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);
    const [match] = list.body.data;
    expect(match.bloodGroup).toBe('O_POSITIVE');
    expect(match.distanceKm).toBeLessThan(5); // nearby
    // Exact GPS coordinates must NOT be exposed.
    expect(match.approximateLocation).toBeDefined();
    expect(match.approximateLocation.latitude).toBeDefined();
    expect(match.approximateLocation.longitude).toBeDefined();
    expect(JSON.stringify(list.body.data)).not.toContain('"location"');
    expect(JSON.stringify(list.body.data)).not.toContain('"phone"');
  });

  test('A donor cannot view matches of other requesters (requester only) - 403', async () => {
    const { donor, requestId } = await setupMatchedRequest();
    const res = await authed(donor.token).get(`/api/blood-requests/${requestId}/matches`);
    expect(res.status).toBe(403);
  });

  test('The matched donor can accept; a duplicate response is rejected (409)', async () => {
    const { donor, requestId } = await setupMatchedRequest();

    const first = await authed(donor.token)
      .post(`/api/blood-requests/${requestId}/respond`)
      .send({ status: 'ACCEPTED' });
    expect(first.status).toBe(201);
    expect(first.body.data.response.status).toBe('ACCEPTED');
    expect(first.body.data.status).toBe('FULFILLED');

    const dup = await authed(donor.token)
      .post(`/api/blood-requests/${requestId}/respond`)
      .send({ status: 'ACCEPTED' });
    expect(dup.status).toBe(409);
    expect(dup.body.success).toBe(false);
  });

  test('Requester sees the donor response recorded', async () => {
    const { donor, requester, requestId } = await setupMatchedRequest();
    await authed(donor.token).post(`/api/blood-requests/${requestId}/respond`).send({ status: 'ACCEPTED' });

    const res = await authed(requester.token).get(`/api/blood-requests/${requestId}/responses`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('ACCEPTED');
  });

  test('A donor not matched to the request cannot respond - 403', async () => {
    const donor = await makeVerifiedDonor({ bloodGroup: 'A_POSITIVE', lat: 40.0005, lng: -74.0 });
    const requester = await registerAndGetToken();
    const created = await authed(requester.token).post('/api/blood-requests').send({
      bloodGroup: 'B_POSITIVE', // incompatible with A+ donor for red cells
      component: 'RED_CELLS',
      unitsRequired: 1,
      hospitalName: 'Other Hospital',
      ...REQUEST_POINT,
    });

    const res = await authed(donor.token)
      .post(`/api/blood-requests/${created.body.data.id}/respond`)
      .send({ status: 'ACCEPTED' });
    expect(res.status).toBe(403);
  });

  test('An incompatible donor blood group is excluded by the matching engine', async () => {
    // Donor with A_POSITIVE; request for O_POSITIVE => incompatible
    await makeVerifiedDonor({ bloodGroup: 'A_POSITIVE', ...DONOR_POINT });
    const requester = await registerAndGetToken();
    const created = await authed(requester.token).post('/api/blood-requests').send({
      bloodGroup: 'O_POSITIVE',
      component: 'RED_CELLS',
      unitsRequired: 1,
      hospitalName: 'City Hospital',
      ...REQUEST_POINT,
    });

    const matches = await authed(requester.token).get(`/api/blood-requests/${created.body.data.id}/matches`);
    expect(matches.body.data).toHaveLength(0);
  });

  test('Donor outside search radius or exceeding notification radius is excluded', async () => {
    // Donor with notificationRadius = 2 km, located 50 km away
    await makeVerifiedDonor({ bloodGroup: 'O_POSITIVE', lat: 40.5, lng: -74.0, notificationRadius: 2 });
    const requester = await registerAndGetToken();
    const created = await authed(requester.token).post('/api/blood-requests').send({
      bloodGroup: 'O_POSITIVE',
      component: 'RED_CELLS',
      unitsRequired: 1,
      hospitalName: 'City Hospital',
      urgency: 'NORMAL', // 10km search radius
      ...REQUEST_POINT,
    });

    const matches = await authed(requester.token).get(`/api/blood-requests/${created.body.data.id}/matches`);
    expect(matches.body.data).toHaveLength(0);
  });
});