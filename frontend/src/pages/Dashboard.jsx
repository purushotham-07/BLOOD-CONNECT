import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { donorApi } from '../api/donorApi';
import { requestApi } from '../api/requestApi';
import { Badge, Button, Card } from '../components/ui';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import {
  formatBloodGroup,
  formatDate,
  statusTone,
  urgencyTone,
  titleCase,
} from '../utils/helpers';

function StatCard({ label, value, subtext, tone, action }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        {action}
      </div>
      <p className={`mt-2 text-3xl font-extrabold ${tone || 'text-gray-900'}`}>{value}</p>
      {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isDonor = user?.role === 'DONOR';

  // 1. Donor Queries
  const profileApi = useApi(
    () =>
      donorApi.getProfile().catch((e) => {
        if (e.response?.status === 404) return { data: { data: null } };
        throw e;
      }),
    [],
    { immediate: isDonor }
  );

  const matchedRequestsApi = useApi(
    () => donorApi.getMatchedRequests(),
    [],
    { immediate: isDonor }
  );

  const eligibilityApi = useApi(() => donorApi.getEligibility(), [], { immediate: isDonor });
  const donationsApi = useApi(() => donorApi.myDonations(), [], { immediate: isDonor });

  // 2. Requester Queries
  const requestsApi = useApi(
    () => requestApi.list(),
    [],
    { immediate: !isDonor }
  );

  const [toggling, setToggling] = useState(false);
  const [respondBusy, setRespondBusy] = useState(null);

  const handleAvailability = async (newVal) => {
    setToggling(true);
    try {
      await donorApi.updateAvailability(newVal);
      await profileApi.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const handleDonorRespond = async (requestId, status) => {
    setRespondBusy(requestId);
    try {
      await requestApi.respond(requestId, status);
      await matchedRequestsApi.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setRespondBusy(null);
    }
  };

  // ── DONOR VIEW ──────────────────────────────────────────────────
  if (isDonor) {
    const profile = profileApi.data?.data ?? profileApi.data;
    const matchedRequests = matchedRequestsApi.data || [];
    const eligibility = eligibilityApi.data;
    const donations = donationsApi.data || [];

    // Calculate days remaining if not currently eligible
    let daysRemaining = null;
    if (eligibility?.nextEligibleDate && !eligibility.eligible) {
      const diff = new Date(eligibility.nextEligibleDate) - new Date();
      daysRemaining = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200">
                🩸 Lifesaver Donor
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Your donor dashboard, matching radius & live coordination requests.
            </p>
          </div>
          <Link to="/donor-profile">
            <Button variant="secondary" className="rounded-xl">
              ⚙️ Edit Profile & Saved Location
            </Button>
          </Link>
        </div>

        {profileApi.loading && <Loading className="mt-8" label="Loading donor profile…" />}
        {profileApi.error && <ErrorMessage error={profileApi.error} />}

        {!profileApi.loading && !profileApi.error && (
          <>
            {!profile ? (
              <div className="mt-8 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/30 p-10 text-center">
                <span className="text-4xl">🩸</span>
                <h2 className="mt-3 text-lg font-bold text-gray-900">Complete Your Donor Profile</h2>
                <p className="mt-1 text-sm text-gray-600 max-w-md mx-auto">
                  Set your blood group and saved location so BloodConnect can match you with urgent nearby requests.
                </p>
                <Link to="/donor-profile" className="mt-5 inline-block">
                  <Button className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md">
                    Set Up Donor Profile Now
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Blood Group"
                    value={formatBloodGroup(profile.blood_group)}
                    subtext="Verified for matching"
                    tone="text-brand-700"
                  />
                  <StatCard
                    label="Availability"
                    value={profile.available ? 'Active' : 'Paused'}
                    tone={profile.available ? 'text-emerald-600' : 'text-gray-400'}
                    subtext={profile.available ? 'Eligible for live matching' : 'Temporarily paused'}
                    action={
                      <button
                        onClick={() => handleAvailability(!profile.available)}
                        disabled={toggling}
                        className={`text-xs font-bold underline ${
                          profile.available ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {toggling ? 'Updating…' : profile.available ? 'Pause' : 'Turn On'}
                      </button>
                    }
                  />
                  <StatCard
                    label="Notification Radius"
                    value={`${profile.notification_radius} km`}
                    subtext="Distance alert radius"
                    tone="text-blue-600"
                  />
                  <StatCard
                    label="Donations Completed"
                    value={donations.length}
                    subtext={donations.length > 0 ? 'Lives impacted ❤️' : 'Ready for first donation'}
                    tone="text-emerald-600"
                  />
                </div>

                {/* Eligibility Timer Card */}
                {eligibility && (
                  <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg">
                          ⏱️
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">Donation Interval Status</h3>
                          <p className="text-xs text-gray-500">
                            {eligibility.eligible
                              ? 'You are ready and eligible to donate whole blood or components today.'
                              : `Donation recovery window in progress. Eligible again in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} (${formatDate(eligibility.nextEligibleDate)}).`}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          eligibility.eligible
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                        }`}
                      >
                        {eligibility.eligible ? '✓ Ready to Donate' : `⏳ ${daysRemaining} Days Left`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Matched Urgent Blood Requests Section */}
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span>🚨 Urgent Matched Requests Nearby</span>
                        {matchedRequests.length > 0 && (
                          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-extrabold text-brand-800">
                            {matchedRequests.length} New
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-gray-500">
                        Requests compatible with your blood group within your notification radius.
                      </p>
                    </div>
                    <Button variant="secondary" onClick={() => matchedRequestsApi.reload()}>
                      Refresh
                    </Button>
                  </div>

                  {matchedRequests.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                      <p className="text-sm text-gray-500">No urgent matching blood requests in your area right now.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        We will notify you immediately when a compatible patient requires blood nearby.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {matchedRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-brand-200 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-start gap-3.5">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-base font-extrabold text-brand-700 ring-1 ring-brand-200">
                              {formatBloodGroup(req.blood_group)}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-gray-900">{req.hospital_name}</h3>
                                <Badge tone={urgencyTone(req.urgency)}>{req.urgency}</Badge>
                                <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                                  ≈ {req.distance_km} km away
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-gray-500">
                                {titleCase(req.component)} · Needs {req.units_required} unit{req.units_required > 1 ? 's' : ''} ({req.units_fulfilled || 0} fulfilled)
                              </p>
                              {req.hospital_address && (
                                <p className="mt-0.5 text-xs text-gray-400">📍 {req.hospital_address}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {req.response_status === 'ACCEPTED' ? (
                              <Link to={`/blood-requests/${req.id}`}>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl">
                                  💬 Open Coordination Chat
                                </Button>
                              </Link>
                            ) : (
                              <>
                                <Button
                                  onClick={() => handleDonorRespond(req.id, 'ACCEPTED')}
                                  disabled={respondBusy === req.id}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                                >
                                  ✓ I Can Donate
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => handleDonorRespond(req.id, 'DECLINED')}
                                  disabled={respondBusy === req.id}
                                  className="text-xs px-3 py-2 text-gray-600 rounded-xl"
                                >
                                  Can't Help
                                </Button>
                              </>
                            )}
                            <Link to={`/blood-requests/${req.id}`}>
                              <Button variant="secondary" className="text-xs px-3 py-2 rounded-xl">
                                View Map 🗺️
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    );
  }

  // ── RECEIVER (REQUESTER) VIEW ────────────────────────────────────
  const myRequests = requestsApi.data || [];
  const count = (s) => myRequests.filter((r) => r.status === s).length;
  const activeCount = myRequests.filter((r) =>
    ['ACTIVE', 'MATCHING', 'PARTIALLY_FULFILLED'].includes(r.status)
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create emergency blood requests and track real-time compatible donor matches on the map.
          </p>
        </div>
        <Link to="/create-request">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md">
            + New Blood Request 🩸
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Matching"
          value={activeCount}
          tone="text-brand-600"
          subtext="Matching nearby donors right now"
        />
        <StatCard
          label="Fulfilled Requests"
          value={count('FULFILLED')}
          tone="text-emerald-600"
          subtext="Donations successfully completed"
        />
        <StatCard
          label="Total Requests"
          value={myRequests.length}
          subtext="All-time created requests"
        />
      </div>

      {/* Requests List */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">My Blood Requests</h2>
          <Link to="/create-request" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            + Create another
          </Link>
        </div>

        {requestsApi.loading ? (
          <Loading className="mt-8" label="Loading your blood requests…" />
        ) : requestsApi.error ? (
          <ErrorMessage error={requestsApi.error} />
        ) : myRequests.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
            <span className="text-4xl">🏥</span>
            <h3 className="mt-3 text-base font-bold text-gray-900">No blood requests created yet</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              When you need blood, create a request with your hospital location to instantly find compatible donors.
            </p>
            <Link to="/create-request" className="mt-5 inline-block">
              <Button className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2 rounded-xl">
                Create First Request
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map((r) => (
              <Link
                key={r.id}
                to={`/blood-requests/${r.id}`}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-base font-extrabold text-brand-700 ring-1 ring-brand-200">
                    {formatBloodGroup(r.blood_group)}
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900">{r.hospital_name}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {titleCase(r.component)} · {r.units_fulfilled || 0}/{r.units_required} units fulfilled
                      {r.hospital_address ? ` · ${r.hospital_address}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={urgencyTone(r.urgency)}>{titleCase(r.urgency)}</Badge>
                  <Badge tone={statusTone(r.status)}>{titleCase(r.status)}</Badge>
                  <span className="text-xs font-semibold text-brand-600 ml-2">
                    View Live Map →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}