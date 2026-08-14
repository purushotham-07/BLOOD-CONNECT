import { lazy, Suspense, memo, useState } from 'react';
import Loading from './Loading';

const LeafletMap = lazy(() => import('./LeafletMap'));
const DEFAULT_COORDS = { lat: 17.385044, lng: 78.486671 };

/**
 * Modern interactive Map component.
 * Supports:
 *  - Location selection mode ("Use My Location", manual click preview & confirm)
 *  - Matching visualization mode (Request blood marker + Matched donor markers)
 *  - Geolocation accuracy hints & error handling
 */
function Map({
  value,
  onChange,
  interactive = true,
  height = '360px',
  showSpinner = true,
  enableLocate = true,
  requestData = null,
  matchedDonors = [],
  showSearchRadius = true,
}) {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);
  const [accuracyNotice, setAccuracyNotice] = useState(null);
  const [manualSelect, setManualSelect] = useState(false);
  const [pending, setPending] = useState(null);

  const locate = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocateError('Location services are not supported by this browser.');
      return;
    }
    setLocating(true);
    setLocateError(null);
    setAccuracyNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        
        // Check if accuracy is low (> 500 meters)
        if (pos.coords.accuracy && pos.coords.accuracy > 500) {
          setAccuracyNotice(
            `Location accuracy is approximate (±${Math.round(pos.coords.accuracy)}m). Please confirm or adjust manually on the map.`
          );
        }

        // Set pending for confirmation if interactive selection
        if (interactive) {
          setPending(coords);
          setManualSelect(true);
        } else {
          onChange?.(coords);
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err && err.code === 1) {
          setLocateError('Location permission denied. Please click on the map to set your location manually.');
        } else if (err && err.code === 2) {
          setLocateError('Position unavailable. Please select your location manually on the map.');
        } else if (err && err.code === 3) {
          setLocateError('Location request timed out. Please try again or select manually.');
        } else {
          setLocateError('Could not retrieve your location. Please select manually on the map.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Manual selection: map click sets pending marker for confirmation
  const handleMapClick = (pos) => {
    if (!interactive) return;
    setLocateError(null);
    setAccuracyNotice(null);
    setManualSelect(true);
    setPending(pos);
  };

  const confirmSelection = () => {
    if (pending) {
      onChange?.(pending);
      setManualSelect(false);
      setPending(null);
    }
  };

  const cancelSelection = () => {
    setManualSelect(false);
    setPending(null);
  };

  const hasLocation = Boolean(value && value.lat !== undefined);

  return (
    <div className="relative w-full">
      <Suspense
        fallback={
          showSpinner ? (
            <Loading height={height} label="Loading interactive map…" />
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
          markerPosition={manualSelect ? pending : undefined}
          requestData={requestData}
          matchedDonors={matchedDonors}
          showSearchRadius={showSearchRadius}
        />
      </Suspense>

      {/* Control Buttons (Only in selection/interactive mode when not viewing another's request) */}
      {interactive && !requestData && (
        <div className="absolute right-3 top-3 z-[1000] flex items-center gap-2">
          {enableLocate && (
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              className="blood-map__control shadow-sm"
              aria-label={hasLocation ? 'Update My Location' : 'Use My Location'}
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
              {locating ? 'Locating…' : hasLocation ? 'Use Current GPS' : 'Use My Location'}
            </button>
          )}

          <button
            type="button"
            onClick={() => onChange?.(value || DEFAULT_COORDS)}
            disabled={!hasLocation}
            className="blood-map__control shadow-sm"
            aria-label="Recenter map"
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
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20M2 12h20" />
            </svg>
            Recenter
          </button>
        </div>
      )}

      {/* Confirmation Floating Banner */}
      {manualSelect && pending && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/95 p-3 shadow-lg ring-1 ring-gray-900/10 backdrop-blur sm:left-4 sm:right-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
            <span className="flex h-2 w-2 rounded-full bg-brand-600 animate-pulse"></span>
            Confirm location ({pending.lat.toFixed(4)}, {pending.lng.toFixed(4)})?
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={confirmSelection}
              className="blood-map__control blood-map__control--primary"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={cancelSelection}
              className="blood-map__control"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {locateError && (
        <div className="mt-2 rounded-xl bg-rose-50 p-2.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200" role="alert">
          {locateError}
        </div>
      )}

      {accuracyNotice && (
        <div className="mt-2 rounded-xl bg-amber-50 p-2.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200" role="alert">
          {accuracyNotice}
        </div>
      )}
    </div>
  );
}

export default memo(Map);