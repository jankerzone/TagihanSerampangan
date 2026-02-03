import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AUTH_KEYS = {
  isLoggedIn: 'isLoggedIn',
  currentUser: 'currentUser',
  token: 'token',
} as const;

interface User {
  id: string;
  username: string;
  [key: string]: any;
}

interface UseAuthReturn {
  isLoggedIn: boolean;
  token: string | null;
  currentUser: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  getToken: () => string | null;
}

/**
 * Centralized authentication hook.
 * Handles login state, token management, and logout.
 */
export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();

  const getToken = useCallback(() => {
    return localStorage.getItem(AUTH_KEYS.token);
  }, []);

  const getCurrentUser = useCallback((): User | null => {
    const userStr = localStorage.getItem(AUTH_KEYS.currentUser);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }, []);

  const isLoggedIn = localStorage.getItem(AUTH_KEYS.isLoggedIn) === 'true';
  const token = getToken();
  const currentUser = getCurrentUser();

  const login = useCallback((newToken: string, user: User) => {
    localStorage.setItem(AUTH_KEYS.isLoggedIn, 'true');
    localStorage.setItem(AUTH_KEYS.token, newToken);
    localStorage.setItem(AUTH_KEYS.currentUser, JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEYS.isLoggedIn);
    localStorage.removeItem(AUTH_KEYS.currentUser);
    localStorage.removeItem(AUTH_KEYS.token);
    navigate('/login');
  }, [navigate]);

  return {
    isLoggedIn,
    token,
    currentUser,
    login,
    logout,
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
