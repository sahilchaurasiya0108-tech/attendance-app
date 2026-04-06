import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { enablePushNotifications } from '../services/notifications';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('att_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount — also re-subscribe to push in case subscription expired
  useEffect(() => {
    const token = localStorage.getItem('att_token');
    if (!token) { setLoading(false); return; }

    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('att_user', JSON.stringify(data.user));
        // Re-subscribe if already granted (no prompt shown, silent re-register)
        if (Notification.permission === 'granted') {
          enablePushNotifications().catch(() => {});
        }
      })
      .catch(() => { localStorage.removeItem('att_token'); localStorage.removeItem('att_user'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('att_token', data.token);
    localStorage.setItem('att_user', JSON.stringify(data.user));
    setUser(data.user);
    // Trigger permission prompt right after login — must be called from user gesture context
    enablePushNotifications().catch(() => {});
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('att_token');
    localStorage.removeItem('att_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('att_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};