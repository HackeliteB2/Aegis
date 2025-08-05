'use client';

import MatrixBackground from '../../components/MatrixBackground';
import AdminHeader from '../../components/AdminHeader';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, trend, trendValue }) => {
  return (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 sm:p-6 hover:border-green-400/50 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="text-green-400 group-hover:text-green-300 transition-colors">
          {icon}
        </div>
        {trend && trendValue && (
          <span className={`text-sm px-2 py-1 rounded ${
            trend === 'up' ? 'text-green-400 bg-green-400/10' :
            trend === 'down' ? 'text-red-400 bg-red-400/10' :
            'text-gray-400 bg-gray-400/10'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
          </span>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-white mb-2">{value}</div>
      <div className="text-green-300/80 text-sm">{title}</div>
      <div className="text-gray-400 text-xs mt-1">{subtitle}</div>
    </div>
  );
};

const AlertItem: React.FC<{ type: 'info' | 'warning' | 'error'; message: string; time: string }> = ({ type, message, time }) => {
  const typeStyles = {
    info: 'border-l-blue-400 bg-blue-400/10 text-blue-300',
    warning: 'border-l-yellow-400 bg-yellow-400/10 text-yellow-300',
    error: 'border-l-red-400 bg-red-400/10 text-red-300'
  };

  return (
    <div className={`border-l-4 p-3 mb-2 rounded-r ${typeStyles[type]}`}>
      <div className="text-sm font-medium">{message}</div>
      <div className="text-xs opacity-70 mt-1">{time}</div>
    </div>
  );
};

export default function AdminPage() {
  const stats = [
    {
      title: 'Active Players',
      value: '2,847',
      subtitle: 'in last 24 hours',
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      trend: 'up' as const,
      trendValue: '+12%'
    },
    {
      title: 'Active Live Competitions',
      value: '156',
      subtitle: 'in last 24 hours',
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 002.5-2.5V6a2.5 2.5 0 00-2.5-2.5H9V10z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2v2m0-2h2m-2 0H8" />
        </svg>
      ),
      trend: 'up' as const,
      trendValue: '+8%'
    },
    {
      title: 'Active Competitions',
      value: '1,023',
      subtitle: 'in last 24 hours',
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      trend: 'neutral' as const,
      trendValue: '+2%'
    }
  ];

  const alerts = [
    { type: 'warning' as const, message: 'High server load detected in EU-West', time: '2 minutes ago' },
    { type: 'info' as const, message: 'Scheduled maintenance in 2 hours', time: '15 minutes ago' },
    { type: 'error' as const, message: 'Payment gateway timeout issues', time: '1 hour ago' },
    { type: 'info' as const, message: 'New tournament registration opened', time: '2 hours ago' },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <MatrixBackground />

      {/* Header extracted to component */}
      <AdminHeader />

      {/* Main Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Statistics Chart Area */}
          <div className="xl:col-span-3">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 sm:p-6 h-80 sm:h-96">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                <h3 className="text-lg sm:text-xl font-semibold text-green-400">Analytics Overview</h3>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1 text-sm bg-green-600 text-white rounded">Players</button>
                  <button className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">Competitions</button>
                  <button className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">Revenue</button>
                </div>
              </div>
              
              {/* Placeholder for chart */}
              <div className="flex items-center justify-center h-48 sm:h-64 border-2 border-dashed border-green-500/30 rounded-lg">
                <div className="text-center">
                  <div className="text-green-400 mb-2">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm sm:text-base">Chart visualization would come here</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">Real-time analytics and trends</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="xl:col-span-1">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg h-80 sm:h-96 flex flex-col">
              <div className="flex items-center justify-between p-4 sm:p-6 pb-2">
                <h3 className="text-lg font-semibold text-green-400">Alerts</h3>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {alerts.filter(a => a.type === 'error').length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto px-2">
                <div className="space-y-1 pb-4">
                  {alerts.map((alert, index) => (
                    <AlertItem key={index} {...alert} />
                  ))}
                </div>
              </div>
              
              <div className="p-4 border-t border-green-500/20">
                <button className="w-full bg-gray-800 hover:bg-gray-700 text-green-300 py-2 rounded transition-colors text-sm">
                  View All Alerts
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8">
          <h3 className="text-lg sm:text-xl font-semibold text-green-400 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Manage Users now links to users page */}
            <Link href="/Admin/Users" className="bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 hover:border-green-400/50 hover:bg-gray-800/80 transition-all duration-300 group flex flex-col items-start">
              <div className="text-xl sm:text-2xl mb-2">👥</div>
              <div className="text-green-300 group-hover:text-green-200 transition-colors text-sm sm:text-base">Manage Users</div>
            </Link>
            <button className="bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 hover:border-green-400/50 hover:bg-gray-800/80 transition-all duration-300 group">
              <div className="text-xl sm:text-2xl mb-2">🎮</div>
              <div className="text-green-300 group-hover:text-green-200 transition-colors text-sm sm:text-base">Competitions Settings</div>
            </button>
            <button className="bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 hover:border-green-400/50 hover:bg-gray-800/80 transition-all duration-300 group">
              <div className="text-xl sm:text-2xl mb-2">🖥️</div>
              <div className="text-green-300 group-hover:text-green-200 transition-colors text-sm sm:text-base">Server Status</div>
            </button>
            <button className="bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 hover:border-green-400/50 hover:bg-gray-800/80 transition-all duration-300 group">
              <div className="text-xl sm:text-2xl mb-2">📊</div>
              <div className="text-green-300 group-hover:text-green-200 transition-colors text-sm sm:text-base">Reports</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
