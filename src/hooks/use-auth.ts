import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';

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
  email?: string;
  linkedDevices?: LinkedDevice[];
  [key: string]: any;
}

interface UseAuthReturn {
  isLoggedIn: boolean;
  isLoaded: boolean;
  currentUser: User | null;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

/**
 * Centralized authentication hook using Clerk.
 * Handles login state and logout.
 */
export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Build user object from Clerk user
  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      setCurrentUser({
        id: clerkUser.id,
        username: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.username || clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      });
    } else if (isLoaded && !isSignedIn) {
      setCurrentUser(null);
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  const logout = useCallback(async () => {
    await signOut();
    setCurrentUser(null);
    navigate('/sign-in');
  }, [signOut, navigate]);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.auth.me();
      if (data.user) {
        setCurrentUser((prev) => ({
          ...prev,
          ...data.user,
        }));
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh user', error);
      return null;
    }
  }, []);

  return {
    isLoggedIn: isSignedIn ?? false,
    isLoaded,
    currentUser,
    logout,
    refreshUser,
  };
}

/**
 * Check if user is authenticated (non-hook version)
 * Note: This is a simplified check, use useAuth hook for full functionality
 */
export function isAuthenticated(): boolean {
  // This is a simplified check - the actual auth state is managed by Clerk
  return document.cookie.includes('__clerk');
}
