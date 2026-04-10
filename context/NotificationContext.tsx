import { api } from '@/services/api';
import { registerForPushNotificationsAsync } from '@/utils/notifications';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type NotificationContextType = {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
};

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
  notification: null,
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const registerForPushNotifications = async () => {
      if (!user?.token) {
        setExpoPushToken(null);
        return;
      }

      try {
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          console.warn('Push registration completed without a token.');
          return;
        }

        if (!isMounted) return;
        console.log('Push token:', token);
        setExpoPushToken(token);

        try {
          await api.registerPushToken(token);
          console.log('Push token registered with backend');
        } catch (error) {
          console.error('Failed to register push token:', error);
        }
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    };

    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { url?: string };
      if (data?.url) {
        const url = data.url.startsWith('/') ? data.url : `/${data.url}`;
        router.push(url as any);
      }
    });

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.token, router]);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification }}>
      {children}
    </NotificationContext.Provider>
  );
}
