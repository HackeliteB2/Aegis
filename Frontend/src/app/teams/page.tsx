'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { teamApi, type Team } from '@/lib/api';
import MatrixBackground from '@/components/MatrixBackground';
import Header from '@/components/Header';
import { 
  UsersIcon, 
  TrophyIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowLeftIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const TeamCard: React.FC<{ team: Team }> = ({ team }) => {
  return (
    <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm hover:border-green-400/50 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-green-400 group-hover:text-green-300 transition-colors">
            {team.name}
          </h3>
          {team.tag && (
            <span className="text-gray-400 text-sm">[{team.tag}]</span>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
          team.status === 'active' 
            ? 'text-green-400 bg-green-400/10 border-green-400/20'
            : 'text-gray-400 bg-gray-400/10 border-gray-400/20'
        }`}>
          {team.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-300 text-sm">
          <UsersIcon className="w-4 h-4 mr-2" />
          <span>Captain: {team.captain?.name || 'TBD'}</span>
        </div>
        
        <div className="flex items-center text-gray-300 text-sm">
          <TrophyIcon className="w-4 h-4 mr-2" />
          <span>Record: {team.wins}-{team.losses}-{team.draws}</span>
        </div>

        <div className="flex items-center text-gray-300 text-sm">
          <UsersIcon className="w-4 h-4 mr-2" />
          <span>Members: {team.members?.length || 0}</span>
        </div>
      </div>

      {team.description && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {team.description}
        </p>
      )}

      <div className="flex space-x-3">
        <Link
          href={`/teams/${team.id}`}
          className="flex-1 bg-green-500 text-black font-bold py-2 px-4 rounded-md hover:bg-green-400 transition-colors text-center flex items-center justify-center"
        >
          <EyeIcon className="w-4 h-4 mr-2" />
          View Team
        </Link>
      </div>
    </div>
  );
};

export default function TeamsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: teamsResponse, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamApi.list({ skip: 0, limit: 100 }),
  });

  const teams = teamsResponse?.data || [];

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (team.tag && team.tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    team.captain?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono relative">
      <MatrixBackground />
      <Header />
      
      <div className="relative z-10 container mx-auto px-4 py-8 pt-24">
        <div className="mb-12">
          <button
            onClick={() => router.back()}
            className="flex items-center text-green-400 hover:text-green-300 transition-colors mb-6 group"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-green-400 tracking-wider mb-4">
              Teams
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Discover esports teams and join the competition
            </p>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>

            {/* Create Team Button */}
            {isAuthenticated && (
              <Link
                href="/teams/create"
                className="flex items-center px-4 py-2 bg-green-500 text-black font-bold rounded-md hover:bg-green-400 transition-colors whitespace-nowrap"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Team
              </Link>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {filteredTeams.length} of {teams.length} teams
          </p>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <div className="text-center py-16">
            <UsersIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">No teams found</h3>
            <p className="text-gray-500 mb-6">
              {teams.length === 0 
                ? "Be the first to create a team!" 
                : "Try adjusting your search"
              }
            </p>
            {isAuthenticated && (
              <Link
                href="/teams/create"
                className="inline-flex items-center px-6 py-3 bg-green-500 text-black font-bold rounded-md hover:bg-green-400 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Team
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map(team => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-md p-4 text-red-300 text-center">
            Error loading teams. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}