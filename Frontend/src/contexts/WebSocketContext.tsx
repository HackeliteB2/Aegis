'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { endpoints } from '@/lib/config';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  joinTournament: (tournamentId: number) => void;
  leaveTournament: (tournamentId: number) => void;
  sendMessage: (type: string, data: unknown) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only attempt connection if user is authenticated and we have a token
    if (!isAuthenticated || !token) {
      console.log('WebSocket: Waiting for authentication...');
      return;
    }

    // Small delay to ensure auth is fully loaded
    const timer = setTimeout(() => {
      // Try without token first to test basic connectivity
      const wsUrl = `${endpoints.websocket.url}/api/v1/ws`;
      console.log('Attempting WebSocket connection to:', wsUrl);
      
      try {
        console.log('Pre-connection diagnostics:');
        console.log('- WebSocket URL:', wsUrl);
        console.log('- Has WebSocket support:', typeof WebSocket !== 'undefined');
        console.log('- Token length:', token ? token.length : 0);
        console.log('- Endpoints config:', JSON.stringify(endpoints.websocket, null, 2));
        console.log('- Browser:', navigator.userAgent);
        
        console.log('Creating WebSocket with URL (no token):', wsUrl);
        const socketInstance = new WebSocket(wsUrl);
        
        console.log('WebSocket created, initial readyState:', socketInstance.readyState);

        socketInstance.onopen = () => {
          setIsConnected(true);
          reconnectAttempts.current = 0;
          console.log('✅ WebSocket connected successfully!');
          console.log('- URL:', wsUrl);
          console.log('- Ready state:', socketInstance.readyState);
          console.log('- Timestamp:', new Date().toISOString());
          
          // Send authentication after connection is established
          if (token) {
            console.log('Sending authentication token...');
            const authMessage = {
              type: 'authenticate',
              token: token
            };
            socketInstance.send(JSON.stringify(authMessage));
          }
        };

      socketInstance.onclose = (event) => {
        setIsConnected(false);
        console.log('❌ WebSocket disconnected!');
        console.log('- Code:', event.code);
        console.log('- Reason:', event.reason || 'No reason provided');
        console.log('- Was clean:', event.wasClean);
        console.log('- URL:', wsUrl);
        console.log('- Timestamp:', new Date().toISOString());
        
        // Check if it's an authentication error (code 1000-1015 are standard close codes)
        if (event.code === 1002 || event.code === 1003 || event.code === 1008) {
          console.log('WebSocket closed due to authentication/protocol error. Not attempting reconnect.');
          toast.error('Authentication expired. Please log in again.');
          return;
        }
        
        // Auto-reconnect logic for other types of disconnections
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          console.log(`Attempting reconnect ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms`);
          reconnectTimeout.current = setTimeout(() => {
            if (isAuthenticated && token) {
              const newWsUrl = `${endpoints.websocket.url}/api/v1/ws`;
              const newSocket = new WebSocket(newWsUrl);
              setSocket(newSocket);
            }
          }, delay);
        } else {
          console.log('Max reconnection attempts reached');
          toast.error('WebSocket connection failed after multiple attempts');
        }
      };

      socketInstance.onerror = (error) => {
        console.error('🚨 WebSocket error occurred!');
        console.error('- Error type:', typeof error);
        console.error('- Error message:', error.message || 'No message available');
        console.error('- Ready state:', socketInstance.readyState);
        console.error('- Ready state text:', ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][socketInstance.readyState]);
        console.error('- URL:', wsUrl);
        console.error('- Timestamp:', new Date().toISOString());
        
        // Log browser context
        console.error('Browser context:');
        console.error('- Has WebSocket:', typeof WebSocket !== 'undefined');
        console.error('- Protocol:', window.location.protocol);
        console.error('- Host:', window.location.host);
        console.error('- User Agent:', navigator.userAgent);
      };

      socketInstance.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      setSocket(socketInstance);

        return () => {
          // Clear any pending reconnection attempts
          if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
          }
          socketInstance.close();
          setSocket(null);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
    }, 100); // 100ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [isAuthenticated, token]);

  const handleWebSocketMessage = (message: any) => {
    const { type, data } = message;
    
    switch (type) {
      case 'authentication_success':
        console.log('🔐 WebSocket authentication successful:', message.user);
        break;
      
      case 'authentication_failed':
        console.error('🔐 WebSocket authentication failed:', message.message);
        toast.error('WebSocket authentication failed');
        break;
      
      case 'tournament_update':
        if (data?.update_type === 'tournament_updated') {
          toast.success(`Tournament "${data.data?.tournament?.name || 'Unknown'}" has been updated`);
        } else if (data?.update_type === 'bracket_update') {
          toast.success(`Bracket generated for tournament "${data.data?.tournament?.name || 'Unknown'}"`);
        }
        break;
      
      case 'match_update':
        if (data?.update_type === 'match_completed') {
          const team1Name = data.data?.team1?.name || 'Team 1';
          const team2Name = data.data?.team2?.name || 'Team 2';
          toast.success(`Match completed: ${team1Name} vs ${team2Name}`);
        } else if (data?.update_type === 'score_update') {
          toast(`Match score updated`);
        }
        break;
      
      case 'global_announcement':
        toast.success(data?.message || 'New announcement');
        break;
      
      case 'connection_established':
        console.log('WebSocket connection established:', message);
        break;
      
      case 'error':
        console.error('WebSocket error message:', message.message);
        break;
      
      default:
        console.log('Unhandled WebSocket message:', message);
    }
  };

  const joinTournament = (tournamentId: number) => {
    if (socket && isConnected) {
      const message = {
        type: 'subscribe_tournament',
        tournament_id: tournamentId.toString()
      };
      socket.send(JSON.stringify(message));
    }
  };

  const leaveTournament = (tournamentId: number) => {
    if (socket && isConnected) {
      const message = {
        type: 'unsubscribe_tournament',
        tournament_id: tournamentId.toString()
      };
      socket.send(JSON.stringify(message));
    }
  };

  const sendMessage = (type: string, data: unknown) => {
    if (socket && isConnected) {
      const message = { type, ...data };
      socket.send(JSON.stringify(message));
    }
  };

  // Debug function for manual testing (only in development)
  const testWebSocketConnection = () => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('Manual WebSocket test initiated...');
      const testWs = new WebSocket('ws://localhost:8000/api/v1/ws');
      testWs.onopen = () => console.log('Test WebSocket: Connected without token');
      testWs.onerror = (e) => console.error('Test WebSocket: Error without token', e);
      testWs.onclose = (e) => console.log('Test WebSocket: Closed', e.code, e.reason);
    }
  };

  // Expose test function globally in development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    (window as any).testWebSocket = testWebSocketConnection;
  }

  const value: WebSocketContextType = {
    socket,
    isConnected,
    joinTournament,
    leaveTournament,
    sendMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};