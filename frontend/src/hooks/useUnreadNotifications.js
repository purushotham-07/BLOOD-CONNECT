import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/** Poll the unread notification count for the current user. */
export function useUnreadNotifications(intervalMs = 15000) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return undefined;
    }
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        if (!cancelled) setCount(res.data.data.count);
      } catch {
        /* ignore transient polling errors */
      }
    };

    fetchCount();
    const id = setInterval(fetchCount, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user, intervalMs]);

  return { unread: count, setUnread: setCount };
}