'use client';

import MatrixBackground from '../../../components/MatrixBackground';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { authApi, type RegisterRequest } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .refine((name) => {
      const words = name.trim().split(/\s+/);
      return words.every(word => word.length > 0 && word[0] === word[0].toUpperCase());
    }, 'Each word in the name must start with a capital letter'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string()
    .email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, router]);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    
    try {
      const registerData: RegisterRequest = {
        name: data.name.trim(),
        username: data.username.trim(),
        email: data.email.trim(),
        password: data.password,
        role: 'player'
      };

      const response = await authApi.register(registerData);
      
      if (response.success) {
        toast.success('Registration successful! Please log in.');
        router.push('/auth/login');
      } else {
        toast.error(response.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-mono">
      <MatrixBackground />

      <div className="relative z-10 w-full max-w-md mx-auto p-8 space-y-8 bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl shadow-2xl shadow-green-500/10">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-400 tracking-wider">
            AEGIS
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Create New Account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-green-300/80 mb-2"
            >
              Full Name *
            </label>
            <input
              id="name"
              {...register('name')}
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              className="w-full px-4 py-2 bg-gray-900/50 border border-green-500/40 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              Each word must start with a capital letter
            </p>
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-green-300/80 mb-2"
            >
              Username *
            </label>
            <input
              id="username"
              {...register('username')}
              type="text"
              autoComplete="username"
              placeholder="gamer_username"
              className="w-full px-4 py-2 bg-gray-900/50 border border-green-500/40 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              Letters, numbers, hyphens, and underscores only
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-green-300/80 mb-2"
            >
              Email Address *
            </label>
            <input
              id="email"
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="user@example.com"
              className="w-full px-4 py-2 bg-gray-900/50 border border-green-500/40 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-green-300/80 mb-2"
            >
              Password *
            </label>
            <input
              id="password"
              {...register('password')}
              type="password"
              autoComplete="new-password"
              placeholder="********"
              className="w-full px-4 py-2 bg-gray-900/50 border border-green-500/40 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              At least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-green-300/80 mb-2"
            >
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              {...register('confirmPassword')}
              type="password"
              autoComplete="new-password"
              placeholder="********"
              className="w-full px-4 py-2 bg-gray-900/50 border border-green-500/40 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-gray-900 bg-green-500 hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 transition-all duration-300 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-green-400 hover:text-green-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
}