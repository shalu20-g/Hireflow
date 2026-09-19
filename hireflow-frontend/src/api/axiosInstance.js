import axios from 'axios';

export const SESSION_KEY = 'hireflow.session';

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token) return null;
    if (!parsed.user || typeof parsed.user !== 'object') return null;
    return { token: parsed.token, user: parsed.user };
  } catch {
    return null;
  }
}

// Exactly one configured Axios instance for all API calls.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const session = readSession();
  if (session) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

export default axiosInstance;
