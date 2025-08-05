'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import AdminHeader from '../../components/AdminHeader';
import MatrixBackground from '../../components/MatrixBackground';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';

// Mock data services (replace with real API calls)
type Alert = { id: string; title: string; time: string; severity: 'high'|'medium'|'low' };
const fetchDashboard = async () => {
  await new Promise(r => setTimeout(r, 300));
  return {
    activePlayers: 2847,
    liveCompetitions: 156,
    competitions: 1023,
    trends: { players: 0.12, competitions: 0.08, all: 0.02 },
    uptime: 99.9,
  };
};
const fetchAlerts = async (): Promise<Alert[]> => ([
  { id: '1', title: 'High server load detected in EU-West', time: '2 minutes ago', severity: 'high' },
  { id: '2', title: 'Scheduled maintenance in 2 hours', time: '15 minutes ago', severity: 'medium' },
  { id: '3', title: 'Payment gateway timeout issues', time: '1 hour ago', severity: 'medium' },
  { id: '4', title: 'New tournament registration opened', time: '1 hour ago', severity: 'low' },
]);

function StatCard({
  title,
  value,
  trend,
  icon,
}: {
  title: string;
  value: number | string;
  trend?: number;
  icon: React.ReactNode;
}) {
  const trendColor = trend && trend >= 0 ? 'text-green-400' : 'text-red-400';
  const trendPrefix = trend && trend >= 0 ? '+' : '';
  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-green-400">{title}</h3>
        <div className="w-6 h-6 text-green-400">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-white">{value}</p>
        {typeof trend === 'number' && (
          <span className={`text-sm ${trendColor}`}>{trendPrefix}{Math.round(trend * 100)}%</span>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchDashboard>> | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<'players'|'competitions'|'revenue'>('players');

  // simple “live” ticker for players (client-side only)
  const livePlayers = useMemo(() => {
    if (!stats) return 0;
    return stats.activePlayers;
  }, [stats]);

  // memoized loader to reuse for manual refresh and interval
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [d, a] = await Promise.all([fetchDashboard(), fetchAlerts()]);
      setStats(d);
      setAlerts(a);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    // initial load
    loadData();

    // refresh every 30s (adjust as needed)
    const iv = setInterval(() => {
      if (mounted) loadData();
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [loadData]);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-black text-white relative overflow-hidden font-mono">
        <MatrixBackground />
        <AdminHeader />

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h1 className="text-4xl font-bold text-green-400 tracking-wider mb-1">
                  AEGIS COMMAND CENTER
                </h1>
                <p className="text-gray-400 text-lg">Administrative Control Interface</p>
              </div>
              <button
                onClick={loadData}
                disabled={loading}
                className={`px-4 py-2 border border-green-500/50 rounded transition ${
                  loading ? 'bg-green-600/10 cursor-not-allowed opacity-70' : 'bg-green-600/20 hover:bg-green-600/30'
                }`}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-400">System Status</h3>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-2xl font-bold text-white">OPERATIONAL</p>
                <p className="text-sm text-gray-400 mt-2">All systems functional</p>
              </div>

              <StatCard
                title="Active Players"
                value={loading ? '...' : livePlayers.toLocaleString()}
                trend={stats?.trends.players}
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                }
              />

              <StatCard
                title="Active Live Competitions"
                value={loading ? '...' : stats?.liveCompetitions ?? 0}
                trend={stats?.trends.competitions}
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
              />

              <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-400">Uptime</h3>
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white">{loading ? '...' : `${stats?.uptime}%`}</p>
                <p className="text-sm text-gray-400 mt-2">24/7 availability</p>
              </div>
            </div>

            {/* Analytics + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-green-400">Analytics Overview</h2>
                  <div className="flex gap-2">
                    {(['players', 'competitions', 'revenue'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1 rounded text-sm transition border ${
                          activeTab === tab
                            ? 'bg-green-600/30 border-green-500 text-green-300'
                            : 'bg-transparent border-transparent hover:border-green-800 text-gray-300'
                        }`}
                      >
                        {tab[0].toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64 border border-dashed border-green-500/30 rounded grid place-items-center text-gray-400">
                  Chart visualization would come here ({activeTab})
                </div>
                <p className="text-xs text-gray-500 mt-2">Real-time analytics and trends</p>
              </div>

              <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-0 flex flex-col">
                <div className="px-6 py-4 border-b border-green-500/20 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-green-400">Alerts</h2>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs">
                    {alerts.length}
                  </span>
                </div>
                <div className="overflow-y-auto max-h-80 divide-y divide-gray-800">
                  {alerts.map(a => (
                    <div key={a.id} className={`px-6 py-4 hover:bg-white/5 transition`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className={`font-medium ${a.severity === 'high' ? 'text-yellow-300' : 'text-white'}`}>
                          {a.title}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{a.time}</span>
                      </div>
                    </div>
                  ))}
                  {!alerts.length && (
                    <div className="px-6 py-8 text-center text-gray-500">No alerts</div>
                  )}
                </div>
                <div className="px-6 py-3 border-t border-green-500/20">
                  <Link href="/Admin/Alerts" className="text-green-400 text-sm hover:underline">
                    View All Alerts
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-400 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/Admin/Users" className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg p-4 text-left transition-all block">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Manage Users</h3>
                  <p className="text-gray-400 text-sm">Create, modify, or deactivate user accounts</p>
                </Link>
                <Link href="/Admin/Competitions" className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg p-4 text-left transition-all block">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Competitions Settings</h3>
                  <p className="text-gray-400 text-sm">Configure tournaments and rules</p>
                </Link>
                <Link href="/Admin/Server" className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg p-4 text-left transition-all block">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Server Status</h3>
                  <p className="text-gray-400 text-sm">Health checks and nodes</p>
                </Link>
                <Link href="/Admin/Reports" className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg p-4 text-left transition-all block">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Reports</h3>
                  <p className="text-gray-400 text-sm">Download analytics and logs</p>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
