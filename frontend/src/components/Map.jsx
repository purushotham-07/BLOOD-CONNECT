import { lazy, Suspense, memo, useState, useCallback } from 'react';
import Loading from './Loading';

const LeafletMap = lazy(() => import('./LeafletMap'));
const DEFAULT_COORDS = { lat: 17.385044, lng: 78.486671 };

/**
 * Mobile-optimized interactive Map component.
 * Supports:
 *  - Immediate location updates on map tap & high-accuracy GPS
 *  - Matching visualization mode (Request blood marker + Matched donor markers)
 *  - Geolocation accuracy hints & error handling
 */
function Map({
  value,
  onChange,
  interactive = true,
  height = '340px',
  showSpinner = true,
  enableLocate = true,
  requestData = null,
  matchedDonors = [],
  showSearchRadius = true,
}) {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);
  const [accuracyNotice, setAccuracyNotice] = useState(null);

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocateError('Location services are not supported on this browser.');
      return;
    }
    setLocating(true);
    setLocateError(null);
    setAccuracyNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: parseFloat(pos.coords.latitude),
          lng: parseFloat(pos.coords.longitude),
        };

        if (pos.coords.accuracy && pos.coords.accuracy > 500) {
          setAccuracyNotice(
            `GPS location accuracy is ±${Math.round(pos.coords.accuracy)}m. You can tap on the map to adjust precisely.`
          );
        }

        onChange?.(coords);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err?.code === 1) {
          setLocateError('GPS permission denied. Please tap anywhere on the map to choose your location.');
        } else if (err?.code === 2) {
          setLocateError('Position unavailable. Please tap on the map to select your location.');
        } else if (err?.code === 3) {
          setLocateError('GPS request timed out. Please tap on the map to choose your location.');
        } else {
          setLocateError('Could not get GPS location. Please tap on the map to choose your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, [onChange]);

  const handleMapClick = useCallback(
    (pos) => {
      if (!interactive) return;
      setLocateError(null);
      setAccuracyNotice(null);
      onChange?.(pos);
    },
    [interactive, onChange]
  );

  const hasLocation = Boolean(value && value.lat !== undefined);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      <Suspense
        fallback={
          showSpinner ? (
            <Loading height={height} label="Loading map…" />
          ) : (
            <div style={{ height }} className="rounded-2xl bg-gray-100" />
          )
        }
      >
        <LeafletMap
          value={value || DEFAULT_COORDS}
          onChange={handleMapClick}
          interactive={interactive}
          height={height}
          markerPosition={value}
          requestData={requestData}
          matchedDonors={matchedDonors}
          showSearchRadius={showSearchRadius}
        />
      </Suspense>

      {/* Mobile-friendly GPS controls */}
      {interactive && !requestData && (
        <div className="absolute right-2.5 top-2.5 z-[1000] flex items-center gap-1.5">
          {enableLocate && (
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              className="blood-map__control shadow-sm text-xs font-semibold py-1.5 px-2.5"
              aria-label={hasLocation ? 'Update GPS Location' : 'Use Current GPS'}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              <span>{locating ? 'Detecting…' : 'Use Current GPS'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onChange?.(DEFAULT_COORDS)}
            className="blood-map__control shadow-sm text-xs py-1.5 px-2"
            title="Reset to City Center"
          >
            Reset
          </button>
        </div>
      )}

      {/* Informational Status Banners */}
      {locateError && (
        <div className="mt-2 rounded-xl bg-rose-50 p-2.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200" role="alert">
          {locateError}
        </div>
      )}

      {accuracyNotice && (
        <div className="mt-2 rounded-xl bg-amber-50 p-2.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200" role="alert">
          {accuracyNotice}
        </div>
      )}
    </div>
  );
}

export default memo(Map);