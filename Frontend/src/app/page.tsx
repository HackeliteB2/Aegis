'use client';

import MatrixBackground from '../components/MatrixBackground';
import Header from '../components/Header';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-mono">
      <MatrixBackground />
      <Header />

      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 flex-grow">
        <h1 className="text-5xl md:text-7xl font-bold text-green-400 tracking-wider drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
          AEGIS
        </h1>
        <p className="text-gray-400 mt-4 text-lg md:text-xl max-w-2xl">
          Provably fair esports tournaments with blockchain verification, AI-powered summaries, and real-time bracket updates.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-green-500 text-black font-bold rounded-md hover:bg-green-400 transition-all duration-300 text-center"
          >
            Tournament Login
          </Link>
          <Link
            href="/auth/register"
            className="px-8 py-3 border border-green-500 text-green-400 font-bold rounded-md hover:bg-green-500 hover:text-black transition-all duration-300 text-center"
          >
            Join Platform
          </Link>
          <Link
            href="/tournaments"
            className="px-8 py-3 border border-blue-500 text-blue-400 font-bold rounded-md hover:bg-blue-500 hover:text-black transition-all duration-300 text-center"
          >
            Browse Tournaments
          </Link>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-green-400 font-bold text-lg mb-3">🔗 Blockchain Verified</h3>
            <p className="text-gray-400 text-sm">
              Tournament draws generated on Polygon blockchain ensure complete transparency and fairness.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-green-400 font-bold text-lg mb-3">🤖 AI-Powered</h3>
            <p className="text-gray-400 text-sm">
              Automated match summaries and player insights powered by Google Gemini 2.0 Flash.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-green-400 font-bold text-lg mb-3">⚡ Real-time</h3>
            <p className="text-gray-400 text-sm">
              Live bracket updates and match results delivered instantly via WebSocket connections.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full py-6 text-center">
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} AEGIS Corporation. All rights reserved.
        </p>
      </footer>
    </div>
  );
}