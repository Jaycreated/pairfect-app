import { PoppinsText } from '@/components/PoppinsText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.4;
const SWIPE_OUT_DURATION = 250;

// Mock user data - in a real app, this would come from an API
const MOCK_USERS = [
  {
    id: '1',
    name: 'Alex',
    age: 28,
    bio: 'Adventure seeker and coffee enthusiast. Let\'s explore the world together!',
    distance: '2 miles',
    location: 'San Francisco',
    interests: ['Hiking', 'Photography', 'Coffee', 'Travel'],
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60',
    ],
  },
  {
    id: '2',
    name: 'Jordan',
    age: 25,
    bio: 'Foodie and travel lover. Looking for someone to try new restaurants with!',
    distance: '3 miles',
    location: 'San Francisco',
    interests: ['Foodie', 'Travel', 'Yoga', 'Reading'],
    images: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60',
    ],
  },
  {
    id: '3',
    name: 'Taylor',
    age: 30,
    bio: 'Bookworm and movie buff. Let\'s have deep conversations over coffee!',
    distance: '5 miles',
    location: 'Oakland',
    interests: ['Reading', 'Movies', 'Coffee', 'Hiking'],
    images: [
      'https://images.unsplash.com/photo-1508214758996-8f69e5a71da5?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60',
    ],
  },
];

type User = typeof MOCK_USERS[0];

const SwipeScreen = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx, dy }) => {
        position.setValue({ x: dx, y: dy });
      },
      onPanResponderRelease: (_, { dx, dy }) => {
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          // Swipe right (like) or left (nope)
          const direction = dx > 0 ? 1 : -1;
          swipeCard(direction);
        } else {
          // Return to original position
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const swipeCard = useCallback((direction: number) => {
    // Animate card off screen
    Animated.timing(position, {
      toValue: { 
        x: direction * (width + 100), 
        y: direction * 100 
      },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      // After animation completes, move to next card
      const isLastCard = currentIndex >= users.length - 1;
      if (isLastCard) {
        // Reset to first user if we've reached the end
        setCurrentIndex(0);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
      position.setValue({ x: 0, y: 0 });

      // In a real app, you would send this to your backend
      if (direction > 0) {
        console.log('Liked:', users[currentIndex]?.name);
        // Show match alert for the first swipe as an example
        if (currentIndex === 0) {
          Alert.alert('It\'s a match!', `You and ${users[0]?.name} have liked each other!`);
        }
      } else {
        console.log('Disliked:', users[currentIndex]?.name);
      }
    });
  }, [currentIndex, users, position]);

  const handleCardPress = useCallback((userId: string) => {
    // Navigate to the user's public profile
    router.push(`/user/${userId}`);
  }, [router]);

  const renderCard = (user: User, index: number) => {
    if (index < currentIndex) return null;
    
    const isTopCard = index === currentIndex;
    const panResponderHandlers = isTopCard ? panResponder.panHandlers : {};
    const cardStyle = isTopCard 
      ? [
          styles.card,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate },
            ],
          },
        ]
      : styles.card;

    if (!user) return null;

    return (
      <TouchableOpacity 
        key={user.id}
        activeOpacity={0.9}
        onPress={() => handleCardPress(user.id)}
        style={{ flex: 1 }}
      >
        <Animated.View 
          style={[cardStyle, { zIndex: -index }]}
          {...panResponderHandlers}
        >
        <Image source={{ uri: user.images[0] }} style={styles.cardImage} />
        <View style={styles.cardOverlay}>
          {isTopCard && (
            <>
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
            </>
          )}
          <View style={styles.cardFooter}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <PoppinsText weight="bold" style={styles.cardName}>
                  {user.name}
                </PoppinsText>
                <PoppinsText style={styles.cardAge}>
                  , {user.age}
                </PoppinsText>
              </View>
              <View style={styles.cardLocation}>
                <Ionicons name="location-sharp" size={16} color="#FFF" style={{ marginRight: 4 }} />
                <PoppinsText style={{ fontSize: 16 }}>
                  {user.distance} • {user.location}
                </PoppinsText>
              </View>
            </View>
            {user.interests && user.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                {user.interests.slice(0, 4).map((interest, idx) => (
                  <View key={idx} style={styles.interestTag}>
                    <PoppinsText style={styles.interestText}>
                      {interest}
                    </PoppinsText>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };
  
  const handleLike = useCallback(() => {
    swipeCard(1);
  }, [swipeCard]);
  
  const handleNope = useCallback(() => {
    swipeCard(-1);
  }, [swipeCard]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <PoppinsText weight="bold" style={styles.headerTitle}>
          Discover
        </PoppinsText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.swiperContainer}>
        {users.length > 0 ? (
          users.map((user, index) => renderCard(user, index))
        ) : (
          <View style={styles.noMoreCards}>
            <PoppinsText style={styles.noMoreCardsText}>
              No more profiles to show
            </PoppinsText>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => setUsers(MOCK_USERS)}
            >
              <PoppinsText style={styles.resetButtonText}>
                Reset
              </PoppinsText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.nopeButton]}
          onPress={handleNope}
        >
          <Ionicons name="close" size={32} color="#FF3B30" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.boostButton]}
          onPress={() => console.log('Boost')}
        >
          <Ionicons name="flash" size={24} color="#9B59B6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.likeButton]}
          onPress={handleLike}
        >
          <Ionicons name="heart" size={32} color="#4CD964" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 20,
    color: '#000',
  },
  swiperContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    position: 'relative',
    backgroundColor: '#FFF',
    width: width * 0.9,
    height: height * 0.7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignSelf: 'center',
    marginTop: 20,
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
  noMoreCards: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noMoreCardsText: {
    fontSize: 18,
    color: '#666',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  likeBadge: {
    backgroundColor: '#4CD964',
    borderRadius: 20,
    padding: 8,
    opacity: 0.9,
  },
  cardFooter: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginHorizontal: -20,
    marginBottom: -20,
  },
  cardName: {
    fontSize: 32,
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardAge: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '300',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardLocation: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  button: {
    width: 60,
    height: 60,
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
    borderColor: '#FF3B30',
  },
  likeButton: {
    borderWidth: 1,
    borderColor: '#4CD964',
  },
  boostButton: {
    borderWidth: 1,
    borderColor: '#9B59B6',
  },
});

export default SwipeScreen;
