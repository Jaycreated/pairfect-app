import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
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
  bgImage: ImageSourcePropType;
}

// Import the local images
const onboarding1 = require('@/assets/images/onboarding1.png');
const onboarding2 = require('@/assets/images/onboarding2.png');
const onboarding3 = require('@/assets/images/onboarding3.png');

const slides: Slide[] = [
  {
    id: '1',
    title: 'Meet People Who Feel Right',
    subTitle: 'Forget the endless swipes, make it easy to connect with who match your vibe',
    bgImage: onboarding1,
  },
  {
    id: '2',
    title: 'Skip small talk, Meet your match',
    subTitle: 'Swipe right to like and left to pass on potential matches',
    bgImage: onboarding2,
  },
  {
    id: '3',
    title: 'You choose the vibe',
    subTitle: 'Date, chat , connect - your call, we bring the people the spark',
    bgImage: onboarding3,
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
            <View style={styles.imageContainer}>
              <Image 
                source={slide.bgImage} 
                style={styles.image} 
                resizeMode="cover"
              />
            </View>
            {renderDots()}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subTitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
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
    position: 'relative',
    margin: 0,
    padding: 0,
    width: '100%',
  },
  skipButton: {
    padding: 10,
    marginRight: 10,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#171717',
    fontWeight: '500',
    lineHeight: 24,
    fontFamily: 'Poppins_500Medium',
  },
  scrollView: {
    flexGrow: 1,
    margin: 0,
    padding: 0,
    width: width * slides.length, // Total width of all slides
  },
  slide: {
    width: width, // Each slide takes full screen width
    height: '100%',
    alignItems: 'center',
    padding: 0,
    margin: 0,
  },
  textContainer: {
    padding: 20,
    paddingHorizontal: 0,
    fontFamily: 'Poppins_500Medium',
  },
  imageContainer: {
    width: width, // Match screen width
    height: height * 0.65,
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  image: {
    width: width,
    height: '100%',
    resizeMode: 'cover',
    margin: 0,
    padding: 0,
    alignSelf: 'center',
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
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  button: {
    backgroundColor: '#651B55',
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    minWidth: 84,
    elevation: 5,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  getStartedButton: { backgroundColor: '#651B55' },
  buttonText: { color: '#fff', fontSize: 16 },
});