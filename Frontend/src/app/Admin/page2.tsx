'use client';

import AdminHeader from '../../components/AdminHeader';
import MatrixBackground from '../../components/MatrixBackground';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-black text-white relative overflow-hidden font-mono">
        <MatrixBackground />
        <AdminHeader />
        
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Dashboard Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-green-400 tracking-wider mb-4">
                AEGIS COMMAND CENTER
              </h1>
              <p className="text-gray-400 text-lg">Administrative Control Interface</p>
            </div>

            {/* System Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* System Status */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-400">System Status</h3>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-2xl font-bold text-white">OPERATIONAL</p>
                <p className="text-sm text-gray-400 mt-2">All systems functional</p>
              </div>

              {/* Active Users */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-400">Active Users</h3>
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white">1</p>
                <p className="text-sm text-gray-400 mt-2">Currently connected</p>
              </div>

              {/* Security Alerts */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-400">Security Alerts</h3>
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-sm text-gray-400 mt-2">No active threats</p>
              </div>

              {/* System Uptime */}
              <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-400">Uptime</h3>
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-sm text-gray-400 mt-2">24/7 availability</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-400 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/Admin/Users" className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg p-4 text-left transition-all block">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">User Management</h3>
                  <p className="text-gray-400 text-sm">Create, modify, or deactivate user accounts</p>
                </Link>
                
                <Link href="/Admin/Security" className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg p-4 text-left transition-all block">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Security Audit</h3>
                  <p className="text-gray-400 text-sm">Review system logs and security events</p>
                </Link>
                
                <Link href="/Admin/Settings" className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg p-4 text-left transition-all block">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">System Config</h3>
                  <p className="text-gray-400 text-sm">Modify system settings and parameters</p>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-400 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <div>
                    <p className="text-white">System initialization completed</p>
                    <p className="text-gray-400 text-sm">Authentication system active</p>
                  </div>
                  <span className="text-green-400 text-sm">Just now</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <div>
                    <p className="text-white">Admin user session started</p>
                    <p className="text-gray-400 text-sm">Secure connection established</p>
                  </div>
                  <span className="text-green-400 text-sm">1 min ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Security protocols updated</p>
                    <p className="text-gray-400 text-sm">All systems secured</p>
                  </div>
                  <span className="text-green-400 text-sm">5 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
