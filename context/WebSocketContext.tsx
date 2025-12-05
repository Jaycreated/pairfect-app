import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { io, type Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import { hasActiveSubscription } from '../services/subscriptionService';
import { getAuthToken } from '../services/userService';

// Create a router instance that can be used outside React components
let globalRouter: any = null;

export const setGlobalRouter = (router: any) => {
  globalRouter = router;
};

type WebSocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  hasSubscription: boolean;
  checkSubscription: () => Promise<boolean>;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  emit: (event: string, data?: unknown) => boolean;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string) => void;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const listenersRef = useRef<Record<string, (...args: any[]) => void>>({});
  const connectionAttempted = useRef(false);
  
  // Use the router from the hook if available, otherwise use the global one
  const routerHook = useRouter();
  const router = routerHook || globalRouter;

  const checkSubscription = useCallback(async (): Promise<boolean> => {
    try {
      const hasSub = await hasActiveSubscription();
      setHasActiveSub(hasSub);
      return hasSub;
    } catch (error) {
      console.warn('Failed to check subscription status:', error);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('WebSocket: Disconnecting...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const connect = async (): Promise<boolean> => {
    if (!router) {
      console.warn('Router not available');
      return false;
    }
    console.log('WebSocket: Attempting to connect...');
    
    // Disconnect existing socket if any
    disconnect();

    const token = await getAuthToken();
    if (!token) {
      console.warn('WebSocket: No auth token available');
      Alert.alert('Authentication Required', 'Please log in to access the chat.');
      return false;
    }
    
    // Check subscription status
    try {
      const hasSub = await checkSubscription();
      if (!hasSub) {
        console.warn('WebSocket: No active subscription');
        Alert.alert(
          'Subscription Required',
          'You need an active subscription to access the chat.',
          [
            {
              text: 'Subscribe',
              onPress: () => {
                if (router) {
                  router.push('/screens/subscribe');
                }
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Subscription check failed:', error);
      Alert.alert('Error', 'Failed to verify subscription status. Please try again.');
      return false;
    }

    const socketUrl = API_CONFIG.WS_URL;
    const socketPath = API_CONFIG.WS_NAMESPACE ? `${API_CONFIG.WS_NAMESPACE}socket.io` : '/socket.io';
    
    console.log('SocketService: Connecting to', socketUrl);
    console.log('SocketService: Using path:', socketPath);
    
    socketRef.current = io(socketUrl, {
      path: socketPath,
      transports: ['websocket'], // Try WebSocket first, then fallback to polling if needed
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000, // 10 second timeout for connection
      forceNew: true, // Force new connection
      autoConnect: true,
      withCredentials: true
    });
    
    console.log('WebSocket: Socket instance created, setting up event listeners');

    socketRef.current.on('connect', () => {
      console.log('WebSocket: Successfully connected to server');
      console.log('WebSocket: Socket ID:', socketRef.current?.id);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason: string) => {
      console.log('WebSocket: Disconnected from server. Reason:', reason);
      setIsConnected(false);
      
      // Only attempt to reconnect if we have an active subscription
      if (reason !== 'io client disconnect' && hasActiveSub) {
        const delay = reason === 'io server disconnect' ? 5000 : 1000;
        console.log(`WebSocket: Attempting to reconnect in ${delay}ms...`);
        setTimeout(() => connect(), delay);
      }
    });

    socketRef.current.on('connect_error', (error: Error) => {
      console.error('WebSocket: Connection error:', error);
      setIsConnected(false);
      
      // Handle payment required error specifically
      if (error.message.includes('Payment required')) {
        console.warn('WebSocket: Payment required for chat access');
        setHasActiveSub(false);
        disconnect();
      }
    });

    socketRef.current.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });

    // Return connection status
    return new Promise<boolean>((resolve) => {
      if (!socketRef.current) return resolve(false);
      
      if (socketRef.current.connected) {
        resolve(true);
      } else {
        const timeout = setTimeout(() => {
          console.warn('WebSocket: Connection timeout');
          resolve(false);
        }, 10000);
        
        socketRef.current.once('connect', () => {
          clearTimeout(timeout);
          resolve(true);
        });
      }
    });

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

  // Removed auto-connect effect to implement lazy loading

  const value = {
    socket: socketRef.current,
    isConnected,
    hasSubscription: hasActiveSub,
    checkSubscription,
    connect,
    disconnect,
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
