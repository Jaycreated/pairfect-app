import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 16px padding on each side + 16px gap between cards

type Match = {
  id: number;
  name: string;
  age: number;
  bio: string | null;
  photos: string[];
  matched_at: string;
  lastMessage?: string;
  unreadCount?: number;
  interests?: string[];
};

export default function MatchesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
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
          // Add some default values for the UI
          lastMessage: '',
          unreadCount: 0,
          interests: []
        }));
        
        setMatches(formattedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
        Alert.alert('Error', 'Failed to load matches. Please try again later.');
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
      <View style={styles.cardContent}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.age}>{item.age}</Text>
        </View>
        {item.bio && (
          <View style={styles.interestsContainer}>
            <Text style={styles.bioText} numberOfLines={2}>
              {item.bio}
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
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 6,
    flexShrink: 1,
  },
  age: {
    fontSize: 14,
    color: '#666',
  },
  interestsContainer: {
    marginBottom: 6,
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
  bioText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    lineHeight: 16,
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
