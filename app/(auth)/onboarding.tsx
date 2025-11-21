import { PoppinsText } from '@/components/PoppinsText';
import { Storage } from '@/utils/storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, NativeScrollEvent, NativeSyntheticEvent, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  interpolate,
  scrollTo,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

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
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const autoPlayInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAutoPlayActive = useRef(true);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Auto-play functionality
  const startAutoPlay = React.useCallback(() => {
    stopAutoPlay();
    isAutoPlayActive.current = true;
    
    autoPlayInterval.current = setInterval(() => {
      if (!isAutoPlayActive.current) return;
      
      const nextIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
      scrollTo(scrollViewRef, nextIndex * width, 0, true);
      setCurrentIndex(nextIndex);
    }, 5000);
  }, [currentIndex]);

  const stopAutoPlay = React.useCallback(() => {
    isAutoPlayActive.current = false;
    if (autoPlayInterval.current) {
      clearInterval(autoPlayInterval.current);
      autoPlayInterval.current = null;
    }
  }, []);

  // Start auto-play on mount and clean up on unmount
  React.useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  // Handle scroll events
  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
    startAutoPlay();
  };

  const onScrollBeginDrag = () => {
    stopAutoPlay();
  };

  const handleSkip = async () => {
    console.log('🔄 Skip button pressed');
    try {
      console.log('📱 Platform:', Platform.OS);
      
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected, using localStorage');
        localStorage.setItem('onboarding_completed', 'true');
        console.log('✅ localStorage updated with onboarding_completed: true');
      } else {
        console.log('📱 Native platform detected, using SecureStore');
        await Storage.setItem('onboarding_completed', 'true');
        console.log('✅ SecureStore updated with onboarding_completed: true');
      }
      
      console.log('🚀 Attempting navigation to /(auth)/signup');
      router.replace('/(auth)/signup');
      console.log('🎉 Navigation initiated to /(auth)/signup');
    } catch (error) {
      console.error('❌ Error during skip:', error);
      console.log('⚠️  Attempting fallback navigation to /(auth)/signup');
      router.replace('/(auth)/signup');
    }
  };

  const handleComplete = async () => {
    try {
      await Storage.setItem('onboarding_completed', 'true');
      router.replace({
        pathname: '/(auth)/signup',
        params: { fromOnboarding: 'true' },
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollTo(scrollViewRef, nextIndex * width, 0, true);
      setCurrentIndex(nextIndex);
      startAutoPlay();
    } else {
      // If it's the last slide, navigate to signup
      await handleComplete();
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <PoppinsText weight="medium" style={styles.skipText}>
          Skip
        </PoppinsText>
      </TouchableOpacity>

      {/* Carousel */}
      <Animated.ScrollView
        ref={scrollViewRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollBeginDrag={onScrollBeginDrag}
        style={styles.scrollView}
        contentContainerStyle={{ width: width * slides.length }}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
      >
        {slides.map((slide, index) => (
          <SlideItem
            key={slide.id}
            slide={slide}
            index={index}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>

      {/* Pagination Dots */}
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

      {/* Next / Get Started button */}
      <Animated.View entering={FadeIn.delay(500)} style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            currentIndex === slides.length - 1 && styles.getStartedButton,
          ]}
          onPress={handleNext}
        >
          <PoppinsText weight="medium" style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </PoppinsText>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

interface SlideItemProps {
  slide: Slide;
  index: number;
  scrollX: SharedValue<number>;
}

function SlideItem({ slide, index, scrollX }: SlideItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      'clamp'
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      'clamp'
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        <Image
          source={{ uri: slide.bgImage }}
          style={styles.image}
          resizeMode="cover"
          defaultSource={require('@/assets/images/LandingLogo.png')}
        />
        <View style={styles.contentBox}>
          <PoppinsText weight="bold" style={styles.title}>
            {slide.title}
          </PoppinsText>
          <PoppinsText style={styles.subTitle}>{slide.subTitle}</PoppinsText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', position: 'relative' },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
  },
  skipText: { color: '#651B55', fontSize: 16, fontWeight: '600' },
  scrollView: { 
    width: '100%',
    height: height * 0.8,
  },
  slide: { 
    width, 
    height: height * 0.8, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  image: { 
    width: '100%', 
    height: '100%', 
    position: 'absolute' 
  },
  contentBox: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
  },
  title: { 
    fontSize: 28, 
    marginBottom: 8, 
    textAlign: 'center', 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  subTitle: { 
    fontSize: 16, 
    color: '#fff', 
    textAlign: 'center', 
    paddingHorizontal: 20, 
    lineHeight: 24 
  },
  pagination: {
    position: 'absolute',
    bottom: 100,
    left: 0,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  getStartedButton: { backgroundColor: '#FF9BE9' },
  buttonText: { color: '#fff', fontSize: 16 },
});