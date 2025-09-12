'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, type User } from '@/lib/api';


interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for stored authentication data on mount
    const storedToken = localStorage.getItem('aegis_token');
    const storedUser = localStorage.getItem('aegis_user');

    if (storedToken && storedUser) {
      try {
        // Check if token is expired before setting it
        if (isTokenExpired(storedToken)) {
          console.log('Stored token is expired, clearing storage');
          localStorage.removeItem('aegis_token');
          localStorage.removeItem('aegis_user');
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid with server
          verifyToken(storedToken).catch(() => {
            // Token is invalid, clear storage
            localStorage.removeItem('aegis_token');
            localStorage.removeItem('aegis_user');
            setToken(null);
            setUser(null);
          });
        }
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('aegis_token');
        localStorage.removeItem('aegis_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true; // If we can't parse it, consider it expired
    }
  };

  const verifyToken = async (authToken: string): Promise<boolean> => {
    try {
      // First check if token is expired
      if (isTokenExpired(authToken)) {
        console.log('Token is expired, clearing storage');
        throw new Error('Token is expired');
      }

      // Set token temporarily for the API call
      localStorage.setItem('aegis_token', authToken);
      
      const result = await authApi.me();
      
      if (result.success && result.data) {
        setUser(result.data);
        return true;
      } else {
        throw new Error('Token verification failed');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await authApi.login({ email: username, password });
      
      if (result.success && result.data) {
        const { user: userData, token: tokenData } = result.data;
        
        // Store authentication data
        localStorage.setItem('aegis_token', tokenData.access_token);
        localStorage.setItem('aegis_user', JSON.stringify(userData));
        
        setToken(tokenData.access_token);
        setUser(userData);
        
        return true;
      } else {
        console.error('Login failed:', result.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsLoggingOut(true);
    
    // Clear authentication data
    localStorage.removeItem('aegis_token');
    localStorage.removeItem('aegis_user');
    setToken(null);
    setUser(null);
    
    // Optional: Call logout endpoint
    if (token) {
      authApi.logout().catch(console.error);
    }
    
    // Redirect to login page
    router.push('/auth/login');
    
    // Reset logging out state after navigation
    setTimeout(() => setIsLoggingOut(false), 100);
  };

  const isAuthenticated = !!(user && token);
  const isAdmin = user?.role === 'admin';
  const isOrganizer = user?.role === 'organizer';

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isLoggingOut,
    isAuthenticated,
    isAdmin,
    isOrganizer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
