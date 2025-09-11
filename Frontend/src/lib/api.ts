import { endpoints } from './config';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'suspended';
}

export interface AuthResponse {
  user: User;
  token: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

// Generic API call function
async function apiCall<T>(
  url: string, 
  options: RequestInit = {},
  requireAuth = false
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if required
    if (requireAuth) {
      const token = localStorage.getItem('aegis_token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = response.ok ? await response.json() : null;
    const errorData = !response.ok ? await response.json().catch(() => ({})) : null;

    return {
      success: response.ok,
      data: data,
      error: errorData?.detail || errorData?.message || (!response.ok ? 'Request failed' : undefined),
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

// Authentication API calls
export const authApi = {
  login: (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => 
    apiCall<AuthResponse>(endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData: RegisterRequest): Promise<ApiResponse<User>> => 
    apiCall<User>(endpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify(userData),
    }, true), // Requires admin auth

  logout: (): Promise<ApiResponse> => 
    apiCall(endpoints.auth.logout, {
      method: 'POST',
    }, true),

  me: (): Promise<ApiResponse<User>> => 
    apiCall<User>(endpoints.auth.me, {}, true),

  getUsers: (skip = 0, limit = 100): Promise<ApiResponse<User[]>> => 
    apiCall<User[]>(`${endpoints.auth.users}?skip=${skip}&limit=${limit}`, {}, true),
};

// General API calls
export const generalApi = {
  health: (): Promise<ApiResponse> => 
    apiCall(endpoints.health),

  root: (): Promise<ApiResponse> => 
    apiCall(endpoints.root),

  protected: (): Promise<ApiResponse> => 
    apiCall(endpoints.protected, {}, true),
};

export default {
  auth: authApi,
  general: generalApi,
};