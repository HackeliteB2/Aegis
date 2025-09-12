'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { teamApi, type CreateTeamRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import MatrixBackground from '@/components/MatrixBackground';
import Header from '@/components/Header';
import { 
  UsersIcon, 
  TagIcon, 
  DocumentTextIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

const teamSchema = z.object({
  name: z.string().min(3, 'Team name must be at least 3 characters').max(50, 'Name too long'),
  tag: z.string().min(2, 'Team tag must be at least 2 characters').max(10, 'Tag too long'),
  description: z.string().optional(),
  preferred_games: z.string().optional(),
});

type TeamForm = z.infer<typeof teamSchema>;

export default function CreateTeamPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check if user is already a captain of a team
  const { data: allTeamsResponse, isLoading: isLoadingMyTeams } = useQuery({
    queryKey: ['all-teams'],
    queryFn: () => teamApi.list({ skip: 0, limit: 100 }),
    enabled: isAuthenticated,
  });

  const allTeams = allTeamsResponse?.data || [];
  const isCaptainOfTeam = allTeams.some(team => team.captain_id === user?.id);
  const captainedTeam = allTeams.find(team => team.captain_id === user?.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTeamRequest) => teamApi.create(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        toast.success(`Team '${response.data.name}' created successfully!`);
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        queryClient.invalidateQueries({ queryKey: ['all-teams'] });
        // Redirect to teams list page since team detail page doesn't exist
        router.push('/teams');
      } else {
        const errorMessage = response.error || 'Failed to create team. Please try again.';
        toast.error(errorMessage);
        console.error('Team creation failed:', response);
      }
    },
    onError: (error) => {
      console.error('Team creation error:', error);
      
      // Handle different types of errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Network error: Unable to connect to server. Please check your connection and try again.');
      } else if (error instanceof Error && error.message.includes('500')) {
        toast.error('Server error: There was an issue processing your request. The development team has been notified.');
      } else if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('An unexpected error occurred. Please try again or contact support if the issue persists.');
      }
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <h1 className="text-2xl text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You need to be logged in to create teams</p>
          <Link href="/auth/login" className="text-green-400 hover:text-green-300">
            Login →
          </Link>
        </div>
      </div>
    );
  }

  if (isLoadingMyTeams) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400">Checking your teams...</p>
        </div>
      </div>
    );
  }

  if (isCaptainOfTeam) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center max-w-md mx-4">
          <h1 className="text-2xl text-yellow-400 mb-4">Already a Team Captain</h1>
          <p className="text-gray-400 mb-6">
            You are already the captain of <strong className="text-green-400">{captainedTeam?.name}</strong>. 
            You can only captain one team at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={`/teams/${captainedTeam?.id}`}
              className="px-6 py-3 bg-green-500 text-black font-bold rounded-md hover:bg-green-400 transition-colors"
            >
              View My Team
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-gray-500 text-gray-400 font-bold rounded-md hover:bg-gray-500 hover:text-black transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = (data: TeamForm) => {
    const teamData: CreateTeamRequest = {
      ...data,
    };

    createMutation.mutate(teamData);
  };

  const popularGames = [
    'Valorant', 'Counter-Strike 2', 'League of Legends', 'Dota 2', 
    'Rocket League', 'Overwatch 2', 'Apex Legends', 'Fortnite'
  ];

  return (
    <div className="min-h-screen bg-black text-white font-mono relative">
      <MatrixBackground />
      <Header />
      
      <div className="relative z-10 container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-green-400 hover:text-green-300 transition-colors mb-6 group"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-400 tracking-wider mb-2">
              Create Team
            </h1>
            <p className="text-gray-400">
              Build your esports team and compete in tournaments
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-green-400 mb-6 flex items-center">
              <UsersIcon className="w-6 h-6 mr-2" />
              Team Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-green-300/80 mb-2">
                  Team Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Phoenix Warriors"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-green-300/80 mb-2">
                  Team Tag *
                </label>
                <input
                  {...register('tag')}
                  type="text"
                  placeholder="PHX"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                />
                {errors.tag && (
                  <p className="text-red-400 text-sm mt-1">{errors.tag.message}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  Short identifier for your team (2-10 characters)
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-green-300/80 mb-2">
                Team Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Tell everyone about your team, your goals, and what makes you unique..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors resize-vertical"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-green-300/80 mb-2">
                Preferred Games
              </label>
              <input
                {...register('preferred_games')}
                type="text"
                placeholder="Select or type games"
                list="games"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
              />
              <datalist id="games">
                {popularGames.map(game => (
                  <option key={game} value={game} />
                ))}
              </datalist>
              <p className="text-gray-400 text-sm mt-1">
                What games does your team focus on?
              </p>
            </div>
          </div>

          {/* Team Rules Notice */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <DocumentTextIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-blue-400 font-medium mb-1">Team Creation Guidelines</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• You will be automatically assigned as the team captain</li>
                  <li>• You can invite up to 5 members to join your team</li>
                  <li>• Team names and tags must be unique across the platform</li>
                  <li>• Keep team names and descriptions appropriate and respectful</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <Link
              href="/dashboard"
              className="flex-1 px-6 py-3 border border-gray-500 text-gray-400 font-bold rounded-md hover:bg-gray-500 hover:text-black transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-6 py-3 bg-green-500 text-black font-bold rounded-md hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Creating Team...
                </div>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}