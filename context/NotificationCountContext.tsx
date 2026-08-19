import { api } from '@/services/api';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

type NotificationCountContextType = {
  unreadCount: number;
  isLoading: boolean;
  refreshNotificationCount: () => Promise<void>;
};

const NotificationCountContext = createContext<NotificationCountContextType | undefined>(
  undefined
);

export const NotificationCountProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshNotificationCount = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.getUnreadNotificationCount();
      if (response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNotificationCount();
  }, []);

  return (
    <NotificationCountContext.Provider
      value={{
        unreadCount,
        isLoading,
        refreshNotificationCount,
      }}
    >
      {children}
    </NotificationCountContext.Provider>
  );
};

export const useNotificationCount = (): NotificationCountContextType => {
  const context = useContext(NotificationCountContext);
  if (!context) {
    // Return a default implementation instead of throwing an error
    // This prevents crashes during initialization
    return {
      unreadCount: 0,
      isLoading: false,
      refreshNotificationCount: async () => {},
    };
  }
  return context;
};
