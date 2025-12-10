import { Platform } from 'react-native';
import PushNotification, { PushNotification as PushNotificationType } from 'react-native-push-notification';
import { api } from './api';

// Type definitions for push notification token
interface PushNotificationToken {
  os: string;
  token: string;
  [key: string]: any;
}

// Type definitions for push notification
interface PushNotificationObject extends PushNotificationType {
  finish?: (result: string) => void;
  [key: string]: any;
}

// Configure push notifications
PushNotification.configure({
  // Called when token is generated
  onRegister: async function (token: PushNotificationToken): Promise<void> {
    console.log('TOKEN:', token);
    // Send the token to your backend
    try {
      await api.post('/notifications/register', { token: token.token });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  },

  // Called when a notification is received
  onNotification: function (notification: PushNotificationObject): void {
    console.log('NOTIFICATION:', notification);
    
    // Process the notification here
    // You might want to show an in-app notification or update the UI
    
    // Call the completion handler for iOS
    if (Platform.OS === 'ios' && notification.finish) {
      // Use the string literal type that matches the expected type
      notification.finish('noData');
    }
  },

  // Request permissions on iOS
  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },
  popInitialNotification: true,
  requestPermissions: Platform.OS === 'ios',
});

// Create a channel for Android
if (Platform.OS === 'android') {
  PushNotification.createChannel(
    {
      channelId: 'pairfect-messages',
      channelName: 'Pairfect Messages',
      channelDescription: 'Notifications for new messages',
      soundName: 'default',
      importance: 4, // IMPORTANCE_HIGH
      vibrate: true,
    },
    (created: boolean) => console.log(`Channel created: ${created}`)
  );
}

// Type for local notification
interface LocalNotification {
  title: string;
  message: string;
  channelId: string;
  [key: string]: any;
}

export const NotificationService = {
  // Request notification permissions
  requestPermissions: async (): Promise<void> => {
    try {
      if (Platform.OS === 'ios') {
        await PushNotification.requestPermissions();
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  },

  // Schedule a local notification
  scheduleLocalNotification: (title: string, message: string): void => {
    try {
      const notification: LocalNotification = {
        channelId: 'pairfect-messages',
        title,
        message,
        playSound: true,
        soundName: 'default',
      };
      
      PushNotification.localNotification(notification);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  },

  // Clear all notifications
  clearAllNotifications: (): void => {
    try {
      PushNotification.cancelAllLocalNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  },

  // Set application badge count
  setBadgeCount: (count: number): void => {
    try {
      if (typeof count === 'number') {
        PushNotification.setApplicationIconBadgeNumber(count);
      }
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  },

  // Reset badge count
  resetBadge: (): void => {
    try {
      PushNotification.setApplicationIconBadgeNumber(0);
    } catch (error) {
      console.error('Error resetting badge:', error);
    }
  },

  // Get initial notification (when app is opened from notification)
  getInitialNotification: (): Promise<PushNotificationObject | null> => {
    return new Promise((resolve) => {
      PushNotification.popInitialNotification((notification: PushNotificationObject) => {
        resolve(notification || null);
      });
    });
  },
};
