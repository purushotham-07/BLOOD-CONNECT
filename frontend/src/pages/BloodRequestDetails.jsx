import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { requestApi } from '../api/requestApi';
import { Badge, Button, Card } from '../components/ui';
import Map from '../components/Map';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import CoordinationChat from '../components/CoordinationChat';
import { subscribeToRequest } from '../services/socket';
import {
  formatBloodGroup,
  formatDateTime,
  statusTone,
  urgencyTone,
  titleCase,
  getDirectionsUrl,
} from '../utils/helpers';

export default function BloodRequestDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const isDonor = user?.role === 'DONOR';

  // 1. Fetch Blood Request data
  const { data: request, loading, error, reload: reloadRequest, setData: setRequest } = useApi(
    () => requestApi.get(id),
    [id]
  );

  const isOwner = request && request.requester_id === user?.id;
  const canSeeMatches = isOwner;

  // 2. Fetch Matches & Responses for Requester
  const [liveMatches, setLiveMatches] = useState([]);
  const [matchesLoaded, setMatchesLoaded] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!id || !canSeeMatches) return;
    setMatchesLoading(true);
    try {
      const res = await requestApi.matches(id);
      setLiveMatches(res.data.data || []);
      setMatchesLoaded(true);
    } catch (err) {
      // ignore
    } finally {
      setMatchesLoading(false);
    }
  }, [id, canSeeMatches]);

  useEffect(() => {
    if (canSeeMatches) {
      fetchMatches();
    }
  }, [canSeeMatches, fetchMatches]);

  // 3. Real-time Socket.IO subscription
  useEffect(() => {
    if (!id) return;

    const unsubscribe = subscribeToRequest(
      id,
      (newMatches) => {
        if (newMatches) {
          setLiveMatches(newMatches);
          setMatchesLoaded(true);
        }
      },
      (updatedRequest) => {
        if (updatedRequest) {
          setRequest((prev) => (prev ? { ...prev, ...updatedRequest } : updatedRequest));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [id, setRequest]);

  // 4. Action states (Accept/Decline/Cancel/Complete)
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [busy, setBusy] = useState(false);
  const [donorPledged, setDonorPledged] = useState(false);

  const canCancel =
    isOwner && ['ACTIVE', 'MATCHING', 'PARTIALLY_FULFILLED'].includes(request?.status);

  const cancel = async () => {
    setActionError(null);
    setActionSuccess(null);
    setBusy(true);
    try {
      await requestApi.cancel(id);
      await reloadRequest();
      setActionSuccess('Request was successfully cancelled.');
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  };

  const respond = async (status) => {
    setActionError(null);
    setActionSuccess(null);
    setBusy(true);
    try {
      await requestApi.respond(id, status);
      await reloadRequest();
      if (status === 'ACCEPTED') {
        setDonorPledged(true);
        setActionSuccess('🎉 Donor Accepted Request! Your response is recorded. Please coordinate with the hospital/requester in the chat below. Once physical blood donation is completed, click "Confirm Donation Completed" below.');
      } else {
        setActionSuccess('You have declined this request.');
      }
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteDonation = async (donorProfileId = null) => {
    setActionError(null);
    setActionSuccess(null);
    setBusy(true);
    try {
      await requestApi.confirmDonation(id, { donorId: donorProfileId });
      await reloadRequest();
      await fetchMatches();
      setActionSuccess('🎉 Blood donation successfully confirmed & fulfilled! 1 unit added to fulfillment progress.');
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Loading className="mt-8" label="Loading request details & matching map…" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <ErrorMessage error={error} />
      </main>
    );
  }

  if (!request) return null;

  const unitsFulfilled = request.units_fulfilled || 0;
  const unitsRequired = request.units_required || 1;
  const progressPercent = Math.min(100, Math.round((unitsFulfilled / unitsRequired) * 100));

  const hasAcceptedDonors = liveMatches.some((m) => m.responseStatus === 'ACCEPTED');

  const directionsUrl =
    request.latitude && request.longitude
      ? getDirectionsUrl(request.latitude, request.longitude, request.hospital_name)
      : null;

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8">
      <Link
        to={isDonor ? '/dashboard' : '/blood-requests'}
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
      >
        ← Back to {isDonor ? 'dashboard' : 'my requests'}
      </Link>

      {/* Header */}
      <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-lg font-extrabold text-brand-700 ring-1 ring-brand-200 shrink-0">
            {formatBloodGroup(request.blood_group)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{request.hospital_name}</h1>
              {request.status === 'MATCHING' && (
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Live Matching Active" />
              )}
            </div>
            <p className="text-xs text-gray-500">
              {titleCase(request.component)} · {request.units_required} unit{request.units_required > 1 ? 's' : ''} requested
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <Badge tone={urgencyTone(request.urgency)}>{titleCase(request.urgency)}</Badge>
          <Badge tone={statusTone(request.status)}>{titleCase(request.status)}</Badge>
        </div>
      </div>

      {/* Fulfillment Progress Bar */}
      <div className="mt-4 rounded-xl border border-gray-100 bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-700">Actual Hospital Blood Fulfillment</span>
          <span className="text-brand-600 font-bold">
            {unitsFulfilled} of {unitsRequired} Unit{unitsRequired > 1 ? 's' : ''} Fulfilled ({progressPercent}%)
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              unitsFulfilled >= unitsRequired ? 'bg-emerald-500' : 'bg-brand-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {unitsFulfilled < unitsRequired && hasAcceptedDonors && (
          <p className="mt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <span>✓</span> Donor accepted request and is coordinating arrival. Confirm fulfillment once blood is donated.
          </p>
        )}
      </div>

      {/* Main Grid: Interactive Map & Details */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Live Matching Map & Chat */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-gray-900">
                  {canSeeMatches ? 'Location-Based Donor Matching Map' : 'Hospital Location'}
                </h2>
                <p className="text-[11px] text-gray-500">
                  {canSeeMatches
                    ? `Search radius: ${request.urgency === 'CRITICAL' ? '30km' : request.urgency === 'URGENT' ? '20km' : '10km'}`
                    : 'Interactive Hospital Location'}
                </p>
              </div>
              {canSeeMatches && (
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span> Notified
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Donor Accepted
                  </span>
                </div>
              )}
            </div>

            <Map
              interactive={false}
              height="320px"
              requestData={request}
              matchedDonors={canSeeMatches ? liveMatches : []}
              showSearchRadius={true}
            />

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
              <span>📍 {request.hospital_name} {request.hospital_address ? `(${request.hospital_address})` : ''}</span>
              {canSeeMatches && (
                <span className="font-semibold text-brand-600">
                  {liveMatches.length} Compatible Donor{liveMatches.length === 1 ? '' : 's'} Matched
                </span>
              )}
            </div>
          </Card>

          {/* Real-Time Coordination Chat */}
          <CoordinationChat requestId={id} hospitalName={request.hospital_name} />

          {/* Matched Donors Card (Only visible to Requester) */}
          {canSeeMatches && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">Matched Nearby Donors</h3>
                  <p className="text-[11px] text-gray-500">
                    Live updates via PostgreSQL + PostGIS spatial distance ranking
                  </p>
                </div>
                <Button variant="secondary" onClick={fetchMatches} disabled={matchesLoading} className="text-xs py-1.5 px-3">
                  {matchesLoading ? '…' : 'Refresh'}
                </Button>
              </div>

              {liveMatches.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                  No compatible donors found within the search radius yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <ul className="divide-y divide-gray-100">
                    {liveMatches.map((donor) => {
                      const isAccepted = donor.responseStatus === 'ACCEPTED';
                      return (
                        <li
                          key={donor.donorId}
                          className={`flex flex-col gap-2 p-3 text-xs transition sm:flex-row sm:items-center sm:justify-between ${
                            isAccepted ? 'bg-emerald-50/50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                                isAccepted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {formatBloodGroup(donor.bloodGroup)}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900">{donor.donorName}</p>
                              <p className="text-[11px] text-gray-400">≈ {donor.distanceKm} km away</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                isAccepted ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300' : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {isAccepted ? '✓ Donor Accepted Request' : '⚡ Notified'}
                            </span>

                            {isAccepted && isOwner && unitsFulfilled < unitsRequired && (
                              <Button
                                onClick={() => handleCompleteDonation(donor.donorId)}
                                disabled={busy}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1 px-2.5 rounded-lg shadow-xs"
                              >
                                Mark Unit Received 🩸
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right 1 Col: Request Info & Actions */}
        <div className="space-y-4">
          {/* Action Card for Donor */}
          {isDonor && ['ACTIVE', 'MATCHING', 'PARTIALLY_FULFILLED'].includes(request.status) && (
            <div className="rounded-xl border border-brand-200 bg-gradient-to-b from-brand-50/60 to-white p-4 shadow-xs">
              <h2 className="text-xs sm:text-sm font-bold text-brand-900">Urgent Help Needed</h2>
              <p className="mt-1 text-xs text-gray-600">
                Can you donate {formatBloodGroup(request.blood_group)} {titleCase(request.component)} for this patient?
              </p>

              {actionSuccess && (
                <div className="mt-2.5 rounded-lg bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 animate-slide-up">
                  {actionSuccess}
                </div>
              )}
              {actionError && (
                <div className="mt-2.5">
                  <ErrorMessage error={actionError} />
                </div>
              )}

              <div className="mt-3 flex flex-col gap-2">
                {!donorPledged && (
                  <Button
                    onClick={() => respond('ACCEPTED')}
                    disabled={busy}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 text-xs rounded-xl"
                  >
                    ✓ I Can Donate (Accept Request)
                  </Button>
                )}

                {donorPledged && unitsFulfilled < unitsRequired && (
                  <Button
                    onClick={() => handleCompleteDonation()}
                    disabled={busy}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 text-xs rounded-xl shadow-xs"
                  >
                    🩸 Confirm Donation Completed (1 Unit)
                  </Button>
                )}

                {!donorPledged && (
                  <Button
                    variant="secondary"
                    onClick={() => respond('DECLINED')}
                    disabled={busy}
                    className="w-full text-xs py-2 text-gray-600 rounded-xl"
                  >
                    Can't Help
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Details Card */}
          <Card>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">Request Information</h3>
            <dl className="mt-3 space-y-2 text-xs">
              <div>
                <dt className="font-semibold text-gray-400">Hospital</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{request.hospital_name}</dd>
              </div>
              {request.hospital_address && (
                <div>
                  <dt className="font-semibold text-gray-400">Address</dt>
                  <dd className="mt-0.5 text-gray-700">{request.hospital_address}</dd>
                </div>
              )}
              <div>
                <dt className="font-semibold text-gray-400">Blood Component</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{titleCase(request.component)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-400">Units Needed</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {request.units_required} unit{request.units_required > 1 ? 's' : ''} ({unitsFulfilled} fulfilled)
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-400">Created</dt>
                <dd className="mt-0.5 text-gray-600">{formatDateTime(request.created_at)}</dd>
              </div>
              {request.description && (
                <div>
                  <dt className="font-semibold text-gray-400">Notes</dt>
                  <dd className="mt-0.5 rounded-lg bg-gray-50 p-2 text-gray-700 break-words">
                    {request.description}
                  </dd>
                </div>
              )}
            </dl>

            {/* Google Maps Directions Button */}
            {directionsUrl && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold py-2.5 shadow-xs transition"
                >
                  🗺️ Open Google Maps Directions
                </a>
              </div>
            )}

            {/* Requester Contact */}
            <div className="mt-3 border-t border-gray-100 pt-3 text-xs">
              <span className="font-semibold text-gray-400">Contact: </span>
              <span className="font-semibold text-gray-800">{request.requester_name}</span>
              {request.requester_phone && (
                <span className="text-gray-500 ml-1">({request.requester_phone})</span>
              )}
            </div>

            {/* Cancel Action for Owner */}
            {canCancel && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <Button
                  variant="secondary"
                  onClick={cancel}
                  disabled={busy}
                  className="w-full text-rose-600 hover:bg-rose-50 border-rose-200 text-xs py-2"
                >
                  {busy ? 'Cancelling…' : 'Cancel Request'}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}