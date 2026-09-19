import { useCallback, useMemo, useState } from 'react';
import axiosInstance, { SESSION_KEY, readSession } from '../api/axiosInstance';
import { AuthContext } from './authContext';

function readStoredUser() {
  return readSession()?.user ?? null;
}

function readStoredToken() {
  return readSession()?.token ?? null;
}

export function AuthProvider({ children }) {
  // Session is restored synchronously during initialization, so the first
  // render already knows the auth state and no loading flash can occur.
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(readStoredToken);

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
    () => ({ user, token, role: user?.role || null, login, logout }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
