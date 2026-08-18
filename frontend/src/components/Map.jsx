import { lazy, Suspense, memo, useState, useCallback, useEffect, useRef } from 'react';
import Loading from './Loading';

const LeafletMap = lazy(() => import('./LeafletMap'));
const DEFAULT_COORDS = { lat: 17.385044, lng: 78.486671 };

/**
 * Mobile-optimized interactive Map component with OpenStreetMap Location Search & GPS.
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search via OpenStreetMap Nominatim API
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=5&addressdetails=1`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept-Language': 'en',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
          setShowDropdown(true);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Location search error:', err);
        }
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const selectSearchResult = (item) => {
    const coords = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
    onChange?.(coords);
    setShowDropdown(false);
    setSearchQuery(item.display_name?.split(',')[0] || item.display_name);
  };

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
          setLocateError('GPS permission denied. Please search your area above or tap on the map.');
        } else if (err?.code === 2) {
          setLocateError('Position unavailable. Please search your area above or tap on the map.');
        } else if (err?.code === 3) {
          setLocateError('GPS request timed out. Please search your area above or tap on the map.');
        } else {
          setLocateError('Could not get GPS location. Please search your area above or tap on the map.');
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

  return (
    <div className="w-full space-y-2">
      {/* Location Search Bar & Controls above map (Only in selection/interactive mode) */}
      {interactive && !requestData && (
        <div ref={searchContainerRef} className="relative z-30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              placeholder="🔍 Search city, area, hospital, or locality..."
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
            />
            {searching && (
              <span className="absolute right-2.5 top-2 text-[10px] text-gray-400 animate-pulse">
                Searching…
              </span>
            )}
            {searchQuery && !searching && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="absolute right-2.5 top-2 text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}

            {/* Live Search Suggestions Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg z-50 divide-y divide-gray-50 text-xs">
                {searchResults.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => selectSearchResult(item)}
                    className="cursor-pointer px-3 py-2 hover:bg-brand-50 transition text-left"
                  >
                    <p className="font-semibold text-gray-800 truncate">
                      {item.display_name?.split(',')[0] || item.display_name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{item.display_name}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            {enableLocate && (
              <button
                type="button"
                onClick={locate}
                disabled={locating}
                className="flex items-center gap-1 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 px-3 py-2 text-xs font-bold transition shadow-2xs"
              >
                <svg
                  width="13"
                  height="13"
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
                <span>{locating ? 'Locating…' : 'Use Current GPS'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onChange?.(DEFAULT_COORDS);
              }}
              className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-2.5 py-2 text-xs font-semibold transition shadow-2xs"
              title="Reset to City Center"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-gray-100">
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
      </div>

      {/* Informational Status Banners */}
      {locateError && (
        <div className="rounded-xl bg-rose-50 p-2.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200" role="alert">
          {locateError}
        </div>
      )}

      {accuracyNotice && (
        <div className="rounded-xl bg-amber-50 p-2.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200" role="alert">
          {accuracyNotice}
        </div>
      )}
    </div>
  );
}

export default memo(Map);