import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { requestApi } from '../api/requestApi';
import { Badge, Button, Input } from '../components/ui';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatBloodGroup, formatDate, statusTone, urgencyTone, titleCase } from '../utils/helpers';
import { BLOOD_GROUPS, COMPONENTS, URGENCY } from '../utils/labels';

export default function BloodRequests() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedComponent, setSelectedComponent] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');

  const { data, loading, error } = useApi(() => requestApi.list(), []);

  const isDonor = user?.role === 'DONOR';
  const rawRequests = data || [];

  // Filter requests locally
  const filteredRequests = useMemo(() => {
    return rawRequests.filter((r) => {
      // Search text match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesHospital = r.hospital_name?.toLowerCase().includes(query);
        const matchesAddress = r.hospital_address?.toLowerCase().includes(query);
        const matchesDesc = r.description?.toLowerCase().includes(query);
        if (!matchesHospital && !matchesAddress && !matchesDesc) return false;
      }

      // Blood group filter
      if (selectedGroup !== 'ALL' && r.blood_group !== selectedGroup) {
        return false;
      }

      // Component filter
      if (selectedComponent !== 'ALL' && r.component !== selectedComponent) {
        return false;
      }

      // Urgency filter
      if (selectedUrgency !== 'ALL' && r.urgency !== selectedUrgency) {
        return false;
      }

      return true;
    });
  }, [rawRequests, searchTerm, selectedGroup, selectedComponent, selectedUrgency]);

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {isDonor ? 'Browse Urgent Blood Requests 🩸' : 'My Blood Requests'}
          </h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            {isDonor
              ? 'Find patients nearby and respond immediately to save lives.'
              : 'Track the real-time fulfillment status of your blood requests.'}
          </p>
        </div>
        {!isDonor && (
          <Link to="/create-request">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs">
              + New Blood Request
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Smart Filters Bar */}
      <div className="mt-5 space-y-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search by hospital name, city area, or medical notes..."
            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          {/* Blood Group Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-gray-400 text-[11px]">Group:</span>
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`rounded-full px-2.5 py-1 font-bold text-[11px] transition ${
                selectedGroup === 'ALL'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                onClick={() => setSelectedGroup(bg)}
                className={`rounded-full px-2.5 py-1 font-bold text-[11px] transition ${
                  selectedGroup === bg
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatBloodGroup(bg)}
              </button>
            ))}
          </div>

          {/* Component Selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-400 text-[11px]">Component:</span>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 outline-none"
            >
              <option value="ALL">All Components</option>
              {COMPONENTS.map((c) => (
                <option key={c} value={c}>
                  {titleCase(c)}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency Selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-400 text-[11px]">Urgency:</span>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 outline-none"
            >
              <option value="ALL">All Urgencies</option>
              {URGENCY.map((u) => (
                <option key={u} value={u}>
                  {titleCase(u)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <Loading className="mt-8" label="Loading blood requests…" />
      ) : error ? (
        <div className="mt-6">
          <ErrorMessage error={error} />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <span className="text-3xl">🩸</span>
          <p className="mt-2 text-sm font-bold text-gray-800">No matching blood requests found.</p>
          <p className="mt-1 text-xs text-gray-500">Try changing your search keywords or blood group filters.</p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          <ul className="divide-y divide-gray-100">
            {filteredRequests.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/blood-requests/${r.id}`}
                  className="flex flex-col gap-3 p-4 transition hover:bg-gray-50/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-extrabold text-brand-700 ring-1 ring-brand-200">
                      {formatBloodGroup(r.blood_group)}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{r.hospital_name}</span>
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                          {titleCase(r.component)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {r.units_required} unit{r.units_required > 1 ? 's' : ''} requested · {r.hospital_address || 'Address provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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