import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, type LoginCredentials, type User } from '../services/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data);
      try {
        await authService.getCsrfToken();
      } catch (e) {
        console.error('[Auth] getCsrfToken after getMe failed', e);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    authService
      .getMe()
      .then(async (response) => {
        if (!mounted) return;
        setUser(response.data);
        try {
          await authService.getCsrfToken();
        } catch (e) {
          console.error('[Auth] getCsrfToken after getMe failed', e);
        }
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        await authService.getCsrfToken();
      } catch (e) {
        console.error('[Auth] getCsrfToken before login failed', e);
      }
      const response = await authService.login(credentials);
      setUser(response.data);
      try {
        await authService.getCsrfToken();
      } catch (e) {
        console.error('[Auth] getCsrfToken after login failed', e);
      }
      navigate('/dashboard');
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'ADMIN' || user?.is_superuser === true,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

// eslint-disable-next-line react-refresh/only-export-components -- useAuth exported next to AuthProvider (context pattern)
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
