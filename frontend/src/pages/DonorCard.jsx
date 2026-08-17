import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { donorApi } from '../api/donorApi';
import { Button, Card } from '../components/ui';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatBloodGroup, formatDate } from '../utils/helpers';

export default function DonorCard() {
  const { user } = useAuth();
  const cardRef = useRef(null);

  const profileApi = useApi(() => donorApi.getProfile(), []);
  const eligibilityApi = useApi(() => donorApi.getEligibility(), []);
  const donationsApi = useApi(() => donorApi.myDonations(), []);

  const profile = profileApi.data?.data ?? profileApi.data;
  const donations = donationsApi.data?.data ?? donationsApi.data ?? [];
  const donationCount = Array.isArray(donations) ? donations.length : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Digital Donor ID & Life-Saver Pass 🪪</h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Your official verified BloodConnect digital donor recognition card.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            className="bg-gray-900 hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs"
          >
            🖨️ Print / Save Pass
          </Button>
        </div>
      </div>

      {profileApi.loading ? (
        <Loading className="mt-8" label="Generating your donor card…" />
      ) : profileApi.error ? (
        <div className="mt-6">
          <Card>
            <div className="text-center py-6">
              <span className="text-4xl">🩸</span>
              <h2 className="mt-2 text-base font-bold text-gray-900">Donor Profile Not Found</h2>
              <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                Please complete your donor registration to generate your official Life-Saver Pass.
              </p>
              <Link to="/donor-profile" className="mt-4 inline-block">
                <Button className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2 px-4 rounded-xl">
                  Create Donor Profile
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center">
          {/* Printable Donor ID Card */}
          <div
            ref={cardRef}
            className="w-full max-w-md overflow-hidden rounded-3xl border-2 border-brand-600 bg-gradient-to-br from-white via-rose-50/30 to-brand-50/50 p-6 shadow-xl ring-4 ring-brand-100/50"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-brand-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-xs">
                  🩸
                </span>
                <div>
                  <h2 className="text-base font-black tracking-tight text-gray-900">BloodConnect</h2>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                    Official Life-Saver Pass
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
                ✓ VERIFIED DONOR
              </span>
            </div>

            {/* Card Body */}
            <div className="mt-5 grid grid-cols-3 gap-4 items-center">
              <div className="col-span-2 space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Donor Name</span>
                  <p className="text-base font-extrabold text-gray-900 truncate">{user?.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email & Contact</span>
                  <p className="text-xs font-medium text-gray-600 truncate">{user?.email}</p>
                  {user?.phone && <p className="text-xs font-medium text-gray-600">{user?.phone}</p>}
                </div>
              </div>

              {/* Big Blood Group Badge */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-brand-600 p-3 text-white shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Blood</span>
                <span className="text-3xl font-black">{formatBloodGroup(profile.blood_group)}</span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white/80 p-3 border border-gray-100 shadow-2xs">
              <div>
                <span className="text-[10px] font-semibold text-gray-400">Total Donations</span>
                <p className="text-sm font-bold text-gray-900">{donationCount} Life-Saving Units</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-400">Member Since</span>
                <p className="text-sm font-bold text-gray-900">{formatDate(user?.created_at || new Date())}</p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-5 flex items-center justify-between border-t border-brand-100 pt-3 text-[10px] text-gray-400">
              <span>ID: {user?.id?.slice(0, 13)}…</span>
              <span>PostGIS Verified Donor Network</span>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Show this digital card at participating hospitals and blood banks for expedited donor processing.
          </p>
        </div>
      )}
    </main>
  );
}
