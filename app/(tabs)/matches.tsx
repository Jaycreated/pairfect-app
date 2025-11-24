import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 16px padding on each side + 16px gap between cards

type Match = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  lastMessage?: string;
  unreadCount?: number;
  timestamp?: string;
  interests?: string[];
};

export default function MatchesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Replace with actual API call to fetch matches
  useEffect(() => {
    // Simulate API call
    const fetchMatches = async () => {
      try {
        // This is mock data - replace with actual API call
        const mockMatches: Match[] = [
          {
            id: '1',
            name: 'Alex Johnson',
            age: 28,
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            lastMessage: 'Hey! How are you?',
            unreadCount: 2,
            timestamp: '10m ago',
            interests: ['Hiking', 'Photography', 'Travel']
          },
          {
            id: '2',
            name: 'Jordan Smith',
            age: 31,
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            lastMessage: 'Let\'s meet up this weekend!',
            timestamp: '2h ago',
            interests: ['Cooking', 'Yoga', 'Reading']
          },
          {
            id: '3',
            name: 'Taylor Wilson',
            age: 25,
            avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
            lastMessage: 'Are you free tomorrow?',
            unreadCount: 1,
            timestamp: '5h ago',
            interests: ['Music', 'Dancing', 'Art']
          },
          {
            id: '4',
            name: 'Casey Brown',
            age: 29,
            avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
            lastMessage: 'Great seeing you yesterday!',
            timestamp: '1d ago',
            interests: ['Gaming', 'Movies', 'Basketball']
          },
        ];
        
        setMatches(mockMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity 
      style={styles.matchCard}
      onPress={() => router.push(`/messages/${item.id}`)}
    >
      <Image 
        source={{ uri: item.avatar }} 
        style={styles.cardImage} 
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.age}>{item.age}</Text>
        </View>
        {item.interests && item.interests.length > 0 && (
          <View style={styles.interestsContainer}>
            <View style={styles.interestTag}>
              <Text style={styles.interestText} numberOfLines={1}>
                {item.interests[0]}
              </Text>
            </View>
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
        keyExtractor={(item) => item.id}
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
    fontSize: 10,
    color: '#555',
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
