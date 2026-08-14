import { useState } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import api from '../api/axios';
import { Badge, Card } from '../components/ui';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatDateTime, formatBloodGroup, titleCase } from '../utils/helpers';

const TYPE_TONE = {
  NEW_MATCH: 'bg-emerald-100 text-emerald-800',
  RESPONSE_RECEIVED: 'bg-blue-100 text-blue-800',
  REQUEST_VERIFIED: 'bg-indigo-100 text-indigo-800',
  SYSTEM: 'bg-gray-100 text-gray-700',
};

export default function Notifications() {
  const { data, loading, error, reload } = useApi(async () => (await api.get('/notifications')).data);
  const [busy, setBusy] = useState(null);
  const notifications = data || [];

  const markRead = async (id) => {
    setBusy(id);
    try {
      await api.patch(`/notifications/${id}/read`);
      await reload();
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      <p className="mt-1 text-gray-500">Updates about nearby requests and donor activity.</p>

      {loading ? (
        <Loading className="mt-10" />
      ) : error ? (
        <ErrorMessage error={error} fallback="Could not load notifications." />
      ) : notifications.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-gray-500">You're all caught up.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {notifications.map((n) => (
            <li key={n.id}>
              <Card className={`p-4 ${n.status === 'READ' ? 'opacity-70' : ''}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Badge tone={TYPE_TONE[n.type] || 'bg-gray-100 text-gray-700'}>{titleCase(n.type)}</Badge>
                    <div className="text-sm text-gray-700">
                      {n.blood_request_id ? (
                        <Link to={`/blood-requests/${n.blood_request_id}`} className="group block">
                          <span className="font-medium text-gray-900 hover:text-brand-600">
                            {n.blood_group ? `${formatBloodGroup(n.blood_group)} request` : 'Wanted: blood donation'} — {n.hospital_name || 'nearby'}
                          </span>
                        </Link>
                      ) : (
                        <span>{n.blood_group ? `${formatBloodGroup(n.blood_group)} blood needed at ${n.hospital_name || 'a nearby hospital'}` : 'New update'}</span>
                      )}
                      <span className="block text-xs text-gray-400">{formatDateTime(n.sent_at)}</span>
                    </div>
                  </div>
                  {n.status === 'UNREAD' && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      disabled={busy === n.id}
                      className="self-start rounded-md px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:self-auto"
                    >
                      {busy === n.id ? 'Marking…' : 'Mark read'}
                    </button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}