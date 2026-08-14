/** Extract a human-readable message from an Axios error. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}

/** Format a DB snake_case value into a friendly label, e.g. A_POSITIVE -> A+. */
export function formatBloodGroup(value = '') {
  if (!value) return '—';
  const [abo, rh] = value.split('_');
  return `${abo}${rh?.toLowerCase().startsWith('pos') ? '+' : '−'}`;
}

/** Snake_case -> Title Case. */
export function titleCase(value = '') {
  return value
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function statusTone(status = '') {
  const map = {
    PENDING_VERIFICATION: 'bg-amber-100 text-amber-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    MATCHING: 'bg-indigo-100 text-indigo-800',
    PARTIALLY_FULFILLED: 'bg-violet-100 text-violet-800',
    FULFILLED: 'bg-emerald-100 text-emerald-800',
    EXPIRED: 'bg-gray-200 text-gray-600',
    CANCELLED: 'bg-rose-100 text-rose-800',
    NOTIFIED: 'bg-gray-200 text-gray-600',
    VIEWED: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-emerald-100 text-emerald-800',
    DECLINED: 'bg-rose-100 text-rose-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export function urgencyTone(urgency = '') {
  const map = {
    NORMAL: 'bg-sky-100 text-sky-800',
    URGENT: 'bg-amber-100 text-amber-800',
    CRITICAL: 'bg-rose-100 text-rose-800',
  };
  return map[urgency] || 'bg-gray-100 text-gray-700';
}

/**
 * Returns Google Maps directions URL:
 * - Mobile: Launches Google Maps app via maps.google.com/?q=lat,lng
 * - Desktop/Laptop: Opens Google Maps web directions via google.com/maps/dir/?api=1&destination=lat,lng
 */
export function getDirectionsUrl(lat, lng, label = '') {
  if (!lat || !lng) return null;
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const cleanLat = parseFloat(lat);
  const cleanLng = parseFloat(lng);

  if (isMobile) {
    // Triggers Google Maps mobile app directly
    return `https://maps.google.com/?q=${cleanLat},${cleanLng}${label ? `(${encodeURIComponent(label)})` : ''}`;
  }

  // Desktop / laptop web browser directions
  return `https://www.google.com/maps/dir/?api=1&destination=${cleanLat},${cleanLng}`;
}