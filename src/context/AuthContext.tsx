import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
            } catch (e) {
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
