import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { requestApi } from '../api/requestApi';
import { Badge, Button } from '../components/ui';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatBloodGroup, formatDate, statusTone, urgencyTone, titleCase } from '../utils/helpers';
import { REQUEST_STATUS } from '../utils/labels';

export default function BloodRequests() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const { data, loading, error } = useApi(() => requestApi.list(status ? { status } : {}), [status]);

  const isDonor = user.role === 'DONOR';
  const requests = data || [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isDonor ? 'Browse blood requests' : 'My blood requests'}
          </h1>
          <p className="mt-1 text-gray-500">
            {isDonor
              ? 'Find nearby requests you can help with.'
              : 'Track the status of your requests.'}
          </p>
        </div>
        {!isDonor && (
          <Link to="/create-request">
            <Button>New blood request</Button>
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatus('')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${status === '' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          All
        </button>
        {REQUEST_STATUS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${status === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {titleCase(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading className="mt-10" />
      ) : error ? (
        <ErrorMessage error={error} fallback="Could not load blood requests." />
      ) : requests.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-gray-500">No blood requests found.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <ul className="divide-y divide-gray-100">
            {requests.map((r) => (
              <li key={r.id}>
                <Link to={`/blood-requests/${r.id}`} className="flex flex-col gap-2 p-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center justify-center rounded-lg bg-brand-50 px-3 py-1 font-bold text-brand-700">
                      {formatBloodGroup(r.blood_group)}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{titleCase(r.component)}</span>
                    <span className="text-sm text-gray-400">· {r.units_required} unit{r.units_required > 1 ? 's' : ''}</span>
                    <span className="text-sm text-gray-500">{r.hospital_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                    <Badge tone={urgencyTone(r.urgency)}>{titleCase(r.urgency)}</Badge>
                    <Badge tone={statusTone(r.status)}>{titleCase(r.status)}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}