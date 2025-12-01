import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../services/userService';

type WebSocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data?: unknown) => boolean;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string) => void;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);
  const listenersRef = useRef<Record<string, (...args: any[]) => void>>({});

  const connect = async () => {
    console.log('WebSocket: Attempting to connect...');
    
    if (socketRef.current?.connected) {
      console.log('WebSocket: Already connected, skipping new connection');
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      const error = 'No auth token available for socket connection';
      console.warn('WebSocket:', error);
      return;
    }
    
    console.log('WebSocket: Auth token found, initializing connection');

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create new socket connection
    console.log('WebSocket: Creating new socket connection to', API_CONFIG.BASE_URL);
    socketRef.current = io(API_CONFIG.BASE_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      forceNew: true
    });
    
    console.log('WebSocket: Socket instance created, setting up event listeners');

    socketRef.current.on('connect', () => {
      console.log('WebSocket: Successfully connected to server');
      console.log('WebSocket: Socket ID:', socketRef.current?.id);
      isConnectedRef.current = true;
    });

    socketRef.current.on('disconnect', (reason: string) => {
      console.log('WebSocket: Disconnected from server. Reason:', reason);
      isConnectedRef.current = false;
      
      // Attempt to reconnect if not explicitly disconnected
      if (reason !== 'io client disconnect') {
        console.log('WebSocket: Attempting to reconnect...');
        setTimeout(() => connect(), 1000);
      }
    });

    socketRef.current.on('error', (error: Error) => {
      console.error('WebSocket: Connection error:', error);
    });
    
    socketRef.current.on('connect_error', (error: Error) => {
      console.error('WebSocket: Connection error:', error);
    });
    
    socketRef.current.on('reconnect_attempt', (attempt: number) => {
      console.log(`WebSocket: Reconnection attempt ${attempt}`);
    });
    
    socketRef.current.on('reconnect_failed', () => {
      console.error('WebSocket: Failed to reconnect after all attempts');
    });

    // Re-register all existing listeners
    Object.entries(listenersRef.current).forEach(([event, handler]) => {
      socketRef.current?.on(event, handler);
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    listenersRef.current[event] = callback;
    socketRef.current?.on(event, callback);
  };

  const off = (event: string) => {
    delete listenersRef.current[event];
    socketRef.current?.off(event);
  };

  const emit = (event: string, data?: unknown) => {
    console.log(`WebSocket: Emitting event '${event}'`, data);
    
    if (!socketRef.current) {
      console.warn('WebSocket: Socket not initialized');
      connect();
      return false;
    }
    
    if (!socketRef.current.connected) {
      console.warn('WebSocket: Socket not connected. Attempting to reconnect...');
      connect();
      return false;
    }
    
    try {
      socketRef.current.emit(event, data);
      return true;
    } catch (error) {
      console.error(`WebSocket: Error emitting event '${event}':`, error);
      return false;
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected: isConnectedRef.current,
    emit,
    on,
    off,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
