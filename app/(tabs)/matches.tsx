import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 240; // Fixed height of 240px
const CARD_WIDTH = (width - 40) / 2; // 16px padding on each side + 8px gap between cards

type Match = {
  id: number;
  name: string;
  age: number;
  location: string;
  photos: string[];
  matched_at: string;
  lastMessage?: string;
  unreadCount?: number;
  interest: string; // Changed from interests: string[]
};

export default function MatchesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const response = await api.getMatches();
        
        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch matches');
        }

        // Transform the API response to match our Match type
        const formattedMatches: Match[] = response.data.matches.map((match: any) => ({
          id: match.id,
          name: match.name,
          age: match.age,
          bio: match.bio,
          photos: match.photos,
          matched_at: match.matched_at,
lastMessage: '',
          unreadCount: 0,
          interest: match.interest || ''
        }));
        
        setMatches(formattedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
        showToast('Failed to load matches. Please try again later.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity 
      style={styles.matchCard}
      onPress={() => router.push(`/(tabs)/messages/${item.id}`)}
    >
      <Image 
        source={{ uri: item.photos && item.photos.length > 0 ? item.photos[0] : 'https://via.placeholder.com/150' }} 
        style={styles.cardImage} 
        resizeMode="cover"
        defaultSource={{ uri: 'https://via.placeholder.com/150' }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        start={{ x: 0, y: 0.7 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientOverlay}
      >
        <View style={styles.cardContent}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.age}>, {item.age}</Text>
        </View>
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={12} color="#fff" style={styles.locationIcon} />
          <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
        </View>
        {item.interest && (
          <View style={styles.interestsContainer}>
            <Ionicons name="heart" size={12} color="#fff" style={styles.interestIcon} />
            <Text style={styles.interestsText} numberOfLines={1}>
              {item.interest}
            </Text>
          </View>
        )}
        {item.unreadCount ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {item.unreadCount > 9 ? '9+' : item.unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading matches...</Text>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No matches yet</Text>
        <Text style={styles.emptySubtext}>Start swiping to find your perfect match!</Text>
      </View>
    );
  }

  // Use a fixed number of columns (2) for the grid
  const numColumns = 2;
  
  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
        key={`flatlist-${numColumns}`} // Add key to force re-render if numColumns changes
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  matchCard: {
    width: CARD_WIDTH,
    backgroundColor: '#000',
    borderRadius: 24,
    overflow: 'hidden',
    height: CARD_HEIGHT, // Fixed height of 240px
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'transparent',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,  // Increased from 16
    fontWeight: '700',
    marginRight: 6,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  age: {
    fontSize: 16,  // Increased from 14
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  interestTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  interestText: {
    fontSize: 12,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,  // Increased from 12
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  interestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  interestIcon: {
    marginRight: 4,
  },
  interestsText: {
    fontSize: 14,  // Increased from 12
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  moreInterests: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'center',
  },
  lastMessage: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#000',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
