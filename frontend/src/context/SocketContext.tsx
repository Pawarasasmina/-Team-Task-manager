import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Notification } from '../services/notificationService';
import { useToast } from './ToastContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    // Get user data from localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      return;
    }

    const user = JSON.parse(userStr);
    const socketUrl = 'http://localhost:5000';

    console.log('🔌 Initializing socket connection to:', socketUrl);
    console.log('🔌 User ID to register:', user.id || user._id);

    // Initialize socket connection
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      setConnected(true);
      // Register user with their ID
      newSocket.emit('register', user.id || user._id);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setConnected(false);
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('🔔 New notification received:', notification);
      
      // Add to notifications array
      setNotifications(prev => {
        console.log('🔔 Previous notifications count:', prev.length);
        const updated = [notification, ...prev];
        console.log('🔔 Updated notifications count:', updated.length);
        return updated;
      });
      
      // Show in-app toast notification
      console.log('🔔 Triggering toast for:', notification.title);
      showToast({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        senderName: notification.sender?.name
      });
      
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo192.png',
          badge: '/logo192.png'
        });
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [showToast]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const value: SocketContextType = {
    socket,
    connected,
    notifications,
    addNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
