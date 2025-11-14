import { Image, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { PoppinsText } from '@/components/PoppinsText';

export default function LandingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';

  const handleGetStarted = () => {
    router.push('/onboarding');
  };

  return (
    <View className="flex-1 justify-center items-center p-5" style={{ backgroundColor: '#651B55' }}>
      <View className="w-full max-w-md items-center">
        <Image
          source={require('@/assets/images/LandingLogo.png')}
          className="w-48 h-48 mb-8"
          resizeMode="contain"
        />
        
        <PoppinsText 
          weight="bold" 
          className="text-2xl text-center mb-3 text-[#FFDEF8]" 
          style={{ fontSize: 24 }}
        >
          Welcome to Pairfect
        </PoppinsText>
        <PoppinsText 
          className="text-lg text-center mb-8 text-[#FFDEF8]"
          style={{ fontSize: 18 }}
        >
          Smarter way to match simply
        </PoppinsText>
        
        <TouchableOpacity 
          className="w-full py-4 px-10 rounded-full items-center bg-[#FF9BE9] mb-4"
          onPress={handleGetStarted}
        >
          <PoppinsText className="text-lg font-semibold text-[#651B55]">
            Get Started
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
    alignItems: 'center',
    backgroundColor: '#651B55',
  },
});
