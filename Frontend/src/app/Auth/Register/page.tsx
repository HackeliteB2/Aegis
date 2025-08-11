'use client';

import MatrixBackground from '../../../components/MatrixBackground';
import Link from 'next/link';
import { useState } from 'react';

export default function RegisterPage() {
    const [operatorId, setOperatorId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!operatorId.trim() || !email.trim() || !password || !confirm) {
            setError('All fields are required.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setLoading(true);
            // TODO: Replace with actual registration API call
            console.log('Registering:', { operatorId, email, password });
            // On success, redirect to login or dashboard
        } catch (err) {
            setError('Registration failed. Try again.');
        } finally {
            setLoading(false);
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
                    <p className="text-gray-400 mt-2 text-sm">Operator Registration Protocol</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6" noValidate>
                    <div>
                        <label
                            htmlFor="operatorId"
                            className="block text-sm font-medium text-green-300/80 mb-2"
                        >
                            Operator ID
                        </label>
                        <input
                            id="operatorId"
                            name="operatorId"
                            type="text"
                            autoComplete="username"
                            required
                            value={operatorId}
                            onChange={(e) => setOperatorId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-900/50 border border-green-500/40 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="operator-id"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-green-300/80 mb-2"
                        >
                            Contact Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-900/50 border border-green-500/40 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="operator@example.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-green-300/80 mb-2"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-900/50 border border-green-500/40 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="********"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="confirm"
                            className="block text-sm font-medium text-green-300/80 mb-2"
                        >
                            Confirm Password
                        </label>
                        <input
                            id="confirm"
                            name="confirm"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-900/50 border border-green-500/40 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="********"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link
                                href="/Auth/Login"
                                className="font-medium text-green-400 hover:text-green-300 transition-colors"
                            >
                                Already have access? Authenticate
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-gray-900 bg-green-500 hover:bg-green-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 transition-all duration-300 uppercase tracking-wider"
                        >
                            {loading ? 'Registering…' : 'Register'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-xs text-gray-500">
                    Unauthorized access is strictly prohibited. All activities are monitored.
                </p>
            </div>
        </div>
    );
}
