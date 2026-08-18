import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { donorApi } from '../api/donorApi';
import Map from '../components/Map';
import { Button, Card, Input, Select } from '../components/ui';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { BLOOD_GROUPS, COMPONENTS } from '../utils/labels';
import { getErrorMessage, formatBloodGroup, formatDate } from '../utils/helpers';

const DEFAULT_LOCATION = { lat: 17.385044, lng: 78.486671 };

export default function DonorProfile() {
  const profileApi = useApi(
    () =>
      donorApi.getProfile().catch((e) => {
        if (e.response?.status === 404) return { data: { data: null } };
        throw e;
      }),
    []
  );
  const eligibilityApi = useApi(() => donorApi.getEligibility(), []);
  const donationsApi = useApi(() => donorApi.myDonations(), []);

  const existing = profileApi.data?.data ?? profileApi.data;

  const [form, setForm] = useState({
    bloodGroup: 'O_POSITIVE',
    available: true,
    notificationRadius: 15,
  });
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load saved location from PostgreSQL when existing profile is loaded
  useEffect(() => {
    if (existing) {
      setForm({
        bloodGroup: existing.blood_group || 'O_POSITIVE',
        available: existing.available !== false,
        notificationRadius: existing.notification_radius || 15,
      });

      if (existing.latitude && existing.longitude) {
        setLocation({
          lat: parseFloat(existing.latitude),
          lng: parseFloat(existing.longitude),
        });
      }
    }
  }, [existing]);

  const onChange = (e) => {
    setSuccess(null);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const latVal = parseFloat(location?.lat ?? DEFAULT_LOCATION.lat);
    const lngVal = parseFloat(location?.lng ?? DEFAULT_LOCATION.lng);

    if (Number.isNaN(latVal) || Number.isNaN(lngVal)) {
      setError('Please select a valid location on the map.');
      setSaving(false);
      return;
    }

    const payload = {
      bloodGroup: form.bloodGroup,
      latitude: latVal,
      longitude: lngVal,
      available: form.available,
      notificationRadius: Number(form.notificationRadius) || 15,
    };

    try {
      if (existing && existing.id) {
        await donorApi.updateProfile(payload);
        setSuccess('Donor profile and location updated successfully in database.');
      } else {
        await donorApi.createProfile(payload);
        setSuccess('Donor profile created successfully! You are now active for matching.');
      }
      await profileApi.reload();
      await eligibilityApi.reload();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Donor Profile & Location</h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Configure your blood group, notification radius, and saved location. BloodConnect uses this to match you with nearby blood requests.
          </p>
        </div>
        {existing && (
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            ✓ Verified Active Donor
          </span>
        )}
      </div>

      {profileApi.loading ? (
        <Loading className="mt-8" label="Loading saved donor profile…" />
      ) : profileApi.error ? (
        <ErrorMessage error={profileApi.error} />
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* Profile Form */}
          <div className="space-y-5">
            <Card>
              <form onSubmit={onSubmit} className="space-y-4">
                {error && <ErrorMessage error={error} />}
                {success && (
                  <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 animate-slide-up">
                    {success}
                  </div>
                )}

                {/* Medical Eligibility Screening Status */}
                <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-3 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🩺</span>
                    <div>
                      <p className="font-bold text-emerald-900">Medical Pre-Screening</p>
                      <p className="text-[11px] text-emerald-700">Health & eligibility verification verified</p>
                    </div>
                  </div>
                  <Link
                    to="/eligibility-quiz"
                    className="shrink-0 text-[11px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition"
                  >
                    Retake Quiz 🩺
                  </Link>
                </div>

                <Select label="My Blood Group" name="bloodGroup" value={form.bloodGroup} onChange={onChange}>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </Select>

                <div className="rounded-xl border border-gray-200 p-3.5 bg-gray-50/50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.available}
                      onChange={(e) => {
                        setSuccess(null);
                        setForm((f) => ({ ...f, available: e.target.checked }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 accent-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 sm:text-sm">
                        Available to Receive Donation Requests
                      </span>
                      <p className="text-[11px] text-gray-500">
                        When enabled, you will receive notifications for urgent requests in your radius.
                      </p>
                    </div>
                  </label>
                </div>

                <Input
                  label="Notification Radius (km)"
                  name="notificationRadius"
                  type="number"
                  min="1"
                  max="100"
                  value={form.notificationRadius}
                  onChange={onChange}
                  helperText="Requests farther than this radius will not notify you."
                />

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs text-sm"
                >
                  {saving ? 'Saving to Database…' : existing ? 'Update Saved Profile' : 'Register Donor Profile 🩸'}
                </Button>
              </form>
            </Card>

            {/* Eligibility & Donation History */}
            <Card>
              <h3 className="text-sm font-bold text-gray-900 sm:text-base">Donation Eligibility</h3>
              <p className="text-xs text-gray-500">
                Server-side coordination rules based on your donation interval.
              </p>

              {eligibilityApi.data && (
                <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Eligibility Status:</span>
                    {eligibilityApi.data.eligible ? (
                      <span className="font-bold text-emerald-700">✓ Eligible to Donate</span>
                    ) : (
                      <span className="font-bold text-amber-700">
                        Eligible on {formatDate(eligibilityApi.data.nextEligibleDate)}
                      </span>
                    )}
                  </div>
                  {eligibilityApi.data.lastDonationDate && (
                    <div className="mt-1 flex items-center justify-between text-gray-500">
                      <span>Last Recorded Donation:</span>
                      <span>{formatDate(eligibilityApi.data.lastDonationDate)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 border-t border-gray-100 pt-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Record Completed Donation
                </h4>
                <RecordDonationForm
                  onRecorded={() => {
                    eligibilityApi.reload();
                    donationsApi.reload();
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Location Selection & Map Card */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-gray-900 sm:text-sm">Saved Donor Location</span>
                <p className="text-[11px] text-gray-500">
                  Tap anywhere on map or use GPS. Exact coordinates are kept strictly confidential.
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                Saved Location
              </span>
            </div>

            <Map value={location} onChange={setLocation} height="320px" />

            <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <span>Selected Coordinates:</span>
              <span className="font-mono font-bold text-gray-800">
                {(location?.lat ?? DEFAULT_LOCATION.lat).toFixed(4)}, {(location?.lng ?? DEFAULT_LOCATION.lng).toFixed(4)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              Tip: Tap "Use Current GPS" to auto-detect your location on mobile.
            </p>
          </Card>
        </div>
      )}
    </main>
  );
}

function RecordDonationForm({ onRecorded }) {
  const [date, setDate] = useState('');
  const [component, setComponent] = useState('WHOLE_BLOOD');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await donorApi.recordDonation({ donationDate: date, component });
      setMsg({ ok: true, text: 'Donation recorded successfully.' });
      setDate('');
      onRecorded?.();
    } catch (err) {
      setMsg({ ok: false, text: getErrorMessage(err, 'Could not record donation.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Input label="Donation Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <Select label="Component Donated" value={component} onChange={(e) => setComponent(e.target.value)}>
        {COMPONENTS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <div className="col-span-1 sm:col-span-2 flex items-center gap-3">
        <Button variant="secondary" type="submit" disabled={busy} className="text-xs py-2">
          Save Donation
        </Button>
        {msg && (
          <span className={`text-xs font-semibold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}