import { useNotificationCount } from '@/context/NotificationCountContext';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type HeaderProps = {
  showNotification?: boolean;
  onNotificationPress?: () => void;
};

export const Header = ({ showNotification = true, onNotificationPress }: HeaderProps) => {
  const { unreadCount } = useNotificationCount();

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/LandingLogo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      {showNotification && (
        <TouchableOpacity
          style={styles.notificationIcon}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <View style={styles.notificationIconInner}>
            <Ionicons name="notifications" size={24} color="#651B55" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 0,
    boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 5,
    backgroundColor: '#fff',
    height: 80,
  },
  logo: {
    width: 70,
    height: 30,
  },
  notificationIcon: {
    padding: 8,
  },
  notificationIconInner: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
