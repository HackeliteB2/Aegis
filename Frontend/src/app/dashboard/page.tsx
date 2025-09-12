'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { tournamentApi, teamApi, matchApi } from '@/lib/api';
import MatrixBackground from '@/components/MatrixBackground';
import Header from '@/components/Header';
import { 
  TrophyIcon, 
  UsersIcon, 
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon,
  PlayIcon,
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';

const formatSafeDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'TBD';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'TBD';
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return 'TBD';
  }
};

const formatSafeDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return 'TBD';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'TBD';
    return format(date, 'MMM dd, HH:mm');
  } catch (error) {
    return 'TBD';
  }
};

export default function DashboardPage() {
  const { user, isAuthenticated, isAdmin, isOrganizer, isLoading, isLoggingOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tournaments' | 'teams' | 'matches'>('overview');
  const queryClient = useQueryClient();

  const { data: tournamentsResponse } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentApi.list({ skip: 0, limit: 10 }),
    enabled: isAuthenticated,
  });

  const { data: teamsResponse } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamApi.list({ skip: 0, limit: 10 }),
    enabled: isAuthenticated,
  });

  const { data: matchesResponse } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchApi.list({ skip: 0, limit: 10 }),
    enabled: isAuthenticated,
  });

  const tournaments = tournamentsResponse?.data || [];
  const teams = teamsResponse?.data || [];
  const matches = matchesResponse?.data || [];

  // Role upgrade mutation
  const becomeOrganizerMutation = useMutation({
    mutationFn: () => authApi.updateProfile({ role: 'organizer' }),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Congratulations! You are now a Tournament Organizer!');
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        // Force refresh the page to update context
        window.location.reload();
      } else {
        toast.error(response.error || 'Failed to upgrade role');
      }
    },
    onError: (error) => {
      toast.error('Failed to become organizer. Please try again.');
      console.error('Role upgrade error:', error);
    },
  });

  const handleBecomeOrganizer = () => {
    if (confirm('Are you sure you want to become a Tournament Organizer? You will be able to create and manage tournaments.')) {
      becomeOrganizerMutation.mutate();
    }
  };

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
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <h1 className="text-2xl text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You need to be logged in to access the dashboard</p>
          <Link href="/auth/login" className="text-green-400 hover:text-green-300">
            Login →
          </Link>
        </div>
      </div>
    );
  }

  const userTournaments = tournaments.filter(t => 
    t && (t.organizer_id === user?.id || isAdmin)
  );

  const activeTournaments = tournaments.filter(t => 
    t && t.status && ['registration_open', 'registration_closed', 'in_progress'].includes(t.status)
  );

  const upcomingMatches = matches.filter(m => {
    try {
      return m && m.status === 'pending' && m.scheduled_time && 
             !isNaN(new Date(m.scheduled_time).getTime()) &&
             new Date(m.scheduled_time) > new Date();
    } catch (error) {
      return false;
    }
  }).slice(0, 5);

  const recentMatches = matches.filter(m => 
    m && m.status === 'completed'
  ).slice(0, 5);

  const stats = {
    totalTournaments: tournaments.length,
    activeTournaments: activeTournaments.length,
    totalTeams: teams.length,
    totalMatches: matches.length,
    userTournaments: userTournaments.length,
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono relative">
      <MatrixBackground />
      <Header />
      
      <div className="relative z-10 container mx-auto px-4 py-8 pt-24">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-400">
            {user?.role === 'admin' ? 'System Administrator' :
             user?.role === 'organizer' ? 'Tournament Organizer' :
             user?.role === 'player' ? 'Player' : 'Spectator'} Dashboard
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tournaments</p>
                <p className="text-2xl font-bold text-green-400">{stats.totalTournaments}</p>
              </div>
              <TrophyIcon className="w-8 h-8 text-green-400/60" />
            </div>
          </div>

          <div className="bg-gray-900/80 border border-blue-500/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Tournaments</p>
                <p className="text-2xl font-bold text-blue-400">{stats.activeTournaments}</p>
              </div>
              <PlayIcon className="w-8 h-8 text-blue-400/60" />
            </div>
          </div>

          <div className="bg-gray-900/80 border border-purple-500/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Teams</p>
                <p className="text-2xl font-bold text-purple-400">{stats.totalTeams}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-purple-400/60" />
            </div>
          </div>

          <div className="bg-gray-900/80 border border-yellow-500/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Matches</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.totalMatches}</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-yellow-400/60" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm mb-8">
          <h2 className="text-xl font-bold text-green-400 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            {(isOrganizer || isAdmin) ? (
              <>
                <Link
                  href="/tournaments/create"
                  className="flex items-center px-4 py-2 bg-green-500 text-black font-bold rounded-md hover:bg-green-400 transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Tournament
                </Link>
                <Link
                  href="/teams/create"
                  className="flex items-center px-4 py-2 border border-green-500 text-green-400 font-bold rounded-md hover:bg-green-500 hover:text-black transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Team
                </Link>
                <Link
                  href="/tournaments"
                  className="flex items-center px-4 py-2 border border-blue-500 text-blue-400 font-bold rounded-md hover:bg-blue-500 hover:text-black transition-colors"
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Browse Tournaments
                </Link>
              </>
            ) : (
              <>
                {/* For players - show Become Organizer button */}
                {user?.role === 'player' && (
                  <button
                    onClick={handleBecomeOrganizer}
                    disabled={becomeOrganizerMutation.isPending}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-md hover:from-yellow-400 hover:to-yellow-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <StarIcon className="w-4 h-4 mr-2" />
                    {becomeOrganizerMutation.isPending ? 'Upgrading...' : 'Become Organizer'}
                  </button>
                )}
                <Link
                  href="/teams/create"
                  className="flex items-center px-4 py-2 border border-green-500 text-green-400 font-bold rounded-md hover:bg-green-500 hover:text-black transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Team
                </Link>
                <Link
                  href="/tournaments"
                  className="flex items-center px-4 py-2 border border-blue-500 text-blue-400 font-bold rounded-md hover:bg-blue-500 hover:text-black transition-colors"
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Browse Tournaments
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-gray-900/80 border border-green-500/30 rounded-lg backdrop-blur-sm">
          <div className="flex overflow-x-auto border-b border-green-500/30">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'tournaments', label: 'Tournaments' },
              { id: 'teams', label: 'Teams' },
              { id: 'matches', label: 'Matches' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-green-400 border-b-2 border-green-400 bg-green-400/5'
                    : 'text-gray-400 hover:text-green-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Upcoming Matches */}
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Upcoming Matches</h3>
                  {upcomingMatches.length === 0 ? (
                    <p className="text-gray-400">No upcoming matches</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingMatches.map(match => (
                        <div key={match.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">
                                {match.team1?.name || 'TBD'} vs {match.team2?.name || 'TBD'}
                              </p>
                              <p className="text-sm text-gray-400">
                                {match.tournament?.name || 'Tournament'} - Round {match.round}
                              </p>
                            </div>
                            <div className="text-right">
                              {match.scheduled_time && (
                                <p className="text-sm text-green-400">
                                  {formatSafeDateTime(match.scheduled_time)}
                                </p>
                              )}
                              <Link
                                href={`/tournaments/${match.tournament_id}`}
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                View Tournament →
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Results */}
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Recent Results</h3>
                  {recentMatches.length === 0 ? (
                    <p className="text-gray-400">No recent matches</p>
                  ) : (
                    <div className="space-y-3">
                      {recentMatches.map(match => (
                        <div key={match.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">
                                {match.team1?.name} {match.team1_score} - {match.team2_score} {match.team2?.name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {match.tournament?.name || 'Tournament'} - Round {match.round}
                              </p>
                              {match.summary && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {match.summary}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-green-400 font-medium">
                                Winner: {match.winner?.name || 'TBD'}
                              </span>
                              <Link
                                href={`/tournaments/${match.tournament_id}`}
                                className="block text-xs text-blue-400 hover:text-blue-300"
                              >
                                View Tournament →
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tournaments' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-green-400">Recent Tournaments</h3>
                  <Link
                    href="/tournaments"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View all →
                  </Link>
                </div>
                
                {tournaments.length === 0 ? (
                  <p className="text-gray-400">No tournaments found</p>
                ) : (
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
                        
                        <div className="space-y-1 text-sm mb-3">
                          <p className="text-gray-400">
                            {tournament.game || 'Game'} • {tournament.teams_count || 0}/{tournament.max_teams || 0} teams
                          </p>
                          <p className="text-gray-400">
                            Starts {formatSafeDate(tournament.start_date)}
                          </p>
                        </div>

                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View Details →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'teams' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-green-400">Teams</h3>
                  <Link
                    href="/teams"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View all →
                  </Link>
                </div>
                
                {teams.length === 0 ? (
                  <p className="text-gray-400">No teams found</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.slice(0, 6).map(team => (
                      <div key={team.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-green-400">{team.name}</h4>
                          {team.tag && (
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded">[{team.tag}]</span>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm mb-3">
                          <p className="text-gray-400">Captain: {team.captain?.name || 'TBD'}</p>
                          <p className="text-gray-400">Members: {team.members?.length || 0}</p>
                          <p className="text-gray-400">Record: {team.wins || 0}-{team.losses || 0}-{team.draws || 0}</p>
                        </div>

                        <Link
                          href={`/teams/${team.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View Team →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'matches' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-green-400">Recent Matches</h3>
                  <Link
                    href="/matches"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View all →
                  </Link>
                </div>
                
                {matches.length === 0 ? (
                  <p className="text-gray-400">No matches found</p>
                ) : (
                  <div className="space-y-3">
                    {matches.slice(0, 8).map(match => (
                      <div key={match.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {match.team1?.name || 'TBD'} vs {match.team2?.name || 'TBD'}
                            </p>
                            <p className="text-sm text-gray-400">
                              {match.tournament.name} - Round {match.round}
                            </p>
                          </div>
                          <div className="text-right">
                            {match.status === 'completed' ? (
                              <p className="text-green-400 font-medium">
                                {match.team1_score} - {match.team2_score}
                              </p>
                            ) : (
                              <span className={`text-xs px-2 py-1 rounded ${
                                match.status === 'in_progress' ? 'bg-blue-800 text-blue-200' :
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {match.status.replace('_', ' ')}
                              </span>
                            )}
                            <Link
                              href={`/tournaments/${match.tournament_id}`}
                              className="block text-xs text-blue-400 hover:text-blue-300 mt-1"
                            >
                              View Tournament →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}