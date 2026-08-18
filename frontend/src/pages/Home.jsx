import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    title: 'Intelligent Proximity Matching',
    text: 'Instantly identifies compatible donors nearby within custom emergency radiuses (10km to 30km).',
    icon: 'M12 3a7 7 0 0 0-7 7c0 5 5.5 9 7 10.5C13.5 19 19 15 19 10a7 7 0 0 0-7-7Z',
  },
  {
    title: 'Adaptive Blood Compatibility',
    text: 'Centralized component rules for Red Cells, Whole Blood, Platelets, and Plasma that shortlist only medically compatible donors.',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H7.5',
  },
  {
    title: 'Real-Time Interactive Map',
    text: 'Interactive live map with instant emergency notifications, anonymous logistics chat, and turn-by-turn navigation.',
    icon: 'M9 12l2 2 4-4M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z',
  },
];

export default function Home() {
  const { user } = useAuth();
  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-brand-700 shadow-sm ring-1 ring-brand-200">
              <span className="h-2 w-2 animate-ping rounded-full bg-brand-500" />
              Emergency Blood Coordination & Live Donor Network
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Match compatible donors <br className="hidden sm:inline" />
              <span className="text-brand-600">by live geographic radius</span>.
            </h1>
            <p className="mt-5 text-base text-gray-600 sm:text-lg leading-relaxed">
              When an urgent blood request is created, BloodConnect immediately locates, ranks, and alerts compatible nearby donors on an interactive live map.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {user ? (
                <Link
                  to="/dashboard"
                  className="rounded-xl bg-brand-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-md transition-all hover:bg-brand-700 hover:shadow-lg"
                >
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="rounded-xl bg-brand-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-md transition-all hover:bg-brand-700 hover:shadow-lg"
                  >
                    Join as Donor or Receiver
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-center text-sm font-bold text-gray-700 shadow-xs transition-all hover:bg-gray-50"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={f.icon} />
                </svg>
              </div>
              <h3 className="mt-5 text-base font-bold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-xs text-amber-900">
          <strong>Important Coordination Notice:</strong> BloodConnect provides real-time geographic coordination to connect nearby donors and requests. Final compatibility and donor eligibility must always be verified by qualified medical and blood-bank personnel before fulfilling donations.
        </div>
      </section>
    </main>
  );
}