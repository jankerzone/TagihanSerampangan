import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

const AUTH_KEYS = {
  isLoggedIn: 'isLoggedIn',
  currentUser: 'currentUser',
  token: 'token',
} as const;

interface LinkedDevice {
  id: number;
  telegram_user_id: string;
  telegram_username?: string;
  first_name?: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  linkedDevices?: LinkedDevice[];
  [key: string]: any;
}

interface UseAuthReturn {
  isLoggedIn: boolean;
  token: string | null;
  currentUser: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<User | null>;
  getToken: () => string | null;
}

/**
 * Centralized authentication hook.
 * Handles login state, token management, and logout.
 */
export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem(AUTH_KEYS.isLoggedIn) === 'true');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const userStr = localStorage.getItem(AUTH_KEYS.currentUser);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  });

  const getToken = useCallback(() => {
    return localStorage.getItem(AUTH_KEYS.token);
  }, []);

  const login = useCallback((newToken: string, user: User) => {
    localStorage.setItem(AUTH_KEYS.isLoggedIn, 'true');
    localStorage.setItem(AUTH_KEYS.token, newToken);
    localStorage.setItem(AUTH_KEYS.currentUser, JSON.stringify(user));
    setIsLoggedIn(true);
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEYS.isLoggedIn);
    localStorage.removeItem(AUTH_KEYS.currentUser);
    localStorage.removeItem(AUTH_KEYS.token);
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate('/login');
  }, [navigate]);

  const updateUser = useCallback((user: User) => {
    localStorage.setItem(AUTH_KEYS.currentUser, JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.auth.me();
      if (data.user) {
        updateUser(data.user);
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh user', error);
      return null;
    }
  }, [updateUser]);

  return {
    isLoggedIn,
    token: getToken(),
    currentUser,
    login,
    logout,
    updateUser,
    refreshUser,
    getToken,
  };
}

/**
 * Get token without hooks (for API calls outside React components)
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_KEYS.token);
}

/**
 * Check if user is authenticated (non-hook version)
 */
export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEYS.isLoggedIn) === 'true';
}
