import { registerForPushNotificationsAsync } from '@/utils/notifications';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

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
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const router = useRouter();

  useEffect(() => {
    // Register for push notifications
    const registerForPushNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('Push token:', token);
          setExpoPushToken(token);
          // Here you would typically send the token to your backend
          // await savePushTokenToBackend(token);
        }
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    };

    registerForPushNotifications();

    // This listener is called when a notification is received while the app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      // You can add custom handling for foreground notifications here
      console.log('Notification received:', notification);
    });

    // This listener is called when a user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { url?: string };
      if (data?.url) {
        // Use the correct type for navigation
        const url = data.url.startsWith('/') ? data.url : `/${data.url}`;
        router.push(url as any);
      }
    });

    return () => {
      // Clean up listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification }}>
      {children}
    </NotificationContext.Provider>
  );
}
