import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, getStoredPrefs } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('knowledgeai_user');
    const token  = localStorage.getItem('knowledgeai_token');
    if (!token) {
      setLoading(false);
      return;
    }

    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.clear(); }
    }

    authAPI.me()
      .then(({ user: freshUser }) => {
        const mergedUser = {
          ...freshUser,
          preferences: freshUser.preferences || getStoredPrefs(),
        };
        localStorage.setItem('knowledgeai_user', JSON.stringify(mergedUser));
        setUser(mergedUser);
      })
      .catch(() => {
        localStorage.removeItem('knowledgeai_user');
        localStorage.removeItem('knowledgeai_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistUser = useCallback((nextUser) => {
    localStorage.setItem('knowledgeai_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: u, token } = await authAPI.login(email, password);
    localStorage.setItem('knowledgeai_token', token);
    const mergedUser = { ...u, preferences: u.preferences || getStoredPrefs() };
    persistUser(mergedUser);
    return mergedUser;
  }, [persistUser]);

  const register = useCallback(async (data) => {
    const { user: u, token } = await authAPI.register(data);
    localStorage.setItem('knowledgeai_token', token);
    const mergedUser = { ...u, preferences: u.preferences || getStoredPrefs() };
    persistUser(mergedUser);
    return mergedUser;
  }, [persistUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('knowledgeai_user');
    localStorage.removeItem('knowledgeai_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser) => {
    persistUser(nextUser);
  }, [persistUser]);

  const refreshUser = useCallback(async () => {
    const { user: freshUser } = await authAPI.me();
    const mergedUser = {
      ...freshUser,
      preferences: freshUser.preferences || getStoredPrefs(),
    };
    persistUser(mergedUser);
    return mergedUser;
  }, [persistUser]);

  const isAdmin   = user?.role === 'admin';
  const isMentor  = user?.role === 'mentor';
  const isTrainee = user?.role === 'trainee';
  const can = (roles) => roles.includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser, isAdmin, isMentor, isTrainee, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}