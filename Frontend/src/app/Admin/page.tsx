'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminHeader from '../../components/AdminHeader';
import MatrixBackground from '../../components/MatrixBackground';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, tournamentApi, teamApi, matchApi, generalApi } from '@/lib/api';
import { 
  UsersIcon, 
  TrophyIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ServerStackIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

const formatSafeDate = (dateString: string | null | undefined, formatStr: string = 'MMM dd, yyyy') => {
  if (!dateString) return 'TBD';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'TBD';
    return format(date, formatStr);
  } catch (error) {
    return 'TBD';
  }
};

export default function AdminDashboard() {
  const { user, isAdmin, isLoading, isLoggingOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tournaments' | 'teams' | 'system'>('overview');

  const { data: healthResponse } = useQuery({
    queryKey: ['health'],
    queryFn: () => generalApi.health(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => authApi.getUsers(0, 100),
    enabled: isAdmin,
    retry: 3,
  });

  const { data: tournamentsResponse } = useQuery({
    queryKey: ['admin-tournaments'],
    queryFn: () => tournamentApi.list({ skip: 0, limit: 100 }),
    enabled: isAdmin,
  });

  const { data: teamsResponse } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => teamApi.list({ skip: 0, limit: 100 }),
    enabled: isAdmin,
  });

  const { data: matchesResponse } = useQuery({
    queryKey: ['admin-matches'],
    queryFn: () => matchApi.list({ skip: 0, limit: 100 }),
    enabled: isAdmin,
  });

  const { data: servicesResponse } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => generalApi.getServicesStatus(),
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const { data: blockchainResponse } = useQuery({
    queryKey: ['admin-blockchain'],
    queryFn: () => generalApi.getBlockchainStatus(),
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  // Show loading during initial load or logout - prioritize logout state
  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400">Logging out...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show access denied if not loading and not logging out
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <h1 className="text-2xl text-red-400 mb-4">ACCESS DENIED</h1>
          <p className="text-gray-400">Administrator privileges required</p>
        </div>
      </div>
    );
  }

  const users = usersResponse?.data || [];
  const tournaments = tournamentsResponse?.data || [];
  const teams = teamsResponse?.data || [];
  const matches = matchesResponse?.data || [];
  const services = servicesResponse?.data;
  const blockchain = blockchainResponse?.data;

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    totalTournaments: tournaments.length,
    activeTournaments: tournaments.filter(t => 
      ['registration_open', 'registration_closed', 'in_progress'].includes(t.status)
    ).length,
    totalTeams: teams.length,
    totalMatches: matches.length,
    completedMatches: matches.filter(m => m.status === 'completed').length,
  };

  const systemHealth = healthResponse?.data?.status === 'ok';
  const recentActivity = [
    {
      timestamp: new Date(),
      type: 'success',
      message: 'Tournament bracket generated successfully',
      details: 'Championship Series #42'
    },
    {
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      type: 'info',
      message: 'New user registration',
      details: 'Player role assigned'
    },
    {
      timestamp: new Date(Date.now() - 32 * 60 * 1000),
      type: 'warning',
      message: 'High server load detected',
      details: 'Auto-scaling initiated'
    },
    {
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      type: 'success',
      message: 'Database optimization completed',
      details: 'Performance improved by 12%'
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative font-mono overflow-hidden">
      <MatrixBackground />
      <AdminHeader />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-green-400 tracking-wider drop-shadow-[0_0_10px_rgba(74,222,128,0.5)] mb-2">
            ADMIN CONTROL
          </h1>
          <p className="text-gray-400 text-lg">
            Tournament Management System Administration
          </p>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-green-400">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500">{stats.activeUsers} active</p>
              </div>
              <UsersIcon className="w-8 h-8 text-green-400/60" />
            </div>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Tournaments</p>
                <p className="text-2xl font-bold text-blue-400">{stats.totalTournaments}</p>
                <p className="text-xs text-gray-500">{stats.activeTournaments} active</p>
              </div>
              <TrophyIcon className="w-8 h-8 text-blue-400/60" />
            </div>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Teams</p>
                <p className="text-2xl font-bold text-purple-400">{stats.totalTeams}</p>
                <p className="text-xs text-gray-500">Registered</p>
              </div>
              <UsersIcon className="w-8 h-8 text-purple-400/60" />
            </div>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">System Health</p>
                <p className={`text-2xl font-bold ${systemHealth ? 'text-green-400' : 'text-red-400'}`}>
                  {systemHealth ? 'HEALTHY' : 'ERROR'}
                </p>
                <p className="text-xs text-gray-500">All services</p>
              </div>
              {systemHealth ? (
                <CheckCircleIcon className="w-8 h-8 text-green-400/60" />
              ) : (
                <ExclamationTriangleIcon className="w-8 h-8 text-red-400/60" />
              )}
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-gray-900/80 border border-green-500/30 rounded-lg backdrop-blur-sm">
          <div className="flex overflow-x-auto border-b border-green-500/30">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'users', label: 'Users', icon: UsersIcon },
              { id: 'tournaments', label: 'Tournaments', icon: TrophyIcon },
              { id: 'teams', label: 'Teams', icon: ShieldCheckIcon },
              { id: 'system', label: 'System', icon: ServerStackIcon },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-green-400 border-b-2 border-green-400 bg-green-400/5'
                      : 'text-gray-400 hover:text-green-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                      href="/tournaments/create"
                      className="flex items-center justify-center px-4 py-3 bg-green-500 text-black font-bold rounded-md hover:bg-green-400 transition-colors"
                    >
                      <TrophyIcon className="w-5 h-5 mr-2" />
                      Create Tournament
                    </Link>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="flex items-center justify-center px-4 py-3 border border-blue-500 text-blue-400 font-bold rounded-md hover:bg-blue-500 hover:text-black transition-colors"
                    >
                      <UsersIcon className="w-5 h-5 mr-2" />
                      Manage Users
                    </button>
                    <button
                      onClick={() => setActiveTab('system')}
                      className="flex items-center justify-center px-4 py-3 border border-yellow-500 text-yellow-400 font-bold rounded-md hover:bg-yellow-500 hover:text-black transition-colors"
                    >
                      <ShieldCheckIcon className="w-5 h-5 mr-2" />
                      System Diagnostics
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Recent System Activity</h3>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'success' ? 'bg-green-400' :
                            activity.type === 'warning' ? 'bg-yellow-400' :
                            activity.type === 'info' ? 'bg-blue-400' : 'bg-red-400'
                          }`} />
                          <div>
                            <p className="text-white font-medium">{activity.message}</p>
                            <p className="text-gray-400 text-sm">{activity.details}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">
                            {formatSafeDate(activity.timestamp.toISOString(), 'HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Platform Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{stats.completedMatches}</p>
                      <p className="text-gray-400 text-sm">Matches Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{stats.activeTournaments}</p>
                      <p className="text-gray-400 text-sm">Active Tournaments</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">{stats.activeUsers}</p>
                      <p className="text-gray-400 text-sm">Active Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">99.9%</p>
                      <p className="text-gray-400 text-sm">Uptime</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-green-400">User Management</h3>
                  <span className="text-gray-500 text-sm">
                    Total: {users.length} users
                  </span>
                </div>
                
                {isLoadingUsers ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mr-3"></div>
                    <span className="text-green-400">Loading users...</span>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No users found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map(user => (
                    <div key={user.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-green-400">{user.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          user.is_active ? 'bg-green-800 text-green-200' : 'bg-gray-700 text-gray-300'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-400">@{user.username}</p>
                        <p className="text-gray-400">{user.email}</p>
                        <p className={`capitalize ${
                          user.role === 'admin' ? 'text-red-400' :
                          user.role === 'organizer' ? 'text-blue-400' :
                          'text-gray-300'
                        }`}>
                          {user.role}
                        </p>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tournaments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-green-400">Tournament Overview</h3>
                  <Link
                    href="/tournaments"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View All Tournaments →
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournaments.slice(0, 6).map(tournament => (
                    <div key={tournament.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-green-400">{tournament.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          tournament.status === 'registration_open' ? 'bg-green-800 text-green-200' :
                          tournament.status === 'in_progress' ? 'bg-blue-800 text-blue-200' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {tournament.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-400">
                          {tournament.game} • {tournament.teams_count}/{tournament.max_teams} teams
                        </p>
                        <p className="text-gray-400">
                          Organizer: {tournament.organizer?.name || 'Unknown'}
                        </p>
                        <p className="text-gray-400">
                          Start: {formatSafeDate(tournament.start_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'teams' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-green-400">Teams Management</h3>
                  <Link
                    href="/teams"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View All Teams →
                  </Link>
                </div>
                
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Teams</p>
                        <p className="text-xl font-bold text-green-400">{teams.length}</p>
                      </div>
                      <UsersIcon className="w-6 h-6 text-green-400/60" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Active Teams</p>
                        <p className="text-xl font-bold text-blue-400">{teams.filter(t => t.status === 'active').length}</p>
                      </div>
                      <TrophyIcon className="w-6 h-6 text-blue-400/60" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Members</p>
                        <p className="text-xl font-bold text-purple-400">{teams.reduce((sum, team) => sum + (team.members?.length || 0), 0)}</p>
                      </div>
                      <UsersIcon className="w-6 h-6 text-purple-400/60" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Inactive Teams</p>
                        <p className="text-xl font-bold text-yellow-400">{teams.filter(t => t.status === 'inactive').length}</p>
                      </div>
                      <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400/60" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.slice(0, 12).map(team => (
                    <div key={team.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-400 mb-1">{team.name}</h4>
                          {team.tag && (
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded mr-2">[{team.tag}]</span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            team.status === 'active' 
                              ? 'bg-green-800 text-green-200' 
                              : 'bg-red-800 text-red-200'
                          }`}>
                            {team.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">ID:</span>
                          <span className="text-gray-300">{team.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Captain:</span>
                          <span className="text-gray-300">{team.captain_name || team.captain?.name || 'TBD'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Members:</span>
                          <span className="text-gray-300">{team.members?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Record:</span>
                          <span className="text-gray-300">{team.wins || 0}-{team.losses || 0}-{team.draws || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Created:</span>
                          <span className="text-gray-300">{formatSafeDate(team.created_at, 'MMM dd')}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2 text-xs">
                        <Link
                          href={`/teams/${team.id}`}
                          className="flex-1 text-center py-2 px-3 border border-blue-400/30 text-blue-400 rounded hover:bg-blue-400/10 transition-colors"
                        >
                          View Details
                        </Link>
                        {team.status === 'active' ? (
                          <button className="flex-1 py-2 px-3 border border-red-400/30 text-red-400 rounded hover:bg-red-400/10 transition-colors">
                            Suspend
                          </button>
                        ) : (
                          <button className="flex-1 py-2 px-3 border border-green-400/30 text-green-400 rounded hover:bg-green-400/10 transition-colors">
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4">System Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">API Status</span>
                        <span className={systemHealth ? "text-green-400" : "text-red-400"}>
                          {systemHealth ? "OPERATIONAL" : "ERROR"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">Database</span>
                        <span className={services?.database?.connected ? "text-green-400" : "text-red-400"}>
                          {services?.database?.connected ? "CONNECTED" : "DISCONNECTED"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">WebSocket</span>
                        <span className="text-green-400">ACTIVE</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Blockchain</span>
                        <span className={blockchain?.connected ? "text-green-400" : "text-yellow-400"}>
                          {blockchain?.connected ? 
                            `CONNECTED (${blockchain.network || `Chain ${blockchain.chain_id}`})` : 
                            blockchain?.enabled ? "DISCONNECTED" : "DISABLED"
                          }
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">AI Services</span>
                        <span className={services?.ai?.enabled ? "text-green-400" : "text-red-400"}>
                          {services?.ai?.enabled ? `ONLINE (${services.ai.provider})` : "OFFLINE"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">Email Service</span>
                        <span className={services?.email?.enabled ? "text-green-400" : "text-red-400"}>
                          {services?.email?.enabled ? `READY (${services.email.provider})` : "DISABLED"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">Blockchain</span>
                        <span className={services?.blockchain?.enabled ? "text-green-400" : "text-yellow-400"}>
                          {services?.blockchain?.enabled ? services.blockchain.status.toUpperCase() : "DISABLED"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Security</span>
                        <span className="text-green-400">MAXIMUM</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Server Information</h3>
                  <div className="bg-gray-800/50 rounded-lg p-4 font-mono text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-300">Backend API: <span className="text-green-400">localhost:8001</span></p>
                        <p className="text-gray-300">Database: <span className="text-green-400">PostgreSQL 17.5</span></p>
                        <p className="text-gray-300">Blockchain: <span className="text-green-400">Polygon Mainnet</span></p>
                      </div>
                      <div>
                        <p className="text-gray-300">AI Model: <span className="text-green-400">Gemini 2.0 Flash</span></p>
                        <p className="text-gray-300">Vector DB: <span className="text-green-400">ChromaDB</span></p>
                        <p className="text-gray-300">Email: <span className="text-green-400">SendGrid</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}