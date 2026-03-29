import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface AuthUser {
  name: string;
  email: string;
  token: string;
  role: 'user' | 'admin';
}

interface AuthContextValue {
  user: AuthUser | null;
  setAuthenticatedUser: (user: AuthUser) => void;
  clearAuth: () => void;
}

const STORAGE_KEY = 'focusspace_user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed?.token || !parsed?.email || !parsed?.name) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      name: parsed.name,
      email: parsed.email,
      token: parsed.token,
      role: parsed.role === 'admin' ? 'admin' : 'user',
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const setAuthenticatedUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, setAuthenticatedUser, clearAuth }),
    [clearAuth, setAuthenticatedUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
