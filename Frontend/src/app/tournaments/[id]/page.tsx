'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { tournamentApi, teamApi, matchApi, type Tournament, type Team, type Match } from '@/lib/api';
import MatrixBackground from '@/components/MatrixBackground';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { 
  CalendarDaysIcon, 
  TrophyIcon, 
  UsersIcon, 
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PlayIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

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

const TournamentBracket: React.FC<{ matches: Match[] }> = ({ matches }) => {
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));

  if (rounds.length === 0) {
    return (
      <div className="text-center py-8">
        <TrophyIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Bracket not generated yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {rounds.map(roundStr => {
        const round = parseInt(roundStr);
        const roundMatches = matchesByRound[round];
        
        return (
          <div key={round} className="space-y-4">
            <h3 className="text-xl font-bold text-green-400 text-center">
              Round {round}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roundMatches.map(match => (
                <div 
                  key={match.id} 
                  className="bg-gray-800/50 border border-gray-600 rounded-lg p-4"
                >
                  <div className="text-center mb-2">
                    <span className="text-gray-400 text-sm">Match {match.match_number}</span>
                    {match.scheduled_time && (
                      <div className="text-xs text-gray-500">
                        {formatSafeDate(match.scheduled_time, 'MMM dd, HH:mm')}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className={`flex justify-between items-center p-2 rounded ${
                      match.winner_id === match.team1_id ? 'bg-green-900/30 border border-green-500/30' : 'bg-gray-700/30'
                    }`}>
                      <span className="text-sm">
                        {match.team1?.name || 'TBD'}
                      </span>
                      <span className="font-bold">
                        {match.team1_score ?? '-'}
                      </span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-2 rounded ${
                      match.winner_id === match.team2_id ? 'bg-green-900/30 border border-green-500/30' : 'bg-gray-700/30'
                    }`}>
                      <span className="text-sm">
                        {match.team2?.name || 'TBD'}
                      </span>
                      <span className="font-bold">
                        {match.team2_score ?? '-'}
                      </span>
                    </div>
                  </div>

                  <div className="text-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      match.status === 'completed' ? 'bg-green-800 text-green-200' :
                      match.status === 'in_progress' ? 'bg-blue-800 text-blue-200' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {match.status.replace('_', ' ')}
                    </span>
                  </div>

                  {match.summary && (
                    <div className="mt-3 p-2 bg-gray-700/30 rounded text-xs text-gray-300">
                      {match.summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function TournamentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isOrganizer } = useAuth();
  const { joinTournament } = useWebSocket();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'bracket' | 'matches'>('overview');

  const tournamentId = params.id as string;

  const { data: tournamentResponse, isLoading: tournamentLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentApi.get(tournamentId),
    enabled: !!tournamentId,
  });

  const { data: teamsResponse } = useQuery({
    queryKey: ['tournament', tournamentId, 'teams'],
    queryFn: () => tournamentApi.getTeams(tournamentId),
    enabled: !!tournamentId,
  });

  const { data: matchesResponse } = useQuery({
    queryKey: ['tournament', tournamentId, 'matches'],
    queryFn: () => tournamentApi.getMatches(tournamentId),
    enabled: !!tournamentId,
  });

  const generateBracketMutation = useMutation({
    mutationFn: () => tournamentApi.generateDraw(tournamentId),
    onSuccess: () => {
      toast.success('Bracket generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId, 'matches'] });
    },
    onError: () => {
      toast.error('Failed to generate bracket');
    },
  });

  const tournament = tournamentResponse?.data;
  const teams = teamsResponse?.data || [];
  const matches = matchesResponse?.data || [];

  useEffect(() => {
    if (tournament && isAuthenticated) {
      joinTournament(parseInt(tournamentId));
    }
  }, [tournament, isAuthenticated, tournamentId, joinTournament]);

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <h1 className="text-2xl text-red-400 mb-4">Tournament not found</h1>
          <Link href="/tournaments" className="text-green-400 hover:text-green-300">
            ← Back to tournaments
          </Link>
        </div>
      </div>
    );
  }

  const canManage = isAuthenticated && (user?.id === tournament.organizer_id || user?.role === 'admin');
  const canGenerateBracket = canManage && tournament.status === 'registration_closed' && !tournament.bracket_generated;

  return (
    <div className="min-h-screen bg-black text-white font-mono relative">
      <MatrixBackground />
      <Header />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center text-gray-400 text-sm mb-4">
            <Link href="/tournaments" className="hover:text-green-400">Tournaments</Link>
            <ChevronRightIcon className="w-4 h-4 mx-2" />
            <span>{tournament.name}</span>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div>
              <h1 className="text-4xl font-bold text-green-400 mb-2">{tournament.name}</h1>
              <p className="text-gray-400 mb-4">{tournament.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <TrophyIcon className="w-4 h-4 mr-2" />
                  <span className="capitalize">{tournament.game} • {tournament.format.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center">
                  <UsersIcon className="w-4 h-4 mr-2" />
                  <span>{teams.length}/{tournament.max_teams} Teams</span>
                </div>
                <div className="flex items-center">
                  <CalendarDaysIcon className="w-4 h-4 mr-2" />
                  <span>Starts {formatSafeDate(tournament.start_date)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className={`px-4 py-2 rounded-full text-sm font-medium border ${
                tournament.status === 'registration_open' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                tournament.status === 'registration_closed' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                tournament.status === 'in_progress' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                tournament.status === 'completed' ? 'text-gray-400 bg-gray-400/10 border-gray-400/20' :
                'text-gray-400 bg-gray-400/10 border-gray-400/20'
              }`}>
                {tournament.status.replace('_', ' ').toUpperCase()}
              </div>

              {tournament.prize_pool && (
                <div className="flex items-center text-green-400 font-semibold">
                  <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                  ${tournament.prize_pool.toLocaleString()}
                </div>
              )}

              {canGenerateBracket && (
                <button
                  onClick={() => generateBracketMutation.mutate()}
                  disabled={generateBracketMutation.isPending}
                  className="flex items-center justify-center px-4 py-2 bg-green-500 text-black font-bold rounded-md hover:bg-green-400 transition-colors disabled:opacity-50"
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  {generateBracketMutation.isPending ? 'Generating...' : 'Generate Bracket'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900/80 border border-green-500/30 rounded-lg backdrop-blur-sm">
          <div className="flex overflow-x-auto border-b border-green-500/30">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'teams', label: `Teams (${teams.length})` },
              { id: 'bracket', label: 'Bracket' },
              { id: 'matches', label: `Matches (${matches.length})` },
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-3">Tournament Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Format:</span>
                        <span className="capitalize">{tournament.format.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Game:</span>
                        <span>{tournament.game}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Max Teams:</span>
                        <span>{tournament.max_teams}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Entry Fee:</span>
                        <span>{tournament.entry_fee ? `$${tournament.entry_fee}` : 'Free'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-3">Schedule</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Registration Deadline:</span>
                        <span>{formatSafeDate(tournament.registration_deadline)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Start Date:</span>
                        <span>{formatSafeDate(tournament.start_date)}</span>
                      </div>
                      {tournament.end_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">End Date:</span>
                          <span>{formatSafeDate(tournament.end_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-3">Organizer</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span>{tournament.organizer?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Username:</span>
                        <span>@{tournament.organizer?.username || 'unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {tournament.rules && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
                      <DocumentTextIcon className="w-5 h-5 mr-2" />
                      Rules
                    </h3>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">
                      {tournament.rules}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'teams' && (
              <div>
                {teams.length === 0 ? (
                  <div className="text-center py-8">
                    <UsersIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No teams registered yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map(team => (
                      <div key={team.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-green-400">{team.name}</h4>
                          {team.tag && (
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded">[{team.tag}]</span>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Captain:</span>
                            <span>{team.captain?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Members:</span>
                            <span>{team.members?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Record:</span>
                            <span>{team.wins || 0}-{team.losses || 0}-{team.draws || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bracket' && (
              <div>
                <TournamentBracket matches={matches} />
              </div>
            )}

            {activeTab === 'matches' && (
              <div>
                {matches.length === 0 ? (
                  <div className="text-center py-8">
                    <TrophyIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No matches scheduled yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map(match => (
                      <div key={match.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold">Match {match.match_number} - Round {match.round}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            match.status === 'completed' ? 'bg-green-800 text-green-200' :
                            match.status === 'in_progress' ? 'bg-blue-800 text-blue-200' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {match.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className={`text-center p-3 rounded ${
                            match.winner_id === match.team1_id ? 'bg-green-900/30 border border-green-500/30' : 'bg-gray-700/30'
                          }`}>
                            <div className="font-semibold">{match.team1?.name || 'TBD'}</div>
                            <div className="text-2xl font-bold">{match.team1_score ?? '-'}</div>
                          </div>
                          
                          <div className={`text-center p-3 rounded ${
                            match.winner_id === match.team2_id ? 'bg-green-900/30 border border-green-500/30' : 'bg-gray-700/30'
                          }`}>
                            <div className="font-semibold">{match.team2?.name || 'TBD'}</div>
                            <div className="text-2xl font-bold">{match.team2_score ?? '-'}</div>
                          </div>
                        </div>

                        {match.scheduled_time && (
                          <div className="text-sm text-gray-400 text-center mb-2">
                            Scheduled: {formatSafeDate(match.scheduled_time, 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}

                        {match.summary && (
                          <div className="mt-3 p-3 bg-gray-700/30 rounded text-sm text-gray-300">
                            <strong>Summary:</strong> {match.summary}
                          </div>
                        )}
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