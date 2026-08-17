import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToUser } from '../services/socket';
import { Button } from './ui';

// Subtle audio chime using Web Audio API
function playAlertChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);

    // Haptic vibration on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

export default function EmergencyAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToUser(user.id, (notification) => {
      if (notification?.type === 'NEW_MATCH' || notification?.type === 'RESPONSE_RECEIVED') {
        playAlertChime();
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
      className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border-2 border-brand-600 bg-white p-4 shadow-2xl ring-4 ring-brand-100/60 animate-slide-up sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg font-bold ring-1 ring-brand-200">
          {isMatch ? '🚨' : '🎉'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 truncate">
              {isMatch ? 'Emergency Blood Match' : 'Donor Response'}
            </span>
            <button
              onClick={() => setAlert(null)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold px-1 py-0.5"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs font-semibold text-gray-800 leading-snug break-words">
            {alert.message || (isMatch ? 'A patient nearby urgently needs blood compatible with your profile.' : 'A donor responded to your request!')}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={handleAction}
              className="w-full text-xs font-bold py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs"
            >
              {isMatch ? 'View on Live Map 🩸' : 'View Request Details'}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
