import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { jwtDecode } from 'jwt-decode';
import { AuthContextType, LoginCredentials, User, DecodedToken } from '../types/auth.types';
import { authService } from '../services/api/authService';
import { storageService } from '../services/storage/storageService';
import { apiService } from '../services/api/apiClient';
import { DEFAULT_DEV_API_URL } from '../config/constants';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiUrl, setApiUrlState] = useState<string>(DEFAULT_DEV_API_URL || 'http://localhost:3000');

  useEffect(() => {
    bootstrapAuth();
  }, []);

  // Dedicated handler for session expiration / multiple-device login
  const handleSessionExpired = useCallback(async (customMessage?: string) => {
    // Clear credentials locally immediately
    apiService.setAuthToken(null);
    await storageService.clearAll();
    setToken(null);
    setUser(null);

    const title = 'Session Terminated';
    const message =
      customMessage?.includes('logged in elsewhere') || customMessage?.includes('Session expired')
        ? 'Your account was logged into from another device. You have been disconnected from this device.'
        : customMessage || 'Your session has expired. Please log in again.';

    Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
  }, []);

  // Wire up apiClient's 401 unauthorized interceptor
  useEffect(() => {
    apiService.setOnUnauthorized((errorMessage) => {
      handleSessionExpired(errorMessage);
    });

    return () => {
      apiService.setOnUnauthorized(null);
    };
  }, [handleSessionExpired]);

  // Check validity against backend (detects if user was logged in elsewhere)
  const verifyCurrentSession = useCallback(async (activeToken?: string | null, activeUser?: User | null) => {
    const t = activeToken || token;
    const u = activeUser || user;
    if (!t || !u?.id) return;

    try {
      await authService.getUserById(u.id, t);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Handled automatically by onUnauthorized interceptor
      }
    }
  }, [token, user]);

  // Periodic and foreground verification of active session
  useEffect(() => {
    if (!token || !user?.id) return;

    // 1. Check whenever the app comes back to the foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        verifyCurrentSession();
      }
    });

    // 2. Periodic background check every 30 seconds
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        verifyCurrentSession();
      }
    }, 30000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [token, user?.id, verifyCurrentSession]);

  const bootstrapAuth = async () => {
    try {
      setIsLoading(true);
      
      // Load saved API URL
      const savedApiUrl = await storageService.getApiUrl();
      if (savedApiUrl) {
        setApiUrlState(savedApiUrl);
        apiService.setBaseUrl(savedApiUrl);
      }

      // Check for saved token
      const savedToken = await storageService.getToken();
      if (savedToken) {
        try {
          const decoded = jwtDecode<DecodedToken>(savedToken);
          const isExpired = decoded.exp ? decoded.exp * 1000 <= Date.now() : false;

          if (!isExpired && decoded.userId) {
            setToken(savedToken);
            apiService.setAuthToken(savedToken);
            
            // Try loading cached user
            const cachedUser = await storageService.getUser();
            if (cachedUser) {
              setUser(cachedUser);
            }

            try {
              const freshUser = await authService.getUserById(decoded.userId, savedToken);
              setUser(freshUser);
              await storageService.setUser(freshUser);
            } catch (e: any) {
              // If backend rejects this token (e.g. logged in on another device while app was closed)
              if (e.response?.status === 401) {
                console.warn('Saved session is no longer valid on server (logged in elsewhere)');
                apiService.setAuthToken(null);
                await storageService.clearAll();
                setToken(null);
                setUser(null);
                handleSessionExpired('Your account was logged into from another device.');
                return;
              }
              console.warn('Could not refresh user profile on bootstrap:', e);
            }
          } else {
            apiService.setAuthToken(null);
            await storageService.clearAll();
          }
        } catch (decodeErr) {
          console.error('Invalid token format:', decodeErr);
          apiService.setAuthToken(null);
          await storageService.clearAll();
        }
      }
    } catch (e) {
      console.error('Error during auth bootstrapping:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      const jwtToken = response.token;

      if (!jwtToken) {
        throw new Error('No token returned from server');
      }

      const decoded = jwtDecode<DecodedToken>(jwtToken);
      const userId = decoded.userId;

      if (!userId) {
        throw new Error('Invalid token payload: missing userId');
      }

      // Immediately set in-memory and persistent token
      apiService.setAuthToken(jwtToken);
      await storageService.setToken(jwtToken);
      setToken(jwtToken);

      // Fetch user profile
      try {
        const userData = await authService.getUserById(userId, jwtToken);
        setUser(userData);
        await storageService.setUser(userData);
      } catch (err) {
        console.warn('Could not fetch user details after login:', err);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMsg = 'An unexpected error occurred. Please check your network connection.';

      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = error.response.data?.message || 'Invalid email or password.';
        } else if (error.response.status === 404) {
          errorMsg = 'User not found.';
        } else if (error.response.data?.message) {
          errorMsg = Array.isArray(error.response.data.message)
            ? error.response.data.message.join(', ')
            : error.response.data.message;
        }
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
        errorMsg = `Cannot connect to server at ${apiUrl}. Please verify the backend is running and reachable.`;
      }

      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      apiService.setAuthToken(null);
      await storageService.clearAll();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const setApiUrl = async (newUrl: string) => {
    const formatted = newUrl.trim().replace(/\/$/, '');
    setApiUrlState(formatted);
    apiService.setBaseUrl(formatted);
    await storageService.setApiUrl(formatted);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        login,
        logout,
        apiUrl,
        setApiUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
