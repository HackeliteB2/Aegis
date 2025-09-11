// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

export const config = {
  // API URLs
  apiBaseUrl: API_BASE_URL,
  apiVersion: API_VERSION,
  apiUrl: `${API_BASE_URL}/api/${API_VERSION}`,
  
  // App Configuration
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'AEGIS',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// API Endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: `${config.apiUrl}/auth/login`,
    logout: `${config.apiUrl}/auth/logout`,
    register: `${config.apiUrl}/auth/register`,
    me: `${config.apiUrl}/auth/me`,
    token: `${config.apiUrl}/auth/token`,
    users: `${config.apiUrl}/auth/users`,
  },
  
  // General
  root: `${config.apiUrl}/`,
  health: `${config.apiUrl}/health`,
  protected: `${config.apiUrl}/protected`,
};

export default config;