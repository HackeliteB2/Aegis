'use client';

import MatrixBackground from '../components/MatrixBackground';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-mono">
      <MatrixBackground />
      <Header />

      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 flex-grow pt-20 pb-16">
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

        {/* Platform Statistics */}
        <div className="mt-16 max-w-6xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted by the Gaming Community</h2>
            <p className="text-gray-400 text-lg">Join thousands of tournaments already using AEGIS</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">1,500+</div>
              <div className="text-gray-400 text-sm">Tournaments Hosted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">25K+</div>
              <div className="text-gray-400 text-sm">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">500+</div>
              <div className="text-gray-400 text-sm">Teams Registered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">99.9%</div>
              <div className="text-gray-400 text-sm">Uptime Guaranteed</div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-16 max-w-6xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How AEGIS Works</h2>
            <p className="text-gray-400 text-lg">Experience tournament management like never before</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-3">Create Tournament</h3>
              <p className="text-gray-400 text-sm">
                Set up your tournament with custom rules, formats, and prize pools. Configure everything to match your vision.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-bold text-blue-400 mb-3">Blockchain Draw</h3>
              <p className="text-gray-400 text-sm">
                Generate provably fair tournament brackets using our Polygon blockchain integration for complete transparency.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold text-purple-400 mb-3">Live Updates</h3>
              <p className="text-gray-400 text-sm">
                Get real-time match results, AI-generated summaries, and instant bracket updates throughout the tournament.
              </p>
            </div>
          </div>
        </div>

        {/* Tournament Preview */}
        <div className="mt-16 max-w-6xl w-full">
          <div className="bg-gray-900/50 border border-green-500/30 rounded-xl p-8 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Experience Fair Play?</h2>
              <p className="text-gray-400 text-lg">Join the next generation of esports tournaments</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Blockchain-verified tournament draws</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">AI-powered match summaries</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">Real-time bracket updates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-300">Automated notifications</span>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-4">
                  <h3 className="text-green-400 font-bold text-lg mb-2">🏆 Featured Tournament</h3>
                  <p className="text-white font-medium mb-1">Spring Championship 2025</p>
                  <p className="text-gray-400 text-sm mb-2">32 Teams • $10,000 Prize Pool</p>
                  <p className="text-blue-400 text-sm">Registration Open</p>
                </div>
                <Link
                  href="/tournaments"
                  className="inline-block px-6 py-3 bg-green-500 text-black font-bold rounded-md hover:bg-green-400 transition-all duration-300"
                >
                  Browse All Tournaments
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-16 max-w-6xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Organizers Say</h2>
            <p className="text-gray-400 text-lg">Hear from tournament organizers using AEGIS</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-300 text-sm mb-4">
                "AEGIS completely transformed how we run tournaments. The blockchain verification gives participants confidence in fairness."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">SA</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Sarah Anderson</p>
                  <p className="text-gray-400 text-xs">Tournament Director, ESL</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900/50 border border-blue-500/30 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-300 text-sm mb-4">
                "The AI-generated match summaries save us hours of work and keep our audience engaged with exciting content."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">MR</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Marcus Rivera</p>
                  <p className="text-gray-400 text-xs">Community Manager, FaceIT</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900/50 border border-purple-500/30 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-300 text-sm mb-4">
                "Real-time updates and transparency have made our tournaments more professional and trustworthy."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">JL</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Jessica Liu</p>
                  <p className="text-gray-400 text-xs">Event Organizer, DreamHack</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}