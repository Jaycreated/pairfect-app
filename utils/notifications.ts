import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ANDROID_NOTIFICATION_CHANNEL_ID = 'chat-messages';
const DEFAULT_EXPO_PROJECT_ID =
  Constants.expoConfig?.extra?.eas?.projectId ||
  process.env.EXPO_PUBLIC_EXPO_PROJECT_ID ||
  process.env.EXPO_PUBLIC_PROJECT_ID ||
  '52cdb0e5-ce26-4188-95b1-febc3d7b744f';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  } as Notifications.NotificationBehavior),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNEL_ID, {
      name: 'Chat messages',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission was not granted.');
    return null;
  }

  try {
    const expoPushToken = await Notifications.getExpoPushTokenAsync({ projectId: DEFAULT_EXPO_PROJECT_ID });
    console.log('Push token:', expoPushToken.data);
    return expoPushToken.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

export async function schedulePushNotification(title: string, body: string, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Send immediately
  });
}

// Listen for incoming notifications when the app is in the foreground
export function setNotificationHandler(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

// Handle notification taps when the app is in the background/quit
export function setNotificationResponseHandler(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
