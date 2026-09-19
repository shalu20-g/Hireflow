import { createContext } from 'react';

// Shared by AuthProvider (AuthContext.jsx) and the useAuth hook (useAuth.js).
// Kept in its own module so no file mixes components with other exports.
export const AuthContext = createContext(null);
