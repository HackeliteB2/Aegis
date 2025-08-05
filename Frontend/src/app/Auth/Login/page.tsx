'use client';

import MatrixBackground from '../../../components/MatrixBackground';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      if (isAdmin) {
        router.push('/Admin');
      } else {
        router.push('/Dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        // AuthContext will handle redirection via useEffect
      } else {
        setError('Invalid credentials. Access denied.');
      }
    } catch (err) {
      setError('System error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-mono">
      <MatrixBackground />

      <div className="relative z-10 w-full max-w-md mx-auto p-8 space-y-8 bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl shadow-2xl shadow-green-500/10">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-400 tracking-wider">
            AEGIS
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Secure Access Protocol</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-md p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-green-300/80 mb-2"
            >
              Operator ID
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900/50 border border-green-500/40 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              placeholder="username"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-green-300/80 mb-2"
            >
              Access Key
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900/50 border border-green-500/40 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              placeholder="********"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 bg-gray-800 border-green-500/50 text-green-600 focus:ring-green-500 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-400"
              >
                Maintain Connection
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="#"
                className="font-medium text-green-400 hover:text-green-300 transition-colors"
              >
                Recovery Protocol
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-gray-900 bg-green-500 hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 transition-all duration-300 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                'Initialize Access'
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            Unauthorized access is strictly prohibited. All activities are monitored.
          </p>
          <p className="text-xs text-green-400/70">
            Default credentials: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
