'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  userName?: string;
  role?: string;
  initial?: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ userName, role, initial }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/Auth');
  };

  // Use auth context data if props are not provided
  const displayName = userName || user?.name || 'Admin User';
  const displayRole = role || user?.role || 'Administrator';
  const displayInitial = initial || displayName.charAt(0).toUpperCase();

  return (
    <div className="relative z-40 border-b border-green-500/30 bg-gray-900/50 backdrop-blur-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl sm:text-2xl font-bold text-green-400">Aegis</h1>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <h2 className="text-lg sm:text-xl text-white hidden sm:block">Admin Dashboard</h2>
          </div>

          {/* Profile and Logout Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{displayInitial}</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-white text-sm font-medium">{displayName}</div>
                <div className="text-gray-400 text-xs">{displayRole.toUpperCase()}</div>
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className="relative group z-50">
              <button className="text-gray-400 hover:text-green-400 transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Content */}
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-green-500/30 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
                <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-green-400 transition-colors">
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-green-400 transition-colors">
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Account Settings
                  </button>
                  <hr className="border-gray-700 my-1" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
