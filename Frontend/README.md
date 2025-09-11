# AEGIS Frontend

> **Advanced Esports Gaming Intelligence System** - Tournament Management Platform Frontend

A modern, secure, and scalable frontend application built with Next.js 15.4.5 for managing esports tournaments with blockchain verification, AI-powered features, and real-time updates.

## 🚀 Features

### Core Functionality
- **Tournament Management**: Complete CRUD operations for tournaments with live brackets
- **Team Organization**: Team creation, member management, and invitation system
- **Match Tracking**: Real-time match updates with AI-generated summaries
- **User Authentication**: JWT-based auth with role-based access control
- **Real-time Updates**: WebSocket integration for live tournament events
- **AI Integration**: RAG-enhanced chatbot with Gemini 2.0 Flash
- **Blockchain Integration**: Fair draw generation with Polygon network

### Security & Access Control
- **Role-based System**: Admin, Organizer, Player, Spectator roles
- **Protected Routes**: Route-level access control
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive form validation with Zod

### UI/UX
- **Matrix Theme**: Cybersecurity-inspired dark theme with green accents
- **Responsive Design**: Mobile-first responsive layout
- **Real-time Notifications**: Toast notifications and status indicators
- **Loading States**: Comprehensive loading and error states

## 🛠 Technology Stack

- **Framework**: Next.js 15.4.5 with App Router and Turbopack
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: TanStack Query (React Query) for server state
- **Authentication**: JWT with secure token management
- **Real-time**: Socket.io-client for WebSocket connections
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Heroicons, React Hot Toast
- **Date Handling**: date-fns for date manipulation

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard and management
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── tournaments/       # Tournament pages
│   └── page.tsx          # Homepage
├── components/            # Reusable UI components
│   ├── Header.tsx        # Navigation header
│   ├── MatrixBackground.tsx # Animated background
│   ├── Chatbot.tsx       # AI chatbot interface
│   └── ProtectedRoute.tsx # Route protection
├── contexts/              # React contexts
│   ├── AuthContext.tsx   # Authentication state
│   └── WebSocketContext.tsx # WebSocket connections
├── lib/                   # Utility libraries
│   ├── api.ts            # API client functions
│   ├── config.ts         # Configuration and endpoints
│   └── utils.ts          # Utility functions
└── types/                 # TypeScript type definitions
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- AEGIS Backend running on `http://localhost:8001`

### Installation

1. **Clone and navigate to frontend:**
   ```bash
   cd Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment setup:**
   ```bash
   # Create .env.local file
   NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
   NEXT_PUBLIC_WS_URL=http://localhost:8001
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   ```
   http://localhost:3003
   ```

## 📊 API Integration

### Complete Backend Connectivity
- **76 Backend Endpoints** → **156 Frontend API Calls**
- **9 Services** fully integrated with real-time status monitoring

### Service APIs
```typescript
// Authentication & User Management
authApi: login, register, getUsers, updateProfile, deleteUser

// Tournament Management  
tournamentApi: create, list, update, delete, register, generateDraw

// Team Management
teamApi: create, list, invite, acceptInvitation, transferCaptaincy

// Match Management
matchApi: create, list, submitResult, generateSummary, reschedule

// Real-time Notifications
notificationApi: list, markRead, markAllRead, getUnreadCount

// AI-Powered Chatbot
chatbotApi: ask, getSuggestions, getStatus, addKnowledge

// WebSocket Events
websocketApi: broadcast, testMatchUpdate, testTournamentUpdate

// System Services
generalApi: health, getServicesStatus, getBlockchainStatus
```

## 🎭 User Roles & Access Control

### Public Access
- Homepage with tournament overview
- Tournament listings and details
- About/Contact/Privacy pages

### Authenticated Users
- Personal dashboard with role-specific content
- Tournament registration and participation
- Team management and invitations
- Real-time match tracking

### Organizers
- Tournament creation and management
- Match scheduling and result verification
- Team oversight and bracket generation

### Administrators
- Complete system administration
- User management and role assignment
- Service monitoring and system health
- Advanced tournament controls

## 🔌 Real-time Features

### WebSocket Integration
```typescript
// Auto-connecting WebSocket with authentication
const { socket, isConnected, joinTournament } = useWebSocket();

// Event handling
socket.on('tournament_updated', (data) => {
  // Real-time tournament updates
});

socket.on('match_updated', (data) => {
  // Live match score updates
});
```

### Live Updates
- Tournament bracket updates
- Match score changes
- Team registrations
- System notifications

## 🤖 AI Features

### RAG-Enhanced Chatbot
- **Context-Aware Responses**: Based on user role and current page
- **Knowledge Base**: Dynamic knowledge updates for admins/organizers  
- **Multi-Context Support**: Tournament-specific and team-specific queries
- **Real-time Status**: Online/offline indicator with service health

### AI-Powered Match Summaries
- **Gemini 2.0 Flash Integration**: Advanced natural language generation
- **Automated Narratives**: Exciting match recaps and tournament summaries
- **Fallback System**: Graceful degradation when AI is unavailable

## 🔐 Security Features

### Authentication Flow
```typescript
// Secure JWT token management
const { user, token, login, logout, isAuthenticated } = useAuth();

// Role-based route protection
if (!isAdmin) {
  return <AccessDenied />;
}
```

### Security Measures
- **JWT Token Security**: Automatic token refresh and validation
- **Role-based Access Control**: Granular permissions system
- **Input Sanitization**: All forms validated with Zod schemas
- **Protected Routes**: Client and server-side route protection
- **CORS Configuration**: Secure cross-origin resource sharing

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

### Matrix Theme
- **Dark Background**: Black with subtle gradients
- **Accent Colors**: Matrix green (#00ff00) for highlights
- **Typography**: Monospace font for cybersecurity aesthetic
- **Animations**: Subtle hover effects and transitions

## 🧪 Development Scripts

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server  
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Linting with auto-fix
npm run lint:fix
```

## 🔧 Configuration

### API Endpoints
All backend endpoints are centrally configured in `src/lib/config.ts`:

```typescript
export const endpoints = {
  auth: { login, register, me, users },
  tournaments: { create, list, details, register },
  teams: { create, list, invite, members },
  matches: { create, list, generateSummary },
  // ... 150+ more endpoints
};
```

### Environment Variables
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:8001

# Optional: Custom Configuration
NEXT_PUBLIC_APP_NAME=AEGIS
NEXT_PUBLIC_VERSION=1.0.0
```

## 🐛 Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# App automatically uses port 3003
# Check console output for actual port
```

**API Connection Issues:**
```bash
# Verify backend is running on port 8001
# Check CORS configuration in backend
# Verify JWT token in browser localStorage
```

**WebSocket Connection Failed:**
```bash
# Ensure user is authenticated
# Check WebSocket URL configuration
# Verify backend WebSocket service is running
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Configuration
- Set `NEXT_PUBLIC_API_URL` to production backend URL
- Configure CORS in backend for production domain
- Set up SSL certificates for HTTPS

### Performance Optimization
- **Turbopack**: Faster development builds
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js automatic image optimization
- **Font Optimization**: Geist font family optimization

## 📈 Monitoring & Analytics

### Real-time System Health
- **Service Status**: All 9 services monitored in admin dashboard
- **Connection Health**: WebSocket and API connectivity status
- **Performance Metrics**: Load times and response monitoring

### User Experience
- **Loading States**: Comprehensive loading indicators
- **Error Handling**: Graceful error states with recovery options
- **Toast Notifications**: Real-time user feedback

## 🤝 Contributing

### Development Guidelines
1. **TypeScript**: Maintain strict type safety
2. **Component Structure**: Follow established patterns
3. **API Integration**: Use centralized API functions
4. **Styling**: Maintain Matrix theme consistency
5. **Testing**: Ensure all features work across roles

### Code Quality
- **ESLint**: Configured for Next.js and TypeScript
- **Type Safety**: No `any` types allowed
- **Component Props**: Properly typed interfaces
- **Error Boundaries**: Graceful error handling

## 📄 License

This project is part of the AEGIS Tournament Management Platform.

---

## 🎯 Status: **100% Complete**

✅ **76/76 Backend Endpoints** integrated  
✅ **All User Roles** implemented with proper access control  
✅ **Real-time Features** functional with WebSocket  
✅ **AI Services** integrated with Gemini 2.0 Flash  
✅ **Blockchain Integration** ready for fair tournament draws  
✅ **Responsive Design** with Matrix cybersecurity theme  
✅ **Type Safety** with comprehensive TypeScript coverage  
✅ **Security** with JWT authentication and role-based access  

**Ready for production deployment** with complete feature set and robust architecture.