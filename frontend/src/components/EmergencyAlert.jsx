import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToUser } from '../services/socket';
import { Button } from './ui';

export default function EmergencyAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToUser(user.id, (notification) => {
      if (notification?.type === 'NEW_MATCH' || notification?.type === 'RESPONSE_RECEIVED') {
        setAlert(notification);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  if (!alert) return null;

  const handleAction = () => {
    const reqId = alert.bloodRequestId;
    setAlert(null);
    if (reqId) {
      navigate(`/blood-requests/${reqId}`);
    }
  };

  const isMatch = alert.type === 'NEW_MATCH';

  return (
    <aside
      aria-label="Emergency blood notification"
      className="fixed bottom-5 right-5 z-50 max-w-sm rounded-3xl border-2 border-brand-600 bg-white p-5 shadow-2xl ring-4 ring-brand-100 animate-slide-up"
    >
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold ring-1 ring-brand-200">
          {isMatch ? '🚨' : '🎉'}
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-brand-700">
              {isMatch ? 'Emergency Blood Match' : 'Donor Response'}
            </span>
            <button
              onClick={() => setAlert(null)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs font-semibold text-gray-800 leading-snug">
            {alert.message || (isMatch ? 'A patient nearby urgently needs blood compatible with your profile.' : 'A donor responded to your request!')}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={handleAction}
              className="w-full text-xs font-bold py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm"
            >
              {isMatch ? 'View on Live Map 🩸' : 'View Request Details'}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
