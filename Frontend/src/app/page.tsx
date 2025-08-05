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
          A next-generation security framework for robust asset protection and
          threat intelligence.
        </p>
        <div className="mt-8 space-x-4">
          <Link
            href="/Auth/Login"
            className="px-8 py-3 bg-green-500 text-black font-bold rounded-md hover:bg-green-400 transition-all duration-300"
          >
            Operator Login
          </Link>
          <Link
            href="/Auth/register"
            className="px-8 py-3 border border-green-500 text-green-400 font-bold rounded-md hover:bg-green-500 hover:text-black transition-all duration-300"
          >
            Register
          </Link>
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