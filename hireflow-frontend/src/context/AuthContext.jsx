import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosInstance, { SESSION_KEY, readSession } from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readSession();
    if (session) {
      setToken(session.token);
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await axiosInstance.post('/api/auth/login', { email, password });
    const { token: nextToken, user: nextUser } = res.data || {};
    if (!nextToken || !nextUser) {
      throw new Error('Login did not return a valid session.');
    }
    // Persist token + user only. Never passwords.
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, role: user?.role || null, loading, login, logout }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return ctx;
}
