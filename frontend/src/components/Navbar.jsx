import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

const NavItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
        isActive
          ? 'bg-brand-50 text-brand-700 shadow-xs'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    {label}
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
      links.push({ to: '/donor-profile', label: 'Donor Profile & Location' });
      links.push({ to: '/blood-requests', label: 'Browse Requests' });
    } else {
      links.push({ to: '/dashboard', label: 'Dashboard' });
      links.push({ to: '/blood-requests', label: 'My Requests' });
      links.push({ to: '/create-request', label: '+ New Request' });
    }
    links.push({ to: '/notifications', label: 'Notifications' });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm ring-2 ring-brand-100">
            <svg
              width="20"
              height="20"
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
            <span className="text-lg font-black tracking-tight text-gray-900 leading-tight">BloodConnect</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Location Matching</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {user ? (
            <>
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

              <div className="ml-3 flex items-center gap-2 border-l border-gray-200 pl-3">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                  {user.name} ({isDonor ? 'Donor' : 'Receiver'})
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  Log out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
          className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 md:hidden"
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
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1.5">
            {user ? (
              <>
                <div className="px-3 py-1 text-xs font-semibold text-gray-400">
                  Signed in as {user.name} ({isDonor ? 'Donor' : 'Receiver'})
                </div>
                {links.map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                    <NavItem to={l.to} label={l.label} />
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="rounded-xl bg-brand-600 px-3 py-2 text-center text-sm font-bold text-white">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}