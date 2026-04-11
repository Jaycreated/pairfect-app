import { useNotificationCount } from '@/context/NotificationCountContext';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * This component updates the notification badge count when:
 * 1. Push notifications arrive
 * 2. App comes to foreground (in case notifications were read elsewhere)
 * It's a separate component to avoid circular dependencies between contexts.
 */
export function NotificationBadgeUpdater() {
  const { refreshNotificationCount } = useNotificationCount();
  const notificationListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 BadgeUpdater: Notification received, refreshing count');
        // Refresh the badge count when a new notification arrives
        refreshNotificationCount();
      }
    );

    // Refresh count when app comes to foreground
    // (notifications might have been read on another device or via push)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 BadgeUpdater: App active, refreshing count');
        refreshNotificationCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial refresh
    refreshNotificationCount();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      subscription.remove();
    };
  }, [refreshNotificationCount]);

  // This component doesn't render anything
  return null;
}
