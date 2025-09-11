// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

export const config = {
  // API URLs
  apiBaseUrl: API_BASE_URL,
  apiVersion: API_VERSION,
  apiUrl: `${API_BASE_URL}/api/${API_VERSION}`,
  
  // App Configuration
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'AEGIS',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// API Endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: `${config.apiUrl}/auth/login`,
    logout: `${config.apiUrl}/auth/logout`,
    register: `${config.apiUrl}/auth/register`,
    me: `${config.apiUrl}/auth/me`,
    token: `${config.apiUrl}/auth/token`,
    users: `${config.apiUrl}/auth/users`,
    updateProfile: `${config.apiUrl}/auth/users/profile`,
    getUserById: (userId: string) => `${config.apiUrl}/auth/users/${userId}`,
    deleteUser: (userId: string) => `${config.apiUrl}/auth/users/${userId}`,
  },
  
  // Tournaments
  tournaments: {
    base: `${config.apiUrl}/tournaments`,
    create: `${config.apiUrl}/tournaments`,
    list: `${config.apiUrl}/tournaments`,
    details: (id: string) => `${config.apiUrl}/tournaments/${id}`,
    update: (id: string) => `${config.apiUrl}/tournaments/${id}`,
    delete: (id: string) => `${config.apiUrl}/tournaments/${id}`,
    register: (id: string) => `${config.apiUrl}/tournaments/${id}/register`,
    unregister: (id: string, teamId: string) => `${config.apiUrl}/tournaments/${id}/register/${teamId}`,
    generateDraw: (id: string) => `${config.apiUrl}/tournaments/${id}/generate-draw`,
    bracket: (id: string) => `${config.apiUrl}/tournaments/${id}/bracket`,
    teams: (id: string) => `${config.apiUrl}/tournaments/${id}/teams`,
    matches: (id: string) => `${config.apiUrl}/tournaments/${id}/matches`,
    start: (id: string) => `${config.apiUrl}/tournaments/${id}/start`,
    complete: (id: string) => `${config.apiUrl}/tournaments/${id}/complete`,
    stats: `${config.apiUrl}/tournaments/stats/overview`,
    myTournaments: `${config.apiUrl}/tournaments/my-tournaments`,
  },
  
  // Teams
  teams: {
    base: `${config.apiUrl}/teams`,
    create: `${config.apiUrl}/teams`,
    list: `${config.apiUrl}/teams`,
    details: (id: string) => `${config.apiUrl}/teams/${id}`,
    update: (id: string) => `${config.apiUrl}/teams/${id}`,
    delete: (id: string) => `${config.apiUrl}/teams/${id}`,
    invite: (id: string) => `${config.apiUrl}/teams/${id}/invite`,
    acceptInvitation: (teamId: string, userId: string) => `${config.apiUrl}/teams/${teamId}/members/${userId}/accept`,
    removeMember: (teamId: string, userId: string) => `${config.apiUrl}/teams/${teamId}/members/${userId}/remove`,
    transferCaptaincy: (teamId: string, newCaptainId: string) => `${config.apiUrl}/teams/${teamId}/transfer-captaincy/${newCaptainId}`,
    matches: (id: string) => `${config.apiUrl}/teams/${id}/matches`,
    tournaments: (id: string) => `${config.apiUrl}/teams/${id}/tournaments`,
    stats: (id: string) => `${config.apiUrl}/teams/${id}/stats`,
    myTeams: `${config.apiUrl}/teams/my-teams`,
    overviewStats: `${config.apiUrl}/teams/stats/overview`,
    verify: (id: string) => `${config.apiUrl}/teams/${id}/verify`,
    unverify: (id: string) => `${config.apiUrl}/teams/${id}/unverify`,
    search: (query: string) => `${config.apiUrl}/teams/search/${query}`,
  },
  
  // Matches
  matches: {
    base: `${config.apiUrl}/matches`,
    create: `${config.apiUrl}/matches`,
    list: `${config.apiUrl}/matches`,
    details: (id: string) => `${config.apiUrl}/matches/${id}`,
    update: (id: string) => `${config.apiUrl}/matches/${id}`,
    submitResult: (id: string) => `${config.apiUrl}/matches/${id}/submit-result`,
    verify: (id: string) => `${config.apiUrl}/matches/${id}/verify`,
    dispute: (id: string) => `${config.apiUrl}/matches/${id}/dispute`,
    start: (id: string) => `${config.apiUrl}/matches/${id}/start`,
    reschedule: (id: string) => `${config.apiUrl}/matches/${id}/reschedule`,
    generateSummary: (id: string) => `${config.apiUrl}/matches/${id}/generate-summary`,
    gameResults: (id: string) => `${config.apiUrl}/matches/${id}/game-results`,
    upcoming: `${config.apiUrl}/matches/upcoming`,
    live: `${config.apiUrl}/matches/live`,
    recent: `${config.apiUrl}/matches/recent`,
    stats: `${config.apiUrl}/matches/stats/overview`,
    tournamentBracket: (tournamentId: string) => `${config.apiUrl}/matches/tournament/${tournamentId}/bracket`,
  },

  // Notifications
  notifications: {
    list: `${config.apiUrl}/matches/notifications`,
    markRead: (id: string) => `${config.apiUrl}/matches/notifications/${id}/read`,
    markAllRead: `${config.apiUrl}/matches/notifications/read-all`,
    unreadCount: `${config.apiUrl}/matches/notifications/unread-count`,
  },
  
  // Chatbot
  chatbot: {
    ask: `${config.apiUrl}/chatbot/ask`,
    suggestions: `${config.apiUrl}/chatbot/suggestions`,
    status: `${config.apiUrl}/chatbot/status`,
    addKnowledge: `${config.apiUrl}/chatbot/knowledge`,
    tournamentChat: (tournamentId: string) => `${config.apiUrl}/chatbot/chat/tournament/${tournamentId}`,
    teamChat: (teamId: string) => `${config.apiUrl}/chatbot/chat/team/${teamId}`,
  },
  
  // WebSocket
  websocket: {
    url: config.apiBaseUrl.replace('http', 'ws'),
    stats: `${config.apiUrl}/ws/stats`,
    broadcast: `${config.apiUrl}/ws/broadcast/global`,
    testMatchUpdate: `${config.apiUrl}/ws/test/match-update`,
    testTournamentUpdate: `${config.apiUrl}/ws/test/tournament-update`,
  },
  
  // General
  root: `${config.apiUrl}/`,
  health: `${config.apiUrl}/health`,
  protected: `${config.apiUrl}/protected`,
  
  // Services
  services: {
    status: `${config.apiUrl}/services/status`,
    blockchainStatus: `${config.apiUrl}/services/blockchain/status`,
  },
};

export default config;