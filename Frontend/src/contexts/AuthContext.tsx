'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
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

  useEffect(() => {
    // Check for stored authentication data on mount
    const storedToken = localStorage.getItem('aegis_token');
    const storedUser = localStorage.getItem('aegis_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        verifyToken(storedToken).catch(() => {
          // Token is invalid, clear storage
          localStorage.removeItem('aegis_token');
          localStorage.removeItem('aegis_user');
          setToken(null);
          setUser(null);
        });
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('aegis_token');
        localStorage.removeItem('aegis_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const verifyToken = async (authToken: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
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
      
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const { user: userData, token: tokenData } = data;
        
        // Store authentication data
        localStorage.setItem('aegis_token', tokenData.access_token);
        localStorage.setItem('aegis_user', JSON.stringify(userData));
        
        setToken(tokenData.access_token);
        setUser(userData);
        
        return true;
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData.detail || 'Unknown error');
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
    // Clear authentication data
    localStorage.removeItem('aegis_token');
    localStorage.removeItem('aegis_user');
    setToken(null);
    setUser(null);
    
    // Optional: Call logout endpoint
    if (token) {
      fetch('http://localhost:8000/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(console.error);
    }
  };

  const isAuthenticated = !!(user && token);
  const isAdmin = user?.role === 'admin';

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
