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
        >
          <Ionicons name="notifications-outline" size={24} color="#000" />
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
    paddingTop: 30,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: '#fff',
    height: 100,
  },
  logo: {
    width: 120,
    height: 30,
  },
  notificationIcon: {
    padding: 8,
  },
});
