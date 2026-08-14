import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestApi } from '../api/requestApi';
import Map from '../components/Map';
import { Button, Card, Input, Select } from '../components/ui';
import ErrorMessage from '../components/ErrorMessage';
import { BLOOD_GROUPS, COMPONENTS, URGENCY } from '../utils/labels';
import { getErrorMessage } from '../utils/helpers';

// Default center: Hyderabad / Metro
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

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await requestApi.create({
        ...form,
        unitsRequired: Number(form.unitsRequired),
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lng),
      });
      navigate(`/blood-requests/${res.data.data.id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the blood request.'));
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        ← Back to dashboard
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Create New Blood Request</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tell nearby donors what is needed. Our PostGIS matching engine will instantly locate and notify compatible donors around the hospital.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Form Column */}
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <ErrorMessage error={error} />}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <span className="mb-1 block text-sm font-medium text-gray-700">Medical Notes for Donors (Optional)</span>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows="3"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="Any specific instructions for donors (e.g. required before 8:00 PM, patient contact)..."
              />
            </label>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-base font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md"
            >
              {submitting ? 'Finding Compatible Donors…' : 'Submit & Match Donors on Map 🩸'}
            </Button>
          </form>
        </Card>

        {/* Location Selection Column */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-sm font-bold text-gray-900">Hospital Geographic Location</span>
              <p className="text-xs text-gray-500">
                Click map to pinpoint or click "Use My Location" (GPS).
              </p>
            </div>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
              PostgreSQL PostGIS
            </span>
          </div>

          <Map value={location} onChange={setLocation} height="380px" />

          <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span>Selected Coordinates:</span>
            <span className="font-mono font-bold text-gray-800">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </span>
          </div>
        </Card>
      </div>
    </main>
  );
}