"use client"

import { useState } from "react"
import {
  Bell,
  Search,
  Settings,
  LogOut,
  Trophy,
  MessageSquare,
  BarChart3,
  Calendar,
  Target,
  Zap,
  Crown,
  ChevronDown,
} from "lucide-react"

export default function EsportsDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "tournaments", label: "My Tournaments", icon: Trophy },
    { id: "brackets", label: "Live Brackets", icon: Target },
    { id: "leaderboard", label: "Leaderboard", icon: Crown },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const upcomingMatches = [
    { opponent: "DragonSlayer99", game: "Valorant", time: "Today, 3:00 PM", rank: "Diamond" },
    { opponent: "ShadowNinja", game: "CS2", time: "Tomorrow, 7:30 PM", rank: "Global Elite" },
  ]

  const ongoingTournaments = [
    { name: "Summer Championship", game: "Valorant", status: "Quarterfinals", progress: "3/8", prize: "$5,000" },
    { name: "Weekly Clash", game: "CS2", status: "Round 2", progress: "12/16", prize: "$1,200" },
    { name: "Pro League", game: "Apex Legends", status: "Group Stage", progress: "24/32", prize: "$10,000" },
  ]

  const pastTournaments = [
    {
      name: "Spring Invitational",
      placement: "2nd Place",
      prize: "$2,500",
      narrative:
        "Incredible comeback in the finals! Your clutch plays in the last three rounds secured second place against tough competition.",
    },
    {
      name: "Midnight Masters",
      placement: "1st Place",
      prize: "$3,000",
      narrative:
        "Dominant performance throughout! Your strategic gameplay and consistent aim led to a flawless tournament victory.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-10">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Aegis</h1>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white hover:transform hover:scale-105"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <button className="w-full flex items-center justify-start gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Bar */}
        <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 p-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome Back, Dinushi! 🎮</h2>
              <p className="text-gray-400">Ready to dominate today's matches?</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tournaments..."
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 w-64 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Notification Bell */}
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200">
                <Bell className="w-5 h-5" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">DN</span>
                  </div>
                  <span className="font-medium">Dinushi</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-30">
                    <div className="py-1">
                      <button className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                        Profile
                      </button>
                      <button className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                        Settings
                      </button>
                      <button className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Top Row Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Upcoming Matches Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Upcoming Matches</h3>
              </div>
              <div className="space-y-4">
                {upcomingMatches.map((match, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-all duration-200"
                  >
                    <div>
                      <p className="text-white font-medium">vs {match.opponent}</p>
                      <p className="text-sm text-gray-400">
                        {match.game} • {match.rank}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-400 font-medium">{match.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Quick Stats</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                  <p className="text-3xl font-bold text-white">47</p>
                  <p className="text-sm text-gray-400">Matches Played</p>
                </div>
                <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                  <p className="text-3xl font-bold text-green-400">34</p>
                  <p className="text-sm text-gray-400">Wins</p>
                </div>
                <div className="text-center col-span-2 p-4 bg-gray-700/30 rounded-lg">
                  <p className="text-3xl font-bold text-blue-400">72%</p>
                  <p className="text-sm text-gray-400">Win Rate</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Quick Actions</h3>
              </div>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105">
                  Join Tournament
                </button>
                <button className="w-full border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105">
                  Create Tournament
                </button>
              </div>
            </div>
          </div>

          {/* Middle Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Ongoing Tournaments Table */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Ongoing Tournaments</h3>
              </div>
              <div className="space-y-4">
                {ongoingTournaments.map((tournament, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-all duration-200"
                  >
                    <div>
                      <p className="text-white font-medium">{tournament.name}</p>
                      <p className="text-sm text-gray-400">{tournament.game}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                        {tournament.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-400 font-medium">{tournament.prize}</p>
                      <p className="text-sm text-gray-400">{tournament.progress}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Tournaments with AI Narratives */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Past Tournaments</h3>
              </div>
              <div className="space-y-4">
                {pastTournaments.map((tournament, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{tournament.name}</p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          tournament.placement.includes("1st")
                            ? "bg-yellow-600/20 text-yellow-400"
                            : "bg-gray-600/20 text-gray-400"
                        }`}
                      >
                        {tournament.placement}
                      </span>
                    </div>
                    <p className="text-sm text-green-400 mb-2 font-medium">{tournament.prize}</p>
                    <p className="text-sm text-gray-300 italic leading-relaxed">{tournament.narrative}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
