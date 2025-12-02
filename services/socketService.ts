import { io, type Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from './userService';

type SocketEventHandler = (...args: any[]) => void;

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private listeners: Record<string, SocketEventHandler> = {};

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect() {
    if (this.socket?.connected) return;

    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available for socket connection');
      return;
    }

    this.socket = io(API_CONFIG.BASE_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket?.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket?.on('error', (error: Error) => {
      console.error('Socket error:', error);
    });

    // Set up any existing listeners
    Object.entries(this.listeners).forEach(([event, handler]) => {
      this.socket?.on(event, handler);
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public on(event: string, callback: SocketEventHandler) {
    this.listeners[event] = callback;
    this.socket?.on(event, callback);
  }

  public off(event: string) {
    delete this.listeners[event];
    this.socket?.off(event);
  }

  public emit(event: string, data?: unknown) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected. Attempting to reconnect...');
      this.connect();
      // You might want to implement a queue for messages that need to be sent after reconnection
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  public getSocketId(): string | null {
    return this.socket?.id || null;
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = SocketService.getInstance();
