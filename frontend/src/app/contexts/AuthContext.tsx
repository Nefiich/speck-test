"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { verifyAuth, logout as authLogout, logoutAll as authLogoutAll, User } from '../utils/auth';
import TokenManager from '../utils/tokenManager';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const userData = await verifyAuth();
      setUser(userData);
    } catch (error) {
      console.error('Auth refresh error:', error);
      setUser(null);
    }
  };

  const login = (tokens: { accessToken: string; refreshToken: string }) => {
    TokenManager.setTokens(tokens);
    refreshAuth();
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  const logoutAll = async () => {
    await authLogoutAll();
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await refreshAuth();
      setLoading(false);
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    logoutAll,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}