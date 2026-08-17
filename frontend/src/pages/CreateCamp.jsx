import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { campApi } from '../api/campApi';
import Map from '../components/Map';
import { Button, Card, Input } from '../components/ui';
import ErrorMessage from '../components/ErrorMessage';

const DEFAULT_LOCATION = { lat: 17.385044, lng: 78.486671 };

export default function CreateCamp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    organizerName: '',
    contactPhone: '',
    campDate: '',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    targetDonors: 50,
    venueName: '',
    venueAddress: '',
    description: '',
  });
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    setError(null);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const latVal = parseFloat(location?.lat ?? DEFAULT_LOCATION.lat);
    const lngVal = parseFloat(location?.lng ?? DEFAULT_LOCATION.lng);

    if (Number.isNaN(latVal) || Number.isNaN(lngVal)) {
      setError('Please select a valid venue location on the map.');
      setSubmitting(false);
      return;
    }

    try {
      await campApi.create({
        ...form,
        targetDonors: Number(form.targetDonors) || 50,
        latitude: latVal,
        longitude: lngVal,
      });
      navigate('/camps', { replace: true });
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8">
      <Link to="/camps" className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
        ← Back to all donation camps
      </Link>

      <div className="mt-3">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Host a Blood Donation Camp 🎪</h1>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          Publish your blood donation drive on the map so nearby community donors can RSVP and attend.
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Form Column */}
        <Card>
          <form onSubmit={onSubmit} className="space-y-3.5">
            {error && <ErrorMessage error={error} />}

            <Input
              label="Camp Title / Event Name"
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="e.g. City Community Mega Blood Drive"
              required
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Organizer / Organization Name"
                name="organizerName"
                value={form.organizerName}
                onChange={onChange}
                placeholder="e.g. Red Cross / Rotary Club"
                required
              />

              <Input
                label="Contact Phone"
                name="contactPhone"
                value={form.contactPhone}
                onChange={onChange}
                placeholder="+91 9876543210"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label="Camp Date"
                name="campDate"
                type="date"
                value={form.campDate}
                onChange={onChange}
                required
              />

              <Input
                label="Start Time"
                name="startTime"
                value={form.startTime}
                onChange={onChange}
                placeholder="09:00 AM"
                required
              />

              <Input
                label="End Time"
                name="endTime"
                value={form.endTime}
                onChange={onChange}
                placeholder="05:00 PM"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Venue Name"
                name="venueName"
                value={form.venueName}
                onChange={onChange}
                placeholder="e.g. Town Hall / University Grounds"
                required
              />

              <Input
                label="Target Donor Count"
                name="targetDonors"
                type="number"
                min="10"
                max="5000"
                value={form.targetDonors}
                onChange={onChange}
                required
              />
            </div>

            <Input
              label="Venue Street Address"
              name="venueAddress"
              value={form.venueAddress}
              onChange={onChange}
              placeholder="e.g. Road No. 12, Main Square, City"
              required
            />

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-700">Camp Details / Perks (Optional)</span>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows="3"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs sm:text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="Refreshments provided, free health checkup, certificate given to every donor..."
              />
            </label>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs"
            >
              {submitting ? 'Publishing Camp…' : 'Publish Donation Camp on Map 🎪'}
            </Button>
          </form>
        </Card>

        {/* Location Selection Column */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-gray-900 sm:text-sm">Camp Venue Map Location</span>
              <p className="text-[11px] text-gray-500">
                Tap the exact venue location or use GPS.
              </p>
            </div>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
              Venue GPS
            </span>
          </div>

          <Map value={location} onChange={setLocation} height="320px" />

          <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span>Selected Coordinates:</span>
            <span className="font-mono font-bold text-gray-800">
              {(location?.lat ?? DEFAULT_LOCATION.lat).toFixed(4)}, {(location?.lng ?? DEFAULT_LOCATION.lng).toFixed(4)}
            </span>
          </div>
        </Card>
      </div>
    </main>
  );
}
