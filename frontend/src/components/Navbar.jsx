import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

const NavItem = ({ to, label, unread = 0 }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
        isActive
          ? 'bg-brand-50 text-brand-700 shadow-xs'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    <span>{label}</span>
    {unread > 0 && (
      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-xs">
        {unread}
      </span>
    )}
  </NavLink>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unread } = useUnreadNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDonor = user?.role === 'DONOR';

  const links = [];
  if (user) {
    if (isDonor) {
      links.push({ to: '/dashboard', label: 'Dashboard' });
      links.push({ to: '/donor-profile', label: 'My Profile' });
      links.push({ to: '/donor-card', label: 'Donor Pass 🪪' });
      links.push({ to: '/blood-requests', label: 'Browse Requests' });
      links.push({ to: '/camps', label: 'Donation Camps 🎪' });
      links.push({ to: '/eligibility-quiz', label: 'Health Quiz 🩺' });
    } else {
      links.push({ to: '/dashboard', label: 'Dashboard' });
      links.push({ to: '/blood-requests', label: 'My Requests' });
      links.push({ to: '/create-request', label: '+ New Request' });
      links.push({ to: '/camps', label: 'Donation Camps 🎪' });
      links.push({ to: '/eligibility-quiz', label: 'Health Quiz 🩺' });
    }
    links.push({ to: '/notifications', label: 'Notifications', unread });
  } else {
    links.push({ to: '/camps', label: 'Donation Camps 🎪' });
    links.push({ to: '/eligibility-quiz', label: 'Eligibility Quiz 🩺' });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm ring-2 ring-brand-100 shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 21s-7-4.8-9.5-9A5.5 5.5 0 1 1 12 6.2 5.5 5.5 0 1 1 21.5 12C19 16.2 12 21 12 21Z" />
            </svg>
          </span>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-tight text-brand-600 leading-none">
              Blood<span className="text-gray-900">Connect</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <div key={l.to} className="relative">
              <NavItem to={l.to} label={l.label} />
              {l.to === '/notifications' && unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-xs">
                  {unread}
                </span>
              )}
            </div>
          ))}

          {user ? (
            <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-3">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 max-w-[120px] truncate">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-xl px-2.5 py-1 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-3">
              <Link
                to="/login"
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button & notification badge */}
        <div className="flex items-center gap-2 lg:hidden">
          {user && unread > 0 && (
            <Link
              to="/notifications"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700 relative ring-1 ring-brand-200"
              aria-label="Notifications"
            >
              <span className="text-sm">🔔</span>
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            </Link>
          )}

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 lg:hidden animate-slide-up shadow-lg">
          <div className="flex flex-col gap-1">
            {user ? (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 border-b border-gray-100 mb-1">
                  Signed in as <strong className="text-gray-700">{user.name}</strong> ({isDonor ? 'Donor' : 'Receiver'})
                </div>
                {links.map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                    <NavItem to={l.to} label={l.label} unread={l.unread} />
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="rounded-xl px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 mt-1"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                {links.map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                    <NavItem to={l.to} label={l.label} />
                  </Link>
                ))}
                <div className="mt-2 flex flex-col gap-1.5 border-t border-gray-100 pt-2">
                  <Link to="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100">
                    Log in
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="rounded-xl bg-brand-600 px-3 py-2 text-center text-xs font-bold text-white">
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}