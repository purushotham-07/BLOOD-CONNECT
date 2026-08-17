import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { campApi } from '../api/campApi';
import { Button, Card, Badge } from '../components/ui';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Map from '../components/Map';
import { formatDate, getDirectionsUrl } from '../utils/helpers';

export default function DonationCamps() {
  const { user } = useAuth();
  const [radius, setRadius] = useState(50);
  const [userLocation, setUserLocation] = useState(null);
  const [pledgingId, setPledgingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Auto-detect user GPS if possible
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: parseFloat(pos.coords.latitude),
            lng: parseFloat(pos.coords.longitude),
          });
        },
        () => {},
        { timeout: 8000 }
      );
    }
  }, []);

  const { data: camps, loading, error, reload } = useApi(
    () =>
      campApi.list({
        latitude: userLocation?.lat,
        longitude: userLocation?.lng,
        radius,
      }),
    [userLocation, radius]
  );

  const handlePledge = async (campId, alreadyPledged) => {
    setPledgingId(campId);
    setActionSuccess(null);
    try {
      if (alreadyPledged) {
        await campApi.cancelPledge(campId);
        setActionSuccess('You have cancelled your attendance pledge.');
      } else {
        await campApi.pledge(campId);
        setActionSuccess('🎉 Thank you! Your pledge to donate at this camp has been recorded.');
      }
      await reload();
    } catch (err) {
      console.error(err);
    } finally {
      setPledgingId(null);
    }
  };

  const campList = camps || [];

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Blood Donation Camps 🎪</h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200">
              Community Drives
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Discover community blood donation drives near you or host your own camp.
          </p>
        </div>
        <Link to="/camps/create">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs">
            + Host a Blood Camp
          </Button>
        </Link>
      </div>

      {actionSuccess && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 animate-slide-up">
          {actionSuccess}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 mr-1">Proximity:</span>
        {[10, 25, 50, 100].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRadius(r)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              radius === r
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Within {r} km
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <Loading className="mt-8" label="Loading nearby blood donation camps…" />
      ) : error ? (
        <div className="mt-6">
          <ErrorMessage error={error} />
        </div>
      ) : campList.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <span className="text-4xl">🎪</span>
          <h2 className="mt-3 text-base font-bold text-gray-900">No donation camps scheduled nearby</h2>
          <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
            Be the first to organize a blood donation drive in your neighborhood, college, or workplace.
          </p>
          <Link to="/camps/create" className="mt-4 inline-block">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2 rounded-xl">
              Host First Camp 🩸
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {campList.map((camp) => {
            const directionsUrl = getDirectionsUrl(camp.latitude, camp.longitude, camp.venue_name);
            const progressPercent = Math.min(
              100,
              Math.round(((camp.pledged_donors || 0) / (camp.target_donors || 50)) * 100)
            );

            return (
              <Card key={camp.id}>
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl ring-1 ring-brand-200">
                      🎪
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-gray-900">{camp.title}</h2>
                        {camp.distance_km && (
                          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                            ≈ {camp.distance_km} km away
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs font-semibold text-gray-700">
                        📍 {camp.venue_name} · <span className="text-gray-500">{camp.venue_address}</span>
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>🗓️ <strong>{formatDate(camp.camp_date)}</strong></span>
                        <span>⏰ {camp.start_time} - {camp.end_time}</span>
                        <span>👤 Organizer: {camp.organizer_name} ({camp.contact_phone})</span>
                      </div>

                      {camp.description && (
                        <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                          {camp.description}
                        </p>
                      )}

                      {/* Progress */}
                      <div className="mt-3 max-w-xs">
                        <div className="flex justify-between text-[11px] font-semibold text-gray-600 mb-1">
                          <span>Pledged Donors:</span>
                          <span className="text-brand-600">
                            {camp.pledged_donors || 0} / {camp.target_donors} ({progressPercent}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full bg-brand-600 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 self-end md:self-center">
                    <Button
                      onClick={() => handlePledge(camp.id, camp.user_pledged)}
                      disabled={pledgingId === camp.id}
                      className={`text-xs font-bold py-2 px-4 rounded-xl shadow-xs ${
                        camp.user_pledged
                          ? 'bg-emerald-600 hover:bg-rose-600 text-white'
                          : 'bg-brand-600 hover:bg-brand-700 text-white'
                      }`}
                    >
                      {pledgingId === camp.id
                        ? '…'
                        : camp.user_pledged
                          ? '✓ You Pledged (Cancel)'
                          : 'I Will Attend & Donate 🩸'}
                    </Button>

                    {directionsUrl && (
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold py-2 px-3 transition"
                      >
                        🧭 Directions
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
