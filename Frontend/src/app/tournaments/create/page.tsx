'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tournamentApi, type CreateTournamentRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import MatrixBackground from '@/components/MatrixBackground';
import Header from '@/components/Header';
import { 
  TrophyIcon, 
  CalendarDaysIcon, 
  CurrencyDollarIcon,
  UsersIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

const tournamentSchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().optional(),
  game: z.string().min(1, 'Game is required').max(50, 'Game name too long'),
  format: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'swiss']),
  max_teams: z.number().min(2, 'At least 2 teams required').max(256, 'Maximum 256 teams allowed'),
  entry_fee: z.number().min(0, 'Entry fee cannot be negative').optional(),
  prize_pool: z.number().min(0, 'Prize pool cannot be negative').optional(),
  start_date: z.string().min(1, 'Start date is required'),
  registration_deadline: z.string().min(1, 'Registration deadline is required'),
  rules: z.string().optional(),
});

type TournamentForm = z.infer<typeof tournamentSchema>;

export default function CreateTournamentPage() {
  const { user, isAuthenticated, isAdmin, isOrganizer } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Helper function to safely render error messages
  const renderError = (error: any) => {
    if (!error) return null;
    
    // If it's a string, return it directly
    if (typeof error.message === 'string') {
      return error.message;
    }
    
    // If it's an object, try to extract a meaningful message
    if (typeof error === 'object') {
      return error.message || error.msg || 'Invalid input';
    }
    
    return 'Invalid input';
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TournamentForm>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      format: 'single_elimination',
      max_teams: 16,
      entry_fee: 0,
      prize_pool: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTournamentRequest) => tournamentApi.create(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        toast.success(`Tournament '${response.data.name}' created successfully!`);
        queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        // Redirect to tournaments list page since tournament detail page doesn't exist
        router.push('/tournaments');
      } else {
        toast.error(response.error || 'Failed to create tournament');
      }
    },
    onError: (error) => {
      toast.error('Failed to create tournament');
      console.error('Tournament creation error:', error);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <h1 className="text-2xl text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You need to be logged in to create tournaments</p>
          <Link href="/auth/login" className="text-green-400 hover:text-green-300">
            Login →
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isOrganizer) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <h1 className="text-2xl text-red-400 mb-4">Permission Denied</h1>
          <p className="text-gray-400 mb-6">Only organizers and admins can create tournaments</p>
          <Link href="/dashboard" className="text-green-400 hover:text-green-300">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = (data: TournamentForm) => {
    // Validate dates
    const startDate = new Date(data.start_date);
    const regDeadline = new Date(data.registration_deadline);
    const now = new Date();

    if (regDeadline <= now) {
      toast.error('Registration deadline must be in the future');
      return;
    }

    if (startDate <= regDeadline) {
      toast.error('Start date must be after registration deadline');
      return;
    }

    const tournamentData: CreateTournamentRequest = {
      ...data,
      entry_fee: data.entry_fee || undefined,
      prize_pool: data.prize_pool || undefined,
    };

    createMutation.mutate(tournamentData);
  };

  const formatOptions = [
    { value: 'single_elimination', label: 'Single Elimination', description: 'One loss eliminates a team' },
    { value: 'double_elimination', label: 'Double Elimination', description: 'Teams get a second chance in loser\'s bracket' },
    { value: 'round_robin', label: 'Round Robin', description: 'Every team plays every other team' },
    { value: 'swiss', label: 'Swiss System', description: 'Teams play a set number of rounds' },
  ];

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
              Create Tournament
            </h1>
            <p className="text-gray-400">
              Set up a new esports tournament with blockchain-verified fairness
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-green-400 mb-6 flex items-center">
              <TrophyIcon className="w-6 h-6 mr-2" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-green-300/80 mb-2">
                  Tournament Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Epic Gaming Championship 2024"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{renderError(errors.name)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-green-300/80 mb-2">
                  Game *
                </label>
                <input
                  {...register('game')}
                  type="text"
                  placeholder="Select or type game name"
                  list="games"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                />
                <datalist id="games">
                  {popularGames.map(game => (
                    <option key={game} value={game} />
                  ))}
                </datalist>
                {errors.game && (
                  <p className="text-red-400 text-sm mt-1">{renderError(errors.game)}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-green-300/80 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Describe your tournament, its goals, and what makes it special..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors resize-vertical"
              />
            </div>
          </div>

          <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-green-400 mb-6 flex items-center">
              <UsersIcon className="w-6 h-6 mr-2" />
              Tournament Format
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-green-300/80 mb-2">
                  Format *
                </label>
                <select
                  {...register('format')}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400 transition-colors"
                >
                  {formatOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.format && (
                  <p className="text-red-400 text-sm mt-1">{renderError(errors.format)}</p>
                )}
                <p className="text-gray-400 text-sm mt-2">
                  {formatOptions.find(f => f.value === watch('format'))?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-300/80 mb-2">
                  Maximum Teams *
                </label>
                <input
                  {...register('max_teams', { valueAsNumber: true })}
                  type="number"
                  min="2"
                  max="256"
                  step="1"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400 transition-colors"
                />
                {errors.max_teams && (
                  <p className="text-red-400 text-sm mt-1">{renderError(errors.max_teams)}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  Recommended: 8, 16, 32, or 64 teams
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-green-400 mb-6 flex items-center">
              <CalendarDaysIcon className="w-6 h-6 mr-2" />
              Schedule & Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-green-300/80 mb-2">
                  Registration Deadline *
                </label>
                <input
                  {...register('registration_deadline')}
                  type="datetime-local"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400 transition-colors"
                />
                {errors.registration_deadline && (
                  <p className="text-red-400 text-sm mt-1">{renderError(errors.registration_deadline)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-green-300/80 mb-2">
                  Tournament Start Date *
                </label>
                <input
                  {...register('start_date')}
                  type="datetime-local"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400 transition-colors"
                />
                {errors.start_date && (
                  <p className="text-red-400 text-sm mt-1">{renderError(errors.start_date)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-green-300/80 mb-2 flex items-center">
                  <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                  Entry Fee (USD)
                </label>
                <input
                  {...register('entry_fee', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                />
                {errors.entry_fee && (
                  <p className="text-red-400 text-sm mt-1">{renderError(errors.entry_fee)}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">Leave blank or 0 for free tournament</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-300/80 mb-2 flex items-center">
                  <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                  Prize Pool (USD)
                </label>
                <input
                  {...register('prize_pool', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                />
                {errors.prize_pool && (
                  <p className="text-red-400 text-sm mt-1">{renderError(errors.prize_pool)}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-green-400 mb-6 flex items-center">
              <DocumentTextIcon className="w-6 h-6 mr-2" />
              Rules & Guidelines
            </h2>

            <div>
              <label className="block text-sm font-medium text-green-300/80 mb-2">
                Tournament Rules
              </label>
              <textarea
                {...register('rules')}
                rows={6}
                placeholder="• All matches are best of 3&#10;• No cheating or exploiting&#10;• Teams must check in 15 minutes before match&#10;• Disputes will be handled by tournament staff&#10;• Prize distribution within 48 hours of completion"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors resize-vertical"
              />
              <p className="text-gray-400 text-sm mt-1">
                Be specific about match format, conduct expectations, and prize distribution
              </p>
            </div>
          </div>

          {/* Blockchain Notice */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-blue-400 font-medium mb-1">Blockchain Integration</h3>
                <p className="text-gray-300 text-sm">
                  Tournament brackets will be generated on the Polygon blockchain to ensure complete 
                  transparency and fairness. This process cannot be reversed once initiated.
                </p>
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
                  Creating Tournament...
                </div>
              ) : (
                'Create Tournament'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}