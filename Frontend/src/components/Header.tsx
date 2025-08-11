'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { isAuthenticated, logout, isAdmin } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/Auth');
  };

  const handleDashboard = () => {
    if (isAdmin) {
      router.push('/Admin');
    } else {
      router.push('/Dashboard');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-green-400 tracking-wider">
          AEGIS
        </Link>
        <nav className="space-x-4">
          {isAuthenticated ? (
            <>
              <button
                onClick={handleDashboard}
                className="font-medium text-gray-300 hover:text-green-400 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="font-medium text-gray-300 hover:text-green-400 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/Auth/Login"
                className="font-medium text-gray-300 hover:text-green-400 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/Auth/register" // Assuming a registration page exists
                className="px-4 py-2 border border-green-500 rounded-md text-green-400 hover:bg-green-500 hover:text-black transition-all"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
