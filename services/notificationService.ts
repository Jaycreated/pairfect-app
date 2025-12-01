import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { api } from './api';

// Configure push notifications
PushNotification.configure({
  // Called when token is generated
  onRegister: async function (token) {
    console.log('TOKEN:', token);
    // Send the token to your backend
    try {
      await api.post('/notifications/register', { token: token.token });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  },

  // Called when a notification is received
  onNotification: function (notification) {
    console.log('NOTIFICATION:', notification);
    // Handle the notification
    
    // Call the completion handler for iOS
    if (Platform.OS === 'ios') {
      notification.finish(PushNotificationIOS.FetchResult.NoData);
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
PushNotification.createChannel(
  {
    channelId: 'pairfect-messages',
    channelName: 'Pairfect Messages',
    channelDescription: 'Notifications for new messages',
    soundName: 'default',
    importance: 4, // IMPORTANCE_HIGH
    vibrate: true,
  },
  (created) => console.log(`Channel created: ${created}`)
);

export const NotificationService = {
  // Request notification permissions
  requestPermissions: async () => {
    if (Platform.OS === 'ios') {
      await PushNotification.requestPermissions();
    }
  },

  // Schedule a local notification
  scheduleLocalNotification: (title: string, message: string) => {
    PushNotification.localNotification({
      channelId: 'pairfect-messages',
      title: title,
      message: message,
    });
  },

  // Clear all notifications
  clearAllNotifications: () => {
    PushNotification.cancelAllLocalNotifications();
  },

  // Set application badge count
  setBadgeCount: (count: number) => {
    PushNotification.setApplicationIconBadgeNumber(count);
  },

  // Reset badge count
  resetBadge: () => {
    PushNotification.setApplicationIconBadgeNumber(0);
  },
};
