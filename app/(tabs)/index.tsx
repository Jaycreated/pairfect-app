import { PoppinsText } from '@/components/PoppinsText';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function LandingScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/swipe');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/LandingLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.textContainer}>
          <PoppinsText 
            weight="bold" 
            style={styles.title}
          >
            Welcome to Pairfect
          </PoppinsText>
          <PoppinsText 
            style={styles.subtitle}
          >
            Find your perfect match
          </PoppinsText>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <PoppinsText style={styles.buttonText}>
            Start Swiping
          </PoppinsText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#651B55',
    borderRadius: 30,
    alignItems: 'center',
    maxWidth: 280,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
