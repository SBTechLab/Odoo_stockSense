import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMeApi, loginApi, registerApi, logoutApi } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMeApi();
      setUser(res.data.user);
      return res.data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials) => {
    const res = await loginApi(credentials);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (userData) => {
    const res = await registerApi(userData);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasRole = useCallback((...roles) => {
    if (!user) return false;
    const allowed = roles.flat();
    return allowed.includes(user.role);
  }, [user]);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
