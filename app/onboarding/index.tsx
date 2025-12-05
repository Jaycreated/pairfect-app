import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  subTitle: string;
  bgImage: string;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Welcome to Pairfect',
    subTitle: 'Find your perfect match with our smart matching algorithm',
    bgImage: 'https://placehold.co/400x400/651B55/FFFFFF/png?text=Welcome',
  },
  {
    id: '2',
    title: 'Swipe & Match',
    subTitle: 'Swipe right to like and left to pass on potential matches',
    bgImage: 'https://placehold.co/400x400/FF9BE9/333333/png?text=Swipe',
  },
  {
    id: '3',
    title: 'Start Chatting',
    subTitle: 'Connect with your matches and start meaningful conversations',
    bgImage: 'https://placehold.co/400x400/FFDEF8/333333/png?text=Chat',
  },
  {
    id: '4',
    title: 'Get Started',
    subTitle: 'Begin your journey to find your perfect match',
    bgImage: 'https://placehold.co/400x400/651B55/FFFFFF/png?text=Get+Started',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleGetStarted = async () => {
    try {
      await SecureStore.setItemAsync('onboarding_completed', 'true');
      router.replace('/(auth)/signup');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(auth)/signup');
    }
  };

  const handleSkip = async () => {
    try {
      await SecureStore.setItemAsync('onboarding_completed', 'true');
      router.replace('/(auth)/signup');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(auth)/signup');
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const renderDots = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
        contentContainerStyle={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <Image 
              source={{ uri: slide.bgImage }} 
              style={styles.image} 
              resizeMode="contain"
            />
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subTitle}</Text>
          </View>
        ))}
      </ScrollView>

      {renderDots()}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            currentIndex === slides.length - 1 && styles.getStartedButton,
          ]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    position: 'relative' 
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flexGrow: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 30,
  },
  pagination: {
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    zIndex: 10,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  paginationDotActive: {
    width: 30,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
    backgroundColor: '#651B55',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  buttonContainer: { 
    position: 'absolute', 
    bottom: 40, 
    left: 0, 
    right: 0, 
    alignItems: 'center', 
    padding: 20 
  },
  button: {
    backgroundColor: '#651B55',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  getStartedButton: { backgroundColor: '#FF9BE9' },
  buttonText: { color: '#fff', fontSize: 16 },
});