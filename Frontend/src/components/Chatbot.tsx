'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { chatbotApi, type ChatbotRequest, type ChatbotResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  sources?: Array<{ content: string; metadata: Record<string, unknown> }>;
  suggestions?: string[];
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated } = useAuth();

  const { data: suggestionsResponse } = useQuery({
    queryKey: ['chatbot-suggestions'],
    queryFn: () => chatbotApi.getSuggestions(),
    enabled: isOpen,
  });

  const { data: statusResponse } = useQuery({
    queryKey: ['chatbot-status'],
    queryFn: () => chatbotApi.getStatus(),
  });

  const chatMutation = useMutation({
    mutationFn: (request: ChatbotRequest) => chatbotApi.ask(request),
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (response) => {
      setIsTyping(false);
      if (response.success && response.data) {
        const botMessage: ChatMessage = {
          id: Date.now().toString() + '_bot',
          type: 'bot',
          content: response.data.answer,
          timestamp: new Date(),
          sources: response.data.sources,
          suggestions: response.data.suggestions,
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: Date.now().toString() + '_error',
          type: 'bot',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    },
    onError: () => {
      setIsTyping(false);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        type: 'bot',
        content: 'Sorry, I\'m having trouble connecting. Please try again later.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '_user',
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    const request: ChatbotRequest = {
      question: input.trim(),
      context: {
        user_id: user?.id,
        user_role: user?.role,
        is_authenticated: isAuthenticated,
      },
    };

    chatMutation.mutate(request);
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const isOnline = statusResponse?.data?.status === 'operational';
  const suggestions = suggestionsResponse?.data?.suggestions || [];

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-800 border border-green-500/50 text-green-400' 
            : 'bg-green-500 hover:bg-green-400 text-black'
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        )}
      </button>

      {/* Chatbot Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] h-[32rem] bg-gray-900/95 border border-green-500/30 rounded-lg shadow-2xl backdrop-blur-sm font-mono">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-green-500/30">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-bold text-green-400">AEGIS Assistant</h3>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-400">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-80">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 space-y-4">
                <div className="flex items-center justify-center w-16 h-16 bg-green-400/10 rounded-full mx-auto">
                  <SparklesIcon className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="font-medium mb-2">Welcome to AEGIS Assistant!</p>
                  <p className="text-sm text-gray-500">
                    I can help you with tournament management, team organization, and platform features.
                  </p>
                </div>
                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Try asking:</p>
                    <div className="space-y-1">
                      {suggestions.slice(0, 3).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-xs bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 rounded p-2 transition-colors"
                        >
                          "{suggestion}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-green-500 text-black'
                      : 'bg-gray-800 text-gray-200 border border-gray-600/50'
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    {message.type === 'user' ? (
                      <p className="text-black font-medium">{message.content}</p>
                    ) : (
                      <div className="text-gray-200">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-600/50">
                      <div className="flex items-center text-xs text-gray-400 mb-2">
                        <InformationCircleIcon className="w-3 h-3 mr-1" />
                        Sources
                      </div>
                      <div className="space-y-1">
                        {message.sources.slice(0, 2).map((source, index) => (
                          <div key={index} className="text-xs bg-gray-700/30 rounded p-2">
                            {source.content.slice(0, 100)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-600/50">
                      <p className="text-xs text-gray-400 mb-2">Related questions:</p>
                      <div className="space-y-1">
                        {message.suggestions.slice(0, 2).map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left text-xs bg-gray-700/30 hover:bg-gray-600/30 rounded p-2 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-2">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-600/50 p-3 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-150" />
                    </div>
                    <span className="text-xs text-gray-400 ml-2">AEGIS is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-green-500/30 p-4">
            {!isOnline && (
              <div className="flex items-center text-xs text-yellow-400 mb-2">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                Chatbot is currently offline
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isOnline ? "Ask about tournaments, teams, or features..." : "Chatbot offline"}
                disabled={!isOnline || chatMutation.isPending}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!input.trim() || !isOnline || chatMutation.isPending}
                className="px-3 py-2 bg-green-500 text-black rounded-md hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}