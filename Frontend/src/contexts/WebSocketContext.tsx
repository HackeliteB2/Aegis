'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

type SocketType = ReturnType<typeof io>;
import { endpoints } from '@/lib/config';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  socket: SocketType | null;
  isConnected: boolean;
  joinTournament: (tournamentId: number) => void;
  leaveTournament: (tournamentId: number) => void;
  sendMessage: (event: string, data: unknown) => void;
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
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (isAuthenticated && token) {
      const socketInstance = io(endpoints.websocket.url, {
        auth: {
          token: token,
        },
        transports: ['websocket'],
        upgrade: true,
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        console.log('WebSocket connected');
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
      });

      socketInstance.on('connect_error', (error: Error) => {
        console.error('WebSocket connection error:', error);
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(() => {
            socketInstance.connect();
          }, Math.pow(2, reconnectAttempts.current) * 1000);
        }
      });

      // Tournament-related events
      socketInstance.on('tournament_updated', (data: { tournament: { name: string } }) => {
        toast.success(`Tournament "${data.tournament.name}" has been updated`);
      });

      socketInstance.on('bracket_generated', (data: { tournament: { name: string } }) => {
        toast.success(`Bracket generated for tournament "${data.tournament.name}"`);
      });

      socketInstance.on('match_updated', (data: { match: { match_number: number } }) => {
        toast(`Match ${data.match.match_number} updated`);
      });

      socketInstance.on('match_completed', (data: { match: { team1?: { name: string }; team2?: { name: string } } }) => {
        toast.success(`Match completed: ${data.match.team1?.name} vs ${data.match.team2?.name}`);
      });

      socketInstance.on('tournament_completed', (data: { tournament: { name: string } }) => {
        toast.success(`Tournament "${data.tournament.name}" has been completed!`);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, token]);

  const joinTournament = (tournamentId: number) => {
    if (socket && isConnected) {
      socket.emit('join_tournament', { tournament_id: tournamentId });
    }
  };

  const leaveTournament = (tournamentId: number) => {
    if (socket && isConnected) {
      socket.emit('leave_tournament', { tournament_id: tournamentId });
    }
  };

  const sendMessage = (event: string, data: unknown) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

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