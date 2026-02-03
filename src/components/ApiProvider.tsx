import { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setTokenGetter } from '@/lib/api';

interface ApiContextType {
  getToken: () => Promise<string | null>;
}

const ApiContext = createContext<ApiContextType | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the token getter for the API module
    // Use default template for now, will work with Clerk's default JWT
    setTokenGetter(() => getToken());
  }, [getToken]);

  return (
    <ApiContext.Provider value={{ getToken }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
