import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { donorApi } from '../api/donorApi';
import { Button, Card, Input } from '../components/ui';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatBloodGroup, formatDate } from '../utils/helpers';
import { getErrorMessage } from '../utils/helpers';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Donor-specific data (optional).
  const [donorProfile, setDonorProfile] = useState(null);

    useEffect(() => {
    const load = async () => {
      try {
        const me = await authApi.getProfile();
        setForm({
          name: me?.data?.data?.name || user.name,
          phone: me?.data?.data?.phone || '',
        });
      } catch (e) {
        setError(getErrorMessage(e, 'Could not load your profile.'));
      } finally {
        setLoading(false);
      }

      // Donor-only data: only fetch for donors to avoid 403 noise.
      if (user.role === 'DONOR') {
        try {
          const profileRes = await donorApi.getProfile().catch(() => null);
          setDonorProfile(profileRes?.data?.data || null);
        } catch {
          /* no donor profile yet */
        }
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      setSuccess(true);
      await refreshUser();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update your profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-10"><Loading className="mt-8" /></main>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Account details</h1>
      <p className="mt-1 text-gray-500">Update your personal information here.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <ErrorMessage error={error} />}
            {success && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Details updated.</div>}

            <Input label="Full name" name="name" value={form.name} onChange={onChange} required />
            <Input label="Email" type="email" value={user.email} onChange={onChange} disabled />
            <Input label="Phone" name="phone" value={form.phone || ''} onChange={onChange} placeholder="Optional" />

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900">Your role</h2>
            <p className="mt-1 text-sm text-gray-500">
              {user.role === 'DONOR'
                ? 'You are registered as a donor. Your blood group and availability are set in your donor profile.'
                : 'You are registered to receive blood. Create requests from the dashboard.'}
            </p>
            {user.role === 'DONOR' && (
              <Link to="/donor-profile" className="mt-3 inline-block">
                <Button variant="secondary">Manage donor profile &amp; availability</Button>
              </Link>
            )}
          </Card>

          {user.role === 'DONOR' && donorProfile && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Donor summary</h2>
              <dl className="mt-3 space-y-1 text-sm">
                <Detail label="Blood group" value={formatBloodGroup(donorProfile.blood_group)} />
                <Detail label="Verified" value={donorProfile.verified ? 'Yes' : 'Pending'} />
                <Detail label="Available" value={donorProfile.available ? 'Yes' : 'No'} />
                <Detail label="Last donation" value={donorProfile.last_donation_date ? formatDate(donorProfile.last_donation_date) : '—'} />
                <Detail label="Radius" value={`${donorProfile.notification_radius} km`} />
              </dl>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}