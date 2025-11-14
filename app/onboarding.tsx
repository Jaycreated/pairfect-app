import React, { useRef, useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Swiper from 'react-native-swiper';
import { PoppinsText } from '@/components/PoppinsText';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to Pairfect',
    description: 'Find your perfect match with our smart matching algorithm',
    image: { uri: 'https://placehold.co/400x400/651B55/FFFFFF/png?text=Welcome' },
  },
  {
    id: '2',
    title: 'Swipe & Match',
    description: 'Swipe right to like and left to pass on potential matches',
    image: { uri: 'https://placehold.co/400x400/FF9BE9/333333/png?text=Swipe' },
  },
  {
    id: '3',
    title: 'Start Chatting',
    description: 'Connect with your matches and start meaningful conversations',
    image: { uri: 'https://placehold.co/400x400/FFDEF8/333333/png?text=Chat' },
  },
  {
    id: '4',
    title: 'Get Started',
    description: 'Begin your journey to find your perfect match',
    image: { uri: 'https://placehold.co/400x400/651B55/FFFFFF/png?text=Get+Started' },
  },
];

export default function OnboardingScreen() {
  const swiperRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoSwipe, setAutoSwipe] = useState(true);

  useEffect(() => {
    if (!autoSwipe) return;

    const timer = setInterval(() => {
      if (currentIndex < slides.length - 1) {
        swiperRef.current?.scrollBy(1);
        setCurrentIndex(prev => prev + 1);
      } else {
        clearInterval(timer);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, autoSwipe]);

  const handleSkip = async () => {
    try {
      // Mark onboarding as completed when skipping
      await SecureStore.setItemAsync('onboarding_completed', 'true');
      // Use the correct navigation method for group routes
      router.replace({
        pathname: '/(auth)/signup',
        params: { fromOnboarding: 'true' }
      });
    } catch (error) {
      console.error('Error during skip:', error);
    }
  };

  const handleComplete = async () => {
    try {
      // Mark onboarding as completed
      await SecureStore.setItemAsync('onboarding_completed', 'true');
      // Use the correct navigation method for group routes
      router.replace({
        pathname: '/(auth)/signup',
        params: { fromOnboarding: 'true' }
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleNext = () => {
    if (swiperRef.current) {
      swiperRef.current.scrollBy(1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip Button (Top Right) */}
      <TouchableOpacity 
        style={styles.skipButton}
        onPress={handleSkip}
      >
        <PoppinsText weight="medium" style={styles.skipText}>
          Skip
        </PoppinsText>
      </TouchableOpacity>

      {/* Swiper */}
      <Swiper
        loop={false}
        ref={swiperRef}
        showsButtons={false}
        removeClippedSubviews={false}
        paginationStyle={styles.pagination}
        onIndexChanged={(index) => setCurrentIndex(index)}
        onTouchStart={() => setAutoSwipe(false)}
      >
        {slides.map((slide, index) => (
          <View 
            key={slide.id} 
            style={[
              styles.slide, 
              { backgroundColor: slide.backgroundColor }
            ]}
          >
            <View style={styles.slideContent}>
              <Image 
                source={slide.image} 
                style={styles.image} 
                resizeMode="contain"
              />
              <PoppinsText 
                weight="bold" 
                style={[styles.title, { color: slide.textColor }]}
              >
                {slide.title}
              </PoppinsText>
              <PoppinsText 
                style={[styles.description, { color: slide.textColor, opacity: 0.8 }]}
              >
                {slide.description}
              </PoppinsText>
              
              {index === slides.length - 1 && (
                <TouchableOpacity 
                  style={[styles.getStartedButton, { backgroundColor: slide.textColor }]}
                  onPress={handleComplete}
                >
                  <PoppinsText 
                    weight="semiBold" 
                    style={[styles.getStartedText, { color: slide.backgroundColor }]}
                  >
                    Get Started
                  </PoppinsText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </Swiper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
  },
  skipText: {
    color: '#651B55',
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
    padding: 20,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 40,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
    lineHeight: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
    margin: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  pagination: {
    bottom: 40,
  },
  getStartedButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    right: 20,
  },
  button: {
    backgroundColor: '#651B55',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
