import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/map.css';
import { formatBloodGroup, titleCase, getDirectionsUrl } from '../utils/helpers';
import { donorApi } from '../api/donorApi';

// ── Custom Leaflet Icons ──────────────────────────────────────────

const createRequestIcon = (urgency = 'NORMAL') => {
  const urgencyClass =
    urgency === 'CRITICAL'
      ? 'req-marker--critical'
      : urgency === 'URGENT'
        ? 'req-marker--urgent'
        : 'req-marker--normal';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="req-marker ${urgencyClass}">
        <div class="req-marker__icon">
          <span class="req-marker__symbol">🩸</span>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
};

const createDonorIcon = (bloodGroup, responseStatus) => {
  const isAccepted = responseStatus === 'ACCEPTED';
  const badgeText = isAccepted ? '✓' : '';
  const acceptedClass = isAccepted ? 'donor-marker--accepted' : '';
  const formattedBg = formatBloodGroup(bloodGroup);

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="donor-marker ${acceptedClass}">
        <div class="donor-marker__pin">
          <span>${formattedBg}</span>
          ${isAccepted ? `<span class="donor-marker__badge">${badgeText}</span>` : ''}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  });
};

const createUserLocationIcon = () =>
  L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="user-marker">
        <div class="user-marker__dot"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

// ── Helper Components ────────────────────────────────────────────

function AutoFitBounds({ bounds, center }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 1) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15, animate: true });
    } else if (center && Array.isArray(center) && center.length === 2 && !Number.isNaN(center[0])) {
      map.flyTo(center, Math.max(map.getZoom() || 14, 14), { duration: 0.8 });
    }
  }, [bounds, center, map]);
  return null;
}

function ClickHandler({ interactive, onChange }) {
  useMapEvents({
    click(e) {
      if (interactive && onChange) {
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

export default function LeafletMap({
  value,
  onChange,
  interactive = true,
  height = '360px',
  markerPosition,
  requestData,
  matchedDonors = [],
  showSearchRadius = true,
  enableDensityToggle = false,
}) {
  const defaultCenter = { lat: 17.385044, lng: 78.486671 };

  // Density layer state
  const [showDensity, setShowDensity] = useState(false);
  const [densityClusters, setDensityClusters] = useState([]);

  useEffect(() => {
    if (showDensity) {
      donorApi
        .getDensity({ bloodGroup: requestData?.blood_group })
        .then((res) => setDensityClusters(res.data.data || []))
        .catch(() => {});
    }
  }, [showDensity, requestData?.blood_group]);

  // Calculate search radius in meters
  const radiusMeters = useMemo(() => {
    if (!requestData) return 10000;
    if (requestData.urgency === 'CRITICAL') return 30000;
    if (requestData.urgency === 'URGENT') return 20000;
    return 10000;
  }, [requestData]);

  // Center position
  const centerPos = useMemo(() => {
    if (requestData && requestData.latitude && requestData.longitude) {
      return [parseFloat(requestData.latitude), parseFloat(requestData.longitude)];
    }
    if (markerPosition && markerPosition.lat !== undefined && markerPosition.lng !== undefined) {
      return [markerPosition.lat, markerPosition.lng];
    }
    if (value && value.lat !== undefined && value.lng !== undefined) {
      return [value.lat, value.lng];
    }
    return [defaultCenter.lat, defaultCenter.lng];
  }, [requestData, markerPosition, value]);

  // Bounds
  const mapBounds = useMemo(() => {
    const points = [];
    if (requestData && requestData.latitude && requestData.longitude) {
      points.push([parseFloat(requestData.latitude), parseFloat(requestData.longitude)]);
    }
    if (matchedDonors && matchedDonors.length > 0) {
      matchedDonors.forEach((d) => {
        if (d.approximateLocation?.latitude && d.approximateLocation?.longitude) {
          points.push([d.approximateLocation.latitude, d.approximateLocation.longitude]);
        }
      });
    }
    return points.length > 1 ? points : null;
  }, [requestData, matchedDonors]);

  const reqPos =
    requestData && requestData.latitude && requestData.longitude
      ? [parseFloat(requestData.latitude), parseFloat(requestData.longitude)]
      : null;

  const displaySingleMarker = markerPosition || (value && value.lat !== undefined ? value : null);

  const directionsUrl = reqPos
    ? getDirectionsUrl(reqPos[0], reqPos[1], requestData?.hospital_name)
    : null;

  return (
    <div className="relative w-full">
      {enableDensityToggle && (
        <button
          type="button"
          onClick={() => setShowDensity((d) => !d)}
          className={`absolute top-2.5 left-2.5 z-[1000] blood-map__control ${
            showDensity ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700'
          }`}
        >
          <span>🔥</span> {showDensity ? 'Hide Density' : 'Donor Density'}
        </button>
      )}

      <MapContainer
        center={centerPos}
        zoom={14}
        scrollWheelZoom={false}
        preferCanvas={true}
        style={{ height, width: '100%' }}
        className="blood-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <AutoFitBounds bounds={mapBounds} center={centerPos} />
        <ClickHandler interactive={interactive} onChange={onChange} />

        {/* Density Clusters */}
        {showDensity &&
          densityClusters.map((cluster, idx) => (
            <Circle
              key={`density-${idx}`}
              center={[parseFloat(cluster.cluster_lat), parseFloat(cluster.cluster_lng)]}
              radius={2000 + cluster.donor_count * 400}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#60a5fa',
                fillOpacity: 0.25,
                weight: 1,
              }}
            />
          ))}

        {/* Search Radius Circle */}
        {reqPos && showSearchRadius && (
          <Circle
            center={reqPos}
            radius={radiusMeters}
            pathOptions={{
              color: requestData.urgency === 'CRITICAL' ? '#e11d48' : '#ef4444',
              fillColor: requestData.urgency === 'CRITICAL' ? '#fecdd3' : '#fee2e2',
              fillOpacity: 0.12,
              weight: 1,
              dashArray: '4, 4',
            }}
          />
        )}

        {/* Blood Request Marker */}
        {reqPos && requestData && (
          <Marker position={reqPos} icon={createRequestIcon(requestData.urgency)}>
            <Popup className="blood-popup">
              <div className="popup-card">
                <div className="popup-card__header">
                  <span className="popup-card__title">🩸 Blood Needed</span>
                  <span
                    className={`popup-card__badge ${
                      requestData.urgency === 'CRITICAL'
                        ? 'popup-card__badge--critical'
                        : requestData.urgency === 'URGENT'
                          ? 'popup-card__badge--urgent'
                          : 'popup-card__badge--normal'
                    }`}
                  >
                    {requestData.urgency}
                  </span>
                </div>
                <div className="popup-card__row">
                  <span className="popup-card__label">Group</span>
                  <span className="popup-card__val font-bold text-brand-600">
                    {formatBloodGroup(requestData.blood_group)} ({titleCase(requestData.component || 'RED_CELLS')})
                  </span>
                </div>
                <div className="popup-card__row">
                  <span className="popup-card__label">Hospital</span>
                  <span className="popup-card__val">{requestData.hospital_name}</span>
                </div>
                <div className="popup-card__row">
                  <span className="popup-card__label">Fulfilled</span>
                  <span className="popup-card__val">
                    {requestData.units_fulfilled || 0}/{requestData.units_required} units
                  </span>
                </div>
                {directionsUrl && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-[11px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md py-1.5 transition"
                    >
                      🗺️ Open Google Maps Directions →
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Matched Donor Markers */}
        {matchedDonors &&
          matchedDonors.map((donor) => {
            if (!donor.approximateLatitude || !donor.approximateLongitude) return null;
            const donorPos = [donor.approximateLatitude, donor.approximateLongitude];
            const isAccepted = donor.responseStatus === 'ACCEPTED';

            return (
              <Marker
                key={donor.donorId}
                position={donorPos}
                icon={createDonorIcon(donor.bloodGroup, donor.responseStatus)}
              >
                <Popup className="blood-popup">
                  <div className="popup-card">
                    <div className="popup-card__header">
                      <span className="popup-card__title">Matched Donor</span>
                      <span
                        className={`popup-card__badge ${
                          isAccepted ? 'popup-card__badge--accepted' : 'popup-card__badge--notified'
                        }`}
                      >
                        {isAccepted ? 'ACCEPTED' : 'NOTIFIED'}
                      </span>
                    </div>
                    <div className="popup-card__row">
                      <span className="popup-card__label">Blood Group</span>
                      <span className="popup-card__val font-bold text-brand-600">
                        {formatBloodGroup(donor.bloodGroup)}
                      </span>
                    </div>
                    <div className="popup-card__row">
                      <span className="popup-card__label">Distance</span>
                      <span className="popup-card__val">≈ {donor.distanceKm} km</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Single Selection Marker */}
        {displaySingleMarker && !reqPos && (
          <Marker
            position={[displaySingleMarker.lat, displaySingleMarker.lng]}
            icon={createUserLocationIcon()}
          />
        )}
      </MapContainer>
    </div>
  );
}