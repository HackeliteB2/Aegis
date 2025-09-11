'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { tournamentApi, type Tournament } from '@/lib/api';
import MatrixBackground from '@/components/MatrixBackground';
import Header from '@/components/Header';
import { 
  CalendarDaysIcon, 
  TrophyIcon, 
  UsersIcon, 
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon 
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const TournamentCard: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
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
  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'registration_open':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'registration_closed':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'in_progress':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'completed':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusText = (status: Tournament['status']) => {
    switch (status) {
      case 'registration_open':
        return 'Registration Open';
      case 'registration_closed':
        return 'Registration Closed';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Draft';
    }
  };

  return (
    <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm hover:border-green-400/50 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-green-400 group-hover:text-green-300 transition-colors">
          {tournament.name}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)}`}>
          {getStatusText(tournament.status)}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center text-gray-300 text-sm">
          <TrophyIcon className="w-4 h-4 mr-2" />
          <span className="capitalize">{tournament.game} • {tournament.format.replace('_', ' ')}</span>
        </div>
        
        <div className="flex items-center text-gray-300 text-sm">
          <UsersIcon className="w-4 h-4 mr-2" />
          <span>{tournament.teams_count}/{tournament.max_teams} Teams</span>
        </div>

        <div className="flex items-center text-gray-300 text-sm">
          <CalendarDaysIcon className="w-4 h-4 mr-2" />
          <span>Starts {formatSafeDate(tournament.start_date)}</span>
        </div>

        <div className="flex items-center text-gray-300 text-sm">
          <ClockIcon className="w-4 h-4 mr-2" />
          <span>Registration until {formatSafeDate(tournament.registration_deadline)}</span>
        </div>

        {tournament.prize_pool && (
          <div className="text-green-400 font-semibold">
            Prize Pool: ${tournament.prize_pool.toLocaleString()}
          </div>
        )}
      </div>

      {tournament.description && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {tournament.description}
        </p>
      )}

      <div className="flex space-x-3">
        <Link
          href={`/tournaments/${tournament.id}`}
          className="flex-1 bg-green-500 text-black font-bold py-2 px-4 rounded-md hover:bg-green-400 transition-colors text-center"
        >
          View Details
        </Link>
        {tournament.status === 'registration_open' && (
          <Link
            href={`/tournaments/${tournament.id}/register`}
            className="flex-1 border border-green-500 text-green-400 font-bold py-2 px-4 rounded-md hover:bg-green-500 hover:text-black transition-colors text-center"
          >
            Register
          </Link>
        )}
      </div>
    </div>
  );
};

export default function TournamentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<Tournament['status'] | 'all'>('all');
  const [filterGame, setFilterGame] = useState<string>('all');

  const { data: tournamentsResponse, isLoading, error } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentApi.list({ skip: 0, limit: 100 }),
  });

  const tournaments = tournamentsResponse?.data || [];

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tournament.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tournament.organizer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || tournament.status === filterStatus;
    const matchesGame = filterGame === 'all' || tournament.game.toLowerCase() === filterGame.toLowerCase();

    return matchesSearch && matchesStatus && matchesGame;
  });

  const games = Array.from(new Set(tournaments.map(t => t.game).filter(game => game && game.trim() !== '')));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono relative">
      <MatrixBackground />
      <Header />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-green-400 tracking-wider mb-4">
            Tournaments
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover and join esports tournaments with blockchain-verified fairness
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Tournament['status'] | 'all')}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400 transition-colors appearance-none"
              >
                <option key="all" value="all">All Statuses</option>
                <option key="registration_open" value="registration_open">Registration Open</option>
                <option key="registration_closed" value="registration_closed">Registration Closed</option>
                <option key="in_progress" value="in_progress">In Progress</option>
                <option key="completed" value="completed">Completed</option>
              </select>
            </div>

            {/* Game Filter */}
            <div>
              <select
                value={filterGame}
                onChange={(e) => setFilterGame(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400 transition-colors appearance-none"
              >
                <option key="all" value="all">All Games</option>
                {games.map((game, index) => (
                  <option key={`game-${game}-${index}`} value={game}>{game}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {filteredTournaments.length} of {tournaments.length} tournaments
          </p>
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-16">
            <TrophyIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">No tournaments found</h3>
            <p className="text-gray-500">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-md p-4 text-red-300 text-center">
            Error loading tournaments. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}