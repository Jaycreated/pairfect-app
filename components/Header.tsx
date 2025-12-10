import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

type HeaderProps = {
  showNotification?: boolean;
  onNotificationPress?: () => void;
};

export const Header = ({ showNotification = true, onNotificationPress }: HeaderProps) => {
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
            <Ionicons name="notifications" size={24} color="#333" />
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
});
