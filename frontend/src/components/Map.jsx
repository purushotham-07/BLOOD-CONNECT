import { lazy, Suspense, memo, useState, useCallback, useEffect, useRef } from 'react';
import Loading from './Loading';

const LeafletMap = lazy(() => import('./LeafletMap'));
const DEFAULT_COORDS = { lat: 17.385044, lng: 78.486671 };

const POPULAR_HUBS = [
  { name: 'Hyderabad', lat: 17.385044, lng: 78.486671 },
  { name: 'Bangalore', lat: 12.971598, lng: 77.594566 },
  { name: 'Delhi NCR', lat: 28.613939, lng: 77.209023 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
];

function getLocationBadge(item) {
  const type = (item.type || '').toLowerCase();
  const displayName = (item.display_name || '').toLowerCase();

  if (
    displayName.includes('college') ||
    displayName.includes('university') ||
    displayName.includes('campus') ||
    type.includes('university') ||
    type.includes('college')
  ) {
    return { icon: '🎓', label: 'College / University' };
  }
  if (
    displayName.includes('school') ||
    displayName.includes('vidyalaya') ||
    displayName.includes('academy') ||
    type.includes('school')
  ) {
    return { icon: '🏫', label: 'School' };
  }
  if (
    displayName.includes('hospital') ||
    displayName.includes('clinic') ||
    displayName.includes('health') ||
    type.includes('hospital')
  ) {
    return { icon: '🏥', label: 'Hospital' };
  }
  if (
    displayName.includes('metro') ||
    displayName.includes('station') ||
    displayName.includes('railway')
  ) {
    return { icon: '🚇', label: 'Station' };
  }
  if (
    displayName.includes('tech park') ||
    displayName.includes('office') ||
    displayName.includes('tower') ||
    displayName.includes('cyber')
  ) {
    return { icon: '🏢', label: 'Tech Park / Office' };
  }
  return { icon: '📍', label: 'Area' };
}

/**
 * Advanced mobile-optimized interactive Map component with OpenStreetMap Search & GPS.
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
  const [searchFeedback, setSearchFeedback] = useState(null);
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

  // Perform geocoding search using OpenStreetMap Nominatim
  const executeSearch = useCallback(async (query) => {
    if (!query || !query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    setSearchFeedback(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&limit=7&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setSearchResults(data);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
          setSearchFeedback('No matching location found. Try searching by city or landmark.');
          setShowDropdown(false);
        }
      }
    } catch (err) {
      console.error('Location search error:', err);
      setSearchFeedback('Could not connect to search. Tap directly on the map or use GPS.');
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced live typing search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(searchQuery);
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, executeSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      executeSearch(searchQuery);
    }
  };

  const selectSearchResult = (item) => {
    const coords = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
    onChange?.(coords);
    setShowDropdown(false);
    setSearchFeedback(null);

    const mainTitle =
      item.name ||
      item.address?.suburb ||
      item.address?.city ||
      item.display_name?.split(',')[0];

    setSearchQuery(mainTitle || item.display_name);
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
          setLocateError('GPS permission denied. Please search your location above or tap on the map.');
        } else if (err?.code === 2) {
          setLocateError('Position unavailable. Please search your location above or tap on the map.');
        } else if (err?.code === 3) {
          setLocateError('GPS request timed out. Please search your location above or tap on the map.');
        } else {
          setLocateError('Could not get GPS location. Please search your location above or tap on the map.');
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
      setSearchFeedback(null);
      onChange?.(pos);
    },
    [interactive, onChange]
  );

  const currentLat = value?.lat ?? DEFAULT_COORDS.lat;
  const currentLng = value?.lng ?? DEFAULT_COORDS.lng;

  return (
    <div className="w-full space-y-2.5">
      {/* Advanced Location Search Bar & Controls */}
      {interactive && !requestData && (
        <div ref={searchContainerRef} className="relative z-30 space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Form Box */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFeedback(null);
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  placeholder="Search city, hospital, area, or landmark..."
                  className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-16 py-2 text-xs outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowDropdown(false);
                        setSearchFeedback(null);
                      }}
                      className="p-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition"
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                    className="rounded-lg bg-gray-900 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-black transition disabled:opacity-50"
                  >
                    {searching ? '…' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Live Search Suggestions Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl z-50 divide-y divide-gray-50 text-xs">
                  {searchResults.map((item, idx) => {
                    const { icon, label } = getLocationBadge(item);
                    const mainName =
                      item.name ||
                      item.address?.suburb ||
                      item.address?.city ||
                      item.display_name.split(',')[0];

                    const subAddress = [
                      item.address?.suburb,
                      item.address?.city || item.address?.town || item.address?.county,
                      item.address?.state,
                    ]
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <li
                        key={idx}
                        onClick={() => selectSearchResult(item)}
                        className="cursor-pointer px-3.5 py-2.5 hover:bg-brand-50 transition flex items-start gap-2.5"
                      >
                        <span className="text-base mt-0.5 shrink-0">{icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate">{mainName}</p>
                            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-600 shrink-0">
                              {label}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{subAddress || item.display_name}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </form>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              {enableLocate && (
                <button
                  type="button"
                  onClick={locate}
                  disabled={locating}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 px-3 py-2 text-xs font-bold transition shadow-2xs"
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
                  setSearchResults([]);
                  setShowDropdown(false);
                  setSearchFeedback(null);
                  onChange?.(DEFAULT_COORDS);
                }}
                className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-2.5 py-2 text-xs font-semibold transition shadow-2xs"
                title="Reset to City Center"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Quick Hub Jump Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <span className="text-gray-400 text-[10px] font-semibold shrink-0">Quick jump:</span>
            {POPULAR_HUBS.map((hub) => (
              <button
                key={hub.name}
                type="button"
                onClick={() => {
                  onChange?.({ lat: hub.lat, lng: hub.lng });
                  setSearchQuery(hub.name);
                }}
                className="shrink-0 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition"
              >
                📍 {hub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 shadow-2xs">
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

        {/* Selected Coordinates Status HUD */}
        {interactive && (
          <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-gray-700 shadow-xs border border-gray-200 backdrop-blur-xs flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>Pin: {currentLat.toFixed(4)}, {currentLng.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* Search Feedback & Informational Status Banners */}
      {searchFeedback && (
        <div className="rounded-xl bg-gray-100 p-2 text-[11px] font-medium text-gray-700" role="status">
          ℹ️ {searchFeedback}
        </div>
      )}

      {locateError && (
        <div className="rounded-xl bg-rose-50 p-2 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200" role="alert">
          {locateError}
        </div>
      )}

      {accuracyNotice && (
        <div className="rounded-xl bg-amber-50 p-2 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200" role="alert">
          {accuracyNotice}
        </div>
      )}
    </div>
  );
}

export default memo(Map);