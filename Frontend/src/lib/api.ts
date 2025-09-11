import { endpoints } from './config';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'organizer' | 'player' | 'spectator';
  status: 'active' | 'suspended';
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'organizer' | 'player' | 'spectator';
  status?: 'active' | 'suspended';
}

export interface AuthResponse {
  user: User;
  token: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

// Tournament types
export interface Tournament {
  id: number;
  name: string;
  description?: string;
  game: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  status: 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';
  max_teams: number;
  entry_fee?: number;
  prize_pool?: number;
  start_date: string;
  end_date?: string;
  registration_deadline: string;
  organizer_id: number;
  organizer: User;
  created_at: string;
  updated_at?: string;
  rules?: string;
  bracket_generated: boolean;
  teams_count: number;
}

export interface CreateTournamentRequest {
  name: string;
  description?: string;
  game: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  max_teams: number;
  entry_fee?: number;
  prize_pool?: number;
  start_date: string;
  registration_deadline: string;
  rules?: string;
}

// Team types
export interface Team {
  id: number;
  name: string;
  tag?: string;
  description?: string;
  captain_id: number;
  captain: User;
  members: TeamMember[];
  created_at: string;
  updated_at?: string;
  status: 'active' | 'inactive';
  wins: number;
  losses: number;
  draws: number;
}

export interface TeamMember {
  id: number;
  user_id: number;
  user: User;
  team_id: number;
  role: 'captain' | 'player' | 'substitute';
  joined_at: string;
  status: 'active' | 'inactive';
}

export interface CreateTeamRequest {
  name: string;
  tag?: string;
  description?: string;
}

// Match types
export interface Match {
  id: number;
  tournament_id: number;
  tournament: Tournament;
  team1_id?: number;
  team1?: Team;
  team2_id?: number;
  team2?: Team;
  round: number;
  match_number: number;
  scheduled_time?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  team1_score?: number;
  team2_score?: number;
  winner_id?: number;
  winner?: Team;
  summary?: string;
  created_at: string;
  updated_at?: string;
}

export interface UpdateMatchRequest {
  team1_score: number;
  team2_score: number;
  winner_id: number;
  summary?: string;
}

// Chatbot types
export interface ChatbotRequest {
  question: string;
  context?: Record<string, unknown>;
}

export interface ChatbotSource {
  content: string;
  metadata: Record<string, unknown>;
}

export interface ChatbotResponse {
  answer: string;
  sources?: ChatbotSource[];
  confidence: number;
  timestamp: string;
  user_context?: Record<string, unknown>;
  suggestions?: string[];
}

export interface ChatbotStatus {
  service: string;
  status: string;
  knowledge_base: string;
  llm_backend: string;
  embedding_model: string;
  features: string[];
  error: string | null;
}

// Generic API call function
async function apiCall<T>(
  url: string, 
  options: RequestInit = {},
  requireAuth = false
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if required
    if (requireAuth) {
      const token = localStorage.getItem('aegis_token');
      if (token) {
        (headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = response.ok ? await response.json() : null;
    const errorData = !response.ok ? await response.json().catch(() => ({})) : null;

    return {
      success: response.ok,
      data: data,
      error: errorData?.detail || errorData?.message || (!response.ok ? 'Request failed' : undefined),
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

// Authentication API calls
export const authApi = {
  login: (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => 
    apiCall<AuthResponse>(endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData: RegisterRequest): Promise<ApiResponse<User>> => 
    apiCall<User>(endpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  logout: (): Promise<ApiResponse> => 
    apiCall(endpoints.auth.logout, {
      method: 'POST',
    }, true),

  me: (): Promise<ApiResponse<User>> => 
    apiCall<User>(endpoints.auth.me, {}, true),

  getUsers: (skip = 0, limit = 100): Promise<ApiResponse<User[]>> => 
    apiCall<User[]>(`${endpoints.auth.users}?skip=${skip}&limit=${limit}`, {}, true),

  updateProfile: (profileData: Record<string, unknown>): Promise<ApiResponse<User>> => 
    apiCall<User>(endpoints.auth.updateProfile, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }, true),

  getUserById: (userId: string): Promise<ApiResponse<User>> => 
    apiCall<User>(endpoints.auth.getUserById(userId), {}, true),

  deleteUser: (userId: string): Promise<ApiResponse> => 
    apiCall(endpoints.auth.deleteUser(userId), {
      method: 'DELETE',
    }, true),

  token: (credentials: { username: string; password: string }): Promise<ApiResponse<{ access_token: string; token_type: string; expires_in: number }>> => 
    apiCall(endpoints.auth.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: credentials.username,
        password: credentials.password,
        grant_type: 'password'
      }),
    }),
};

// Tournament API calls
export const tournamentApi = {
  create: (tournament: CreateTournamentRequest): Promise<ApiResponse<Tournament>> =>
    apiCall<Tournament>(endpoints.tournaments.create, {
      method: 'POST',
      body: JSON.stringify(tournament),
    }, true),

  list: (params?: {
    skip?: number;
    limit?: number;
    status_filter?: string;
    game_title?: string;
    organizer_id?: string;
  }): Promise<ApiResponse<Tournament[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params?.game_title) queryParams.append('game_title', params.game_title);
    if (params?.organizer_id) queryParams.append('organizer_id', params.organizer_id);
    
    return apiCall<Tournament[]>(`${endpoints.tournaments.list}?${queryParams.toString()}`);
  },

  get: (id: string): Promise<ApiResponse<Tournament>> =>
    apiCall<Tournament>(endpoints.tournaments.details(id)),

  update: (id: string, tournament: Partial<CreateTournamentRequest>): Promise<ApiResponse<Tournament>> =>
    apiCall<Tournament>(endpoints.tournaments.update(id), {
      method: 'PUT',
      body: JSON.stringify(tournament),
    }, true),

  delete: (id: string): Promise<ApiResponse> =>
    apiCall(endpoints.tournaments.delete(id), {
      method: 'DELETE',
    }, true),

  register: (id: string, teamId: string): Promise<ApiResponse> =>
    apiCall(endpoints.tournaments.register(id), {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId }),
    }, true),

  unregister: (id: string, teamId: string): Promise<ApiResponse> =>
    apiCall(endpoints.tournaments.unregister(id, teamId), {
      method: 'DELETE',
    }, true),

  generateDraw: (id: string): Promise<ApiResponse<Record<string, unknown>>> =>
    apiCall(endpoints.tournaments.generateDraw(id), {
      method: 'POST',
    }, true),

  getBracket: (id: string): Promise<ApiResponse<Record<string, unknown>>> =>
    apiCall(endpoints.tournaments.bracket(id)),

  getTeams: (id: string): Promise<ApiResponse<Team[]>> =>
    apiCall<Team[]>(endpoints.tournaments.teams(id)),

  getMatches: (id: string): Promise<ApiResponse<Match[]>> =>
    apiCall<Match[]>(endpoints.tournaments.matches(id)),

  start: (id: string): Promise<ApiResponse<Tournament>> =>
    apiCall<Tournament>(endpoints.tournaments.start(id), {
      method: 'POST',
    }, true),

  complete: (id: string): Promise<ApiResponse<Tournament>> =>
    apiCall<Tournament>(endpoints.tournaments.complete(id), {
      method: 'POST',
    }, true),

  getStats: (): Promise<ApiResponse<{ total_tournaments: number; active: number; completed: number; by_status: Record<string, number> }>> =>
    apiCall(endpoints.tournaments.stats, {}, true),

  getMyTournaments: (): Promise<ApiResponse<Tournament[]>> =>
    apiCall<Tournament[]>(endpoints.tournaments.myTournaments, {}, true),
};

// Team-related interfaces
export interface TeamInvitation {
  user_id: string;
  role: 'player' | 'substitute';
}

export interface TeamStats {
  total_teams: number;
  active_teams: number;
  verified_teams: number;
  teams_by_status: Record<string, number>;
}

// Team API calls
export const teamApi = {
  create: (team: CreateTeamRequest): Promise<ApiResponse<Team>> =>
    apiCall<Team>(endpoints.teams.create, {
      method: 'POST',
      body: JSON.stringify(team),
    }, true),

  list: (params?: {
    skip?: number;
    limit?: number;
    status_filter?: string;
    search?: string;
    verified_only?: boolean;
  }): Promise<ApiResponse<Team[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.verified_only !== undefined) queryParams.append('verified_only', params.verified_only.toString());
    
    return apiCall<Team[]>(`${endpoints.teams.list}?${queryParams.toString()}`);
  },

  get: (id: string): Promise<ApiResponse<Team>> =>
    apiCall<Team>(endpoints.teams.details(id)),

  update: (id: string, team: Partial<CreateTeamRequest>): Promise<ApiResponse<Team>> =>
    apiCall<Team>(endpoints.teams.update(id), {
      method: 'PUT',
      body: JSON.stringify(team),
    }, true),

  delete: (id: string): Promise<ApiResponse> =>
    apiCall(endpoints.teams.delete(id), {
      method: 'DELETE',
    }, true),

  invite: (id: string, invitation: TeamInvitation): Promise<ApiResponse> =>
    apiCall(endpoints.teams.invite(id), {
      method: 'POST',
      body: JSON.stringify(invitation),
    }, true),

  acceptInvitation: (teamId: string, userId: string): Promise<ApiResponse> =>
    apiCall(endpoints.teams.acceptInvitation(teamId, userId), {
      method: 'POST',
    }, true),

  removeMember: (teamId: string, userId: string): Promise<ApiResponse> =>
    apiCall(endpoints.teams.removeMember(teamId, userId), {
      method: 'POST',
    }, true),

  transferCaptaincy: (teamId: string, newCaptainId: string): Promise<ApiResponse> =>
    apiCall(endpoints.teams.transferCaptaincy(teamId, newCaptainId), {
      method: 'POST',
    }, true),

  getMatches: (id: string, limit = 20): Promise<ApiResponse<Match[]>> =>
    apiCall<Match[]>(`${endpoints.teams.matches(id)}?limit=${limit}`),

  getTournaments: (id: string): Promise<ApiResponse<Tournament[]>> =>
    apiCall<Tournament[]>(endpoints.teams.tournaments(id)),

  getStats: (id: string): Promise<ApiResponse<Record<string, unknown>>> =>
    apiCall(endpoints.teams.stats(id)),

  getMyTeams: (): Promise<ApiResponse<Team[]>> =>
    apiCall<Team[]>(endpoints.teams.myTeams, {}, true),

  getOverviewStats: (): Promise<ApiResponse<TeamStats>> =>
    apiCall<TeamStats>(endpoints.teams.overviewStats, {}, true),

  verify: (id: string): Promise<ApiResponse> =>
    apiCall(endpoints.teams.verify(id), {
      method: 'POST',
    }, true),

  unverify: (id: string): Promise<ApiResponse> =>
    apiCall(endpoints.teams.unverify(id), {
      method: 'POST',
    }, true),

  search: (query: string, limit = 10): Promise<ApiResponse<Team[]>> =>
    apiCall<Team[]>(`${endpoints.teams.search(query)}?limit=${limit}`),
};

// Match types for comprehensive coverage
export interface CreateMatchRequest {
  tournament_id: string;
  team1_id: string;
  team2_id: string;
  round: number;
  match_number: number;
  scheduled_time?: string;
}

export interface MatchResultSubmission {
  team1_score: number;
  team2_score: number;
  winner_id: string;
  summary?: string;
  games?: GameResult[];
}

export interface GameResult {
  game_number: number;
  team1_score: number;
  team2_score: number;
  duration?: number;
  notes?: string;
}

export interface NotificationResponse {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

// Match API calls
export const matchApi = {
  create: (match: CreateMatchRequest): Promise<ApiResponse<Match>> =>
    apiCall<Match>(endpoints.matches.create, {
      method: 'POST',
      body: JSON.stringify(match),
    }, true),

  list: (params?: {
    skip?: number;
    limit?: number;
    tournament_id?: string;
    team_id?: string;
    status?: string;
  }): Promise<ApiResponse<Match[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.tournament_id) queryParams.append('tournament_id', params.tournament_id);
    if (params?.team_id) queryParams.append('team_id', params.team_id);
    if (params?.status) queryParams.append('status_filter', params.status);
    
    return apiCall<Match[]>(`${endpoints.matches.list}?${queryParams.toString()}`);
  },

  get: (id: string): Promise<ApiResponse<Match>> =>
    apiCall<Match>(endpoints.matches.details(id)),

  update: (id: string, match: Partial<CreateMatchRequest>): Promise<ApiResponse<Match>> =>
    apiCall<Match>(endpoints.matches.update(id), {
      method: 'PUT',
      body: JSON.stringify(match),
    }, true),

  submitResult: (id: string, result: MatchResultSubmission): Promise<ApiResponse<Match>> =>
    apiCall<Match>(endpoints.matches.submitResult(id), {
      method: 'POST',
      body: JSON.stringify(result),
    }, true),

  verify: (id: string): Promise<ApiResponse<Match>> =>
    apiCall<Match>(endpoints.matches.verify(id), {
      method: 'POST',
    }, true),

  dispute: (id: string, reason: string): Promise<ApiResponse> =>
    apiCall(endpoints.matches.dispute(id), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }, true),

  start: (id: string): Promise<ApiResponse<Match>> =>
    apiCall<Match>(endpoints.matches.start(id), {
      method: 'POST',
    }, true),

  reschedule: (id: string, newTime: string): Promise<ApiResponse> =>
    apiCall(endpoints.matches.reschedule(id), {
      method: 'POST',
      body: JSON.stringify({ new_time: newTime }),
    }, true),

  generateSummary: (id: string): Promise<ApiResponse<Match>> =>
    apiCall<Match>(endpoints.matches.generateSummary(id), {
      method: 'POST',
    }, true),

  getGameResults: (id: string): Promise<ApiResponse<GameResult[]>> =>
    apiCall<GameResult[]>(endpoints.matches.gameResults(id)),

  addGameResult: (id: string, gameResult: GameResult): Promise<ApiResponse<GameResult>> =>
    apiCall<GameResult>(endpoints.matches.gameResults(id), {
      method: 'POST',
      body: JSON.stringify(gameResult),
    }, true),

  getUpcoming: (hours = 24, limit = 50): Promise<ApiResponse<Match[]>> =>
    apiCall<Match[]>(`${endpoints.matches.upcoming}?hours=${hours}&limit=${limit}`),

  getLive: (): Promise<ApiResponse<Match[]>> =>
    apiCall<Match[]>(endpoints.matches.live),

  getRecent: (days = 7, limit = 50): Promise<ApiResponse<Match[]>> =>
    apiCall<Match[]>(`${endpoints.matches.recent}?days=${days}&limit=${limit}`),

  getStats: (): Promise<ApiResponse<{ total_matches: number; completed: number; live: number; upcoming: number }>> =>
    apiCall(endpoints.matches.stats, {}, true),

  getTournamentBracket: (tournamentId: string): Promise<ApiResponse<Record<string, unknown>>> =>
    apiCall(endpoints.matches.tournamentBracket(tournamentId)),
};

// Notification API calls
export const notificationApi = {
  list: (params?: {
    skip?: number;
    limit?: number;
    unread_only?: boolean;
  }): Promise<ApiResponse<NotificationResponse[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.unread_only !== undefined) queryParams.append('unread_only', params.unread_only.toString());
    
    return apiCall<NotificationResponse[]>(`${endpoints.notifications.list}?${queryParams.toString()}`, {}, true);
  },

  markRead: (id: string): Promise<ApiResponse> =>
    apiCall(endpoints.notifications.markRead(id), {
      method: 'POST',
    }, true),

  markAllRead: (): Promise<ApiResponse> =>
    apiCall(endpoints.notifications.markAllRead, {
      method: 'POST',
    }, true),

  getUnreadCount: (): Promise<ApiResponse<{ unread_count: number }>> =>
    apiCall(endpoints.notifications.unreadCount, {}, true),
};

// Chatbot-related interfaces
export interface KnowledgeUpdate {
  content: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

// Chatbot API calls
export const chatbotApi = {
  ask: (request: ChatbotRequest): Promise<ApiResponse<ChatbotResponse>> =>
    apiCall<ChatbotResponse>(endpoints.chatbot.ask, {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  getSuggestions: (): Promise<ApiResponse<{ suggestions: string[]; user_context: Record<string, unknown> }>> =>
    apiCall<{ suggestions: string[]; user_context: Record<string, unknown> }>(endpoints.chatbot.suggestions),

  getStatus: (): Promise<ApiResponse<ChatbotStatus>> =>
    apiCall<ChatbotStatus>(endpoints.chatbot.status),

  addKnowledge: (knowledge: KnowledgeUpdate): Promise<ApiResponse<{ message: string; content_length: number; added_by: string }>> =>
    apiCall(endpoints.chatbot.addKnowledge, {
      method: 'POST',
      body: JSON.stringify(knowledge),
    }, true),

  askAboutTournament: (tournamentId: string, request: ChatbotRequest): Promise<ApiResponse<ChatbotResponse>> =>
    apiCall<ChatbotResponse>(endpoints.chatbot.tournamentChat(tournamentId), {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  askAboutTeam: (teamId: string, request: ChatbotRequest): Promise<ApiResponse<ChatbotResponse>> =>
    apiCall<ChatbotResponse>(endpoints.chatbot.teamChat(teamId), {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

// Service status interfaces
export interface ServiceStatus {
  blockchain: {
    enabled: boolean;
    connected: boolean;
    chain_id?: number;
    status: string;
  };
  email: {
    enabled: boolean;
    provider: string;
    status: string;
  };
  ai: {
    enabled: boolean;
    provider: string;
    status: string;
  };
  database: {
    connected: boolean;
    status: string;
  };
}

export interface BlockchainStatus {
  enabled: boolean;
  connected: boolean;
  status: string;
  chain_id?: number;
  network?: string;
  contract_address?: string;
  provider?: string;
  error?: string;
}

// General API calls
export const generalApi = {
  health: (): Promise<ApiResponse<{ status: string }>> => 
    apiCall<{ status: string }>(endpoints.health),

  root: (): Promise<ApiResponse<{ message: string }>> => 
    apiCall<{ message: string }>(endpoints.root),

  protected: (): Promise<ApiResponse<{ message: string; user_role: string; user_id: string }>> => 
    apiCall(endpoints.protected, {}, true),

  getServicesStatus: (): Promise<ApiResponse<ServiceStatus>> =>
    apiCall<ServiceStatus>(endpoints.services.status),

  getBlockchainStatus: (): Promise<ApiResponse<BlockchainStatus>> =>
    apiCall<BlockchainStatus>(endpoints.services.blockchainStatus),
};

// WebSocket API calls
export const websocketApi = {
  getStats: (): Promise<ApiResponse<{ connections: number; rooms: number; messages_sent: number }>> =>
    apiCall(endpoints.websocket.stats, {}, true),

  broadcastGlobal: (message: { event: string; data: Record<string, unknown> }): Promise<ApiResponse> =>
    apiCall(endpoints.websocket.broadcast, {
      method: 'POST',
      body: JSON.stringify(message),
    }, true),

  testMatchUpdate: (data: { match_id: string; status?: string; score?: Record<string, number> }): Promise<ApiResponse> =>
    apiCall(endpoints.websocket.testMatchUpdate, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true),

  testTournamentUpdate: (data: { tournament_id: string; status?: string; message?: string }): Promise<ApiResponse> =>
    apiCall(endpoints.websocket.testTournamentUpdate, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true),
};

const api = {
  auth: authApi,
  tournaments: tournamentApi,
  teams: teamApi,
  matches: matchApi,
  notifications: notificationApi,
  chatbot: chatbotApi,
  websocket: websocketApi,
  general: generalApi,
};

export default api;