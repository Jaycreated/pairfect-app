import { PoppinsText } from '@/components/PoppinsText';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, Modal, PanResponder, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.4;
const SWIPE_OUT_DURATION = 150;

// Responsive dimensions
const CARD_HEIGHT = Math.min(height * 0.5, 320);  // 50% of screen or max 320
const CARD_WIDTH = Math.min(width * 0.85, 320);    // 85% of screen or max 320

// Default profile icon component for users without photos
const DefaultProfileIcon = ({ size = 50 }: { size?: number }) => (
  <View style={[styles.defaultAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Ionicons name="person" size={size * 0.6} color="#fff" />
  </View>
);

type User = {
  id: string;
  name: string;
  age: number;
  bio: string;
  distance: string;
  location: string;
  interest: string;
  images: string[];
};

const SwipeScreen = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const { showToast } = useToast();
  
  // Use ref to track users array for immediate access in callbacks
  const usersRef = useRef<User[]>([]);
  const currentIndexRef = useRef(0);
  
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp',
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchPotentialMatches();
  }, []);

const fetchPotentialMatches = async () => {
  try {
    setLoading(true);
    setError(null);
    console.log('Fetching potential matches...');
    const matches = await api.getPotentialMatches();
    console.log('Received matches:', matches);
    
    // Keep users as they come - don't filter out or modify images
    const validUsers = matches;
    
    console.log('Valid users after mapping:', validUsers.length);
    
    if (validUsers.length === 0) {
      setError('No profiles available at the moment. Please check back later.');
      setUsers([]);
      usersRef.current = [];
    } else {
      setUsers(validUsers);
      usersRef.current = validUsers;
      setCurrentIndex(0);
      currentIndexRef.current = 0;
    }
  } catch (err) {
    console.error('Error fetching matches:', err);
    setError('Failed to load profiles. Please try again.');
    setUsers([]);
    usersRef.current = [];
  } finally {
    setLoading(false);
  }
};

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isProcessingSwipe,
      onPanResponderMove: (_, { dx, dy }) => {
        if (!isProcessingSwipe) {
          position.setValue({ x: dx, y: dy });
        }
      },
      onPanResponderRelease: (_, { dx, dy }) => {
        if (isProcessingSwipe) return;
        
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          const direction = dx > 0 ? 1 : -1;
          swipeCard(direction);
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  type SwipeResponse = {
    data?: {
      match?: boolean | {
        id: number;
        user_id: number;
        target_user_id: number;
        action: string;
        created_at: string;
        is_mutual?: boolean;
      };
      success?: boolean;
    };
    error?: string | {
      message: string;
      status?: number;
      code?: string;
    };
  };

  const swipeCard = useCallback(async (direction: number) => {
    // Use refs for immediate access to current state
    const currentUsers = usersRef.current;
    const currentIdx = currentIndexRef.current;
    
    // Add extra validation
    if (isProcessingSwipe) {
      console.log('Swipe prevented - already processing');
      return;
    }
    
    if (currentIdx >= currentUsers.length || currentUsers.length === 0) {
      console.log('Swipe prevented - no users available', {
        currentIndex: currentIdx,
        usersLength: currentUsers.length
      });
      return;
    }
    
    setIsProcessingSwipe(true);
    const currentUser = currentUsers[currentIdx];
    const isLike = direction > 0;
    const nextIndex = currentIdx + 1;
    const isLastCard = nextIndex >= currentUsers.length;

    console.log('Starting swipe action:', {
      action: isLike ? 'like' : 'pass',
      userId: currentUser.id,
      userName: currentUser.name,
      currentIndex: currentIdx,
      nextIndex,
      totalUsers: currentUsers.length,
      isLastCard
    });

    // Start animation immediately (optimistic UI)
    Animated.timing(position, {
      toValue: { 
        x: direction * (width + 100), 
        y: direction * 100 
      },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      // Reset position immediately for next card
      position.setValue({ x: 0, y: 0 });
      
      if (isLastCard) {
        console.log('Last card - fetching more matches');
        // Reset to show loading state
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        setUsers([]);
        usersRef.current = [];
        setIsProcessingSwipe(false);
        // Fetch new matches
        fetchPotentialMatches();
      } else {
        console.log('Moving to next card:', nextIndex);
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        setIsProcessingSwipe(false);
      }
    });

    // Make API call in parallel (non-blocking)
    try {
      console.log(`Sending ${isLike ? 'like' : 'pass'} for user:`, currentUser.id);
      
      const response: SwipeResponse = isLike 
        ? await api.likeUser(currentUser.id)
        : await api.passUser(currentUser.id);
      
      console.log('API Response:', JSON.stringify(response, null, 2));
      
      if (response.error) {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error.message || 'Unknown error';
        
        console.error(`Error ${isLike ? 'liking' : 'passing'} user:`, errorMessage);
        showToast(`Failed to ${isLike ? 'like' : 'pass'} user: ${errorMessage}`, 'error', 3000);
        return;
      }
      
      console.log(`${isLike ? 'Liked' : 'Passed'}:`, currentUser.name, 'Match data:', response.data);
      
      // Check if it's a mutual match
      // The API returns both 'matched': boolean and match object
      if (isLike && response.data) {
        const isMutualMatch = (response.data as any).matched === true;
        
        if (isMutualMatch) {
          console.log('Mutual match found with:', currentUser.name);
          setMatchedUser(currentUser);
          setMatchModalVisible(true);
        } else {
          console.log('Like registered, but no mutual match yet with:', currentUser.name);
        }
      }
      
    } catch (err) {
      console.error('Error processing swipe:', err);
      showToast('An error occurred while processing your action. Please try again.', 'error', 3000);
    }
  }, [isProcessingSwipe, showToast, position]);

  const handleCardPress = useCallback((userId: string) => {
    if (!isProcessingSwipe) {
      router.push(`/user/${userId}`);
    }
  }, [router, isProcessingSwipe]);

  const renderCard = (user: User) => {
    if (!user) return null;

    const panResponderHandlers = panResponder.panHandlers;
    const cardStyle = [
      styles.card,
      {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate },
        ],
      },
    ];

    // Check if user has images and render accordingly
    const hasImage = user.images && user.images.length > 0 && user.images[0];
    
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          key={user.id}
          activeOpacity={0.9}
          onPress={() => handleCardPress(user.id)}
          style={{ flex: 1 }}
          disabled={isProcessingSwipe}
        >
          <Animated.View 
            style={cardStyle}
            {...panResponderHandlers}
          >
            {hasImage ? (
              <Image 
                source={{ uri: user.images[0] }} 
                style={styles.cardImage}
              />
            ) : (
              <View style={[styles.cardImage, styles.defaultProfileImageContainer]}>
                <DefaultProfileIcon size={120} />
              </View>
            )}
            <View style={styles.cardOverlay}>
              <Animated.View 
                style={[styles.likeBadgeContainer, { opacity: likeOpacity }]}
              >
                <Text style={styles.likeText}>LIKE</Text>
              </Animated.View>
              <Animated.View 
                style={[styles.nopeBadgeContainer, { opacity: nopeOpacity }]}
              >
                <Text style={styles.nopeText}>NOPE</Text>
              </Animated.View>
            </View>
          </Animated.View>
          
          <View style={styles.cardFooter}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <PoppinsText weight="bold" style={styles.cardName}>
                  {user.name}
                </PoppinsText>
                {user.age > 0 && (
                  <PoppinsText style={styles.cardAge}>
                    , {user.age}
                  </PoppinsText>
                )}
              </View>
              {user.location && (
                <View style={styles.cardLocation}>
                  <Ionicons name="location-sharp" size={16} color="#651B55" style={{ marginRight: 4 }} />
                  <PoppinsText style={{ fontSize: 16 }}>
                    {user.location}
                  </PoppinsText>
                </View>
              )}
            </View>
            {user.interest && (
              <View>
                <PoppinsText style={styles.interestText}>
                  <Text style={styles.interestsText}>Interest: {user.interest}</Text>
                </PoppinsText>
              </View>
            )}
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.nopeButton]}
              onPress={handleNope}
              disabled={isProcessingSwipe}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          
            <TouchableOpacity
              style={[styles.button, styles.likeButton]}
              onPress={handleLike}
              disabled={isProcessingSwipe}
            >
              <Ionicons name="heart" size={24} color="#FF0A0A" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  const handleLike = useCallback(() => {
    console.log('Like button pressed');
    swipeCard(1);
  }, [swipeCard]);
  
  const handleNope = useCallback(() => {
    console.log('Nope button pressed');
    swipeCard(-1);
  }, [swipeCard]);

  const handleMessageMatch = useCallback(() => {
    if (matchedUser) {
      setMatchModalVisible(false);
      // Navigate to the messages screen with the matched user
      router.push(`/messages/${matchedUser.id}`);
    }
  }, [matchedUser, router]);

  const renderMatchModal = () => {
    if (!matchedUser) return null;

    // Check if matched user has images
    const hasMatchImage = matchedUser.images && matchedUser.images.length > 0 && matchedUser.images[0];

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={matchModalVisible}
        onRequestClose={() => setMatchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.matchModalContainer}>
            {/* Matched User Image */}
            {hasMatchImage ? (
              <Image
                source={{ uri: matchedUser.images[0] }}
                style={styles.matchModalImage}
              />
            ) : (
              <View style={[styles.matchModalImage, styles.defaultProfileImageContainer]}>
                <DefaultProfileIcon size={100} />
              </View>
            )}

            {/* Match Text */}
            <View style={styles.matchContent}>
              <PoppinsText weight="bold" style={styles.matchTitle}>
                It's a Match!
              </PoppinsText>
              <PoppinsText style={styles.matchSubtitle}>
                You and {matchedUser.name} have liked each other!
              </PoppinsText>
            </View>

            {/* Action Buttons */}
            <View style={styles.matchButtonContainer}>
              <TouchableOpacity
                style={styles.matchMessageButton}
                onPress={handleMessageMatch}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <PoppinsText weight="bold" style={styles.matchMessageButtonText}>
                  Send Message
                </PoppinsText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.matchContinueButton}
                onPress={() => setMatchModalVisible(false)}
              >
                <PoppinsText weight="bold" style={styles.matchContinueButtonText}>
                  Keep Swiping
                </PoppinsText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#651B55" />
        <PoppinsText style={styles.loadingText}>Loading profiles...</PoppinsText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={64} color="#E03131" />
        <PoppinsText style={styles.errorText}>{error}</PoppinsText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchPotentialMatches}
        >
          <PoppinsText style={styles.retryButtonText}>Retry</PoppinsText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity> */}
        <View style={styles.headerTextContainer}>
          <PoppinsText weight="bold" style={styles.headerTitle}>
            <Text>Discover people around you</Text>
          </PoppinsText>
          <PoppinsText style={styles.subtitle}>
            <Text>Keep swiping to meet your match</Text>
          </PoppinsText>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.swiperContainer}>
          {users.length > 0 && currentIndex < users.length ? (
            renderCard(users[currentIndex])
          ) : (
            <View style={styles.noMoreCards}>
              <Ionicons name="people-outline" size={64} color="#666" />
              <PoppinsText style={styles.noMoreCardsText}>
                No more profiles to show
              </PoppinsText>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={fetchPotentialMatches}
              >
                <PoppinsText style={styles.resetButtonText}>
                  Refresh
                </PoppinsText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {renderMatchModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 120, // Extra padding for tab bar (92px + buffer)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: '#000',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  headerTextContainer: {
    alignItems: 'center',
    flex: 1,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  swiperContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 0,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
    padding: 8,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  likeBadgeContainer: {
    position: 'absolute',
    top: 40,
    left: 40,
    borderWidth: 3,
    borderColor: '#4CD964',
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: '-15deg' }],
  },
  nopeBadgeContainer: {
    position: 'absolute',
    top: 40,
    right: 40,
    borderWidth: 3,
    borderColor: '#FF3B30',
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    color: '#4CD964',
    fontSize: 32,
    fontWeight: 'bold',
  },
  nopeText: {
    color: '#FF3B30',
    fontSize: 32,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#E03131',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#651B55',
    padding: 15,
    borderRadius: 10,
    width: 150,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noMoreCards: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noMoreCardsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#651B55',
    padding: 15,
    borderRadius: 10,
    width: 150,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    paddingTop: 12,
    paddingRight: 20,
    paddingLeft: 20,
    marginHorizontal: -20,
  },
  cardName: {
    fontSize: 24,
    color: '#651B55',
    marginBottom: 0,  // Removed to reduce gap
    fontWeight: '600',
  },
  cardAge: {
    fontSize: 24,
    color: '#651B55',
    fontWeight: '600',
  },
  cardLocation: {
    fontSize: 16,
    color: '#651B55',
    marginBottom: 0,  // Removed to reduce gap
    flexDirection: 'row',

    alignItems: 'center',
  },
  interestText: {
    color: '#651B55',
    fontSize: 12,
    fontWeight: '500',
  },
  interestsText: {
    color: '#651B55',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    padding: 10,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nopeButton: {
    borderWidth: 1,
    borderColor: '#E03131',
    backgroundColor: '#E03131',
  },
  likeButton: {
    borderWidth: 1,
    borderColor: '#FFCFF4',
    backgroundColor: '#FFCFF4',
  },
  // Match Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  matchModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 0,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  matchModalImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  matchHeader: {
    backgroundColor: '#FF1B6D',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchContent: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  matchTitle: {
    fontSize: 28,
    color: '#FF1B6D',
    marginBottom: 8,
    textAlign: 'center',
  },
  matchSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  matchButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  matchMessageButton: {
    backgroundColor: '#FF1B6D',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF1B6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  matchMessageButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  matchContinueButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF1B6D',
  },
  matchContinueButtonText: {
    color: '#FF1B6D',
    fontSize: 16,
  },
  defaultAvatar: {
    backgroundColor: '#651B55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultProfileImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
});

export default SwipeScreen;