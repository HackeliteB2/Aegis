'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import MatrixBackground from './MatrixBackground';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  redirectTo = '/Auth/Login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      if (requireAdmin && !isAdmin) {
        router.push('/unauthorized');
        return;
      }

      // Check if user is suspended
      if (user?.status === 'suspended') {
        router.push('/suspended');
        return;
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, requireAdmin, router, redirectTo, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-4">ACCESS DENIED</h1>
          <p className="text-gray-400">Insufficient privileges for this operation</p>
        </div>
      </div>
    );
  }

  if (user?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-4">ACCOUNT SUSPENDED</h1>
          <p className="text-gray-400">Your account has been suspended. Contact administrator.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
