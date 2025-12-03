import { PoppinsText } from '@/components/PoppinsText';
import { useRouter } from 'expo-router';
import { Dimensions, Image, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';

  const handleGetStarted = () => {
    router.push('/onboarding');
  };

  return (
    <View className="flex-1" style={[styles.container, { backgroundColor: '#1A1A2E' }]}>
      <View className="absolute top-0 w-full h-1/2 bg-[#651B55] rounded-b-3xl" />
      
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-64 h-64 mb-10 bg-white rounded-3xl shadow-2xl items-center justify-center" 
          style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/LandingLogo.png')}
            className="w-40 h-40"
            resizeMode="contain"
          />
        </View>
        
        <View className="items-center mb-12">
          <PoppinsText 
            weight="bold" 
            className="text-4xl text-center mb-3 text-white" 
            style={{ fontSize: 36 }}
          >
            Welcome to
          </PoppinsText>
          <PoppinsText 
            weight="bold" 
            className="text-4xl text-center mb-6 text-[#FF9BE9]"
            style={{ fontSize: 36 }}
          >
            Pairfect
          </PoppinsText>
          <PoppinsText 
            className="text-lg text-center text-gray-300 px-4"
            style={{ fontSize: 16, lineHeight: 24 }}
          >
            Swipe right to find your perfect match and start meaningful connections
          </PoppinsText>
        </View>
        
        <TouchableOpacity 
          className="w-full py-5 rounded-2xl items-center justify-center"
          style={[styles.button, { backgroundColor: '#FF9BE9' }]}
          onPress={handleGetStarted}
          activeOpacity={0.9}
        >
          <PoppinsText className="text-lg font-bold" style={{ color: '#1A1A2E', fontSize: 18 }}>
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
    justifyContent: 'center',
  },
  logoContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  button: {
    shadowColor: '#FF9BE9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
});
