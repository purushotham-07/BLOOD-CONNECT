import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestApi } from '../api/requestApi';
import Map from '../components/Map';
import { Button, Card, Input, Select } from '../components/ui';
import ErrorMessage from '../components/ErrorMessage';
import { BLOOD_GROUPS, COMPONENTS, URGENCY } from '../utils/labels';

const DEFAULT_LOCATION = { lat: 17.385044, lng: 78.486671 };

export default function CreateBloodRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bloodGroup: 'O_POSITIVE',
    component: 'RED_CELLS',
    unitsRequired: 1,
    hospitalName: '',
    hospitalAddress: '',
    urgency: 'URGENT',
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
      setError('Please select a valid location on the map.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await requestApi.create({
        ...form,
        unitsRequired: Number(form.unitsRequired) || 1,
        latitude: latVal,
        longitude: lngVal,
      });
      navigate(`/blood-requests/${res.data.data.id}`, { replace: true });
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  const urgencyRadiusNote =
    form.urgency === 'CRITICAL'
      ? '30 km search radius'
      : form.urgency === 'URGENT'
        ? '20 km search radius'
        : '10 km search radius';

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8">
      <Link to="/dashboard" className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
        ← Back to dashboard
      </Link>

      <div className="mt-3">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Create New Blood Request</h1>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          BloodConnect will instantly locate and alert compatible donors in the hospital area.
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Form Column */}
        <Card>
          <form onSubmit={onSubmit} className="space-y-3.5">
            {error && <ErrorMessage error={error} />}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Blood Group Needed" name="bloodGroup" value={form.bloodGroup} onChange={onChange}>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </Select>

              <Select label="Component Required" name="component" value={form.component} onChange={onChange}>
                {COMPONENTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Units Required"
                name="unitsRequired"
                type="number"
                min="1"
                max="50"
                value={form.unitsRequired}
                onChange={onChange}
                required
              />

              <div>
                <Select label="Request Urgency" name="urgency" value={form.urgency} onChange={onChange}>
                  {URGENCY.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-[11px] font-semibold text-brand-600">
                  ⚡ {urgencyRadiusNote}
                </p>
              </div>
            </div>

            <Input
              label="Hospital Name"
              name="hospitalName"
              value={form.hospitalName}
              onChange={onChange}
              placeholder="e.g. Apollo Hospital / City General"
              required
            />

            <Input
              label="Hospital Address / Department (Optional)"
              name="hospitalAddress"
              value={form.hospitalAddress}
              onChange={onChange}
              placeholder="e.g. Emergency Wing, 2nd Floor, Room 204"
            />

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-700">Medical Notes for Donors (Optional)</span>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows="3"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs sm:text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="Any instructions for donors (e.g. required before 8:00 PM, patient contact)..."
              />
            </label>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs"
            >
              {submitting ? 'Finding Compatible Donors…' : 'Submit & Match Donors on Map 🩸'}
            </Button>
          </form>
        </Card>

        {/* Location Selection Column */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-gray-900 sm:text-sm">Hospital Geographic Location</span>
              <p className="text-[11px] text-gray-500">
                Tap anywhere on map or tap "Use Current GPS".
              </p>
            </div>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700">
              Hospital Pin
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