import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi';

const TOKEN_KEY = 'bloodconnect_token';
const USER_KEY = 'bloodconnect_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(Boolean(token)); // bootstrap /me until proven false

  const persistSession = useCallback((nextToken, nextUser) => {
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
    else localStorage.removeItem(TOKEN_KEY);
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(USER_KEY);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  // On first load, refresh the session from the server (keeps role fresh).
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    authApi
      .me()
      .then((res) => {
        if (active) {
          setUser(res.data.data);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.data));
        }
      })
      .catch(() => {
        if (active) persistSession(null, null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, persistSession]);

  const login = useCallback(
    async (credentials) => {
      const res = await authApi.login(credentials);
      persistSession(res.data.data.token, res.data.data.user);
      return res.data.data;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      const res = await authApi.register(payload);
      persistSession(res.data.data.token, res.data.data.user);
      return res.data.data;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    persistSession(null, null);
  }, [persistSession]);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    const res = await authApi.me();
    setUser(res.data.data);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.data));
    return res.data.data;
  }, [token]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshUser }),
    [user, token, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}