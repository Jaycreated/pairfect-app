import { PoppinsText } from '@/components/PoppinsText';
import { useAuth } from '@/context/AuthContext';
import { withSubscription } from '@/context/SubscriptionContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Types
type ConversationType = {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  lastMessage: string;
  time: string;
  unread: number;
};

// Mock data (dynamic apps will replace this with an API)
const MOCK_CONVERSATIONS: ConversationType[] = [
  {
    id: '1',
    user: {
      id: '2',
      name: 'Alex Johnson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60',
    },
    lastMessage: 'Hey! How are you doing?',
    time: '2h ago',
    unread: 2,
  },
  {
    id: '2',
    user: {
      id: '3',
      name: 'Jordan Smith',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop&q=60',
    },
    lastMessage: "Let's meet up this weekend!",
    time: '1d ago',
    unread: 0,
  },
];

const MessagesScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations] = useState<ConversationType[]>(MOCK_CONVERSATIONS);
  const [isLoading] = useState(false);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Later: implement backend search
  }, []);

  const renderConversation = useCallback(
    ({ item }: { item: ConversationType }) => (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/messages/${item.id}`)}
      >
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        <View style={styles.conversationContent}>
          {/* Header */}
          <View style={styles.conversationHeader}>
            <PoppinsText style={styles.userName}>{item.user.name}</PoppinsText>
            <PoppinsText style={styles.time}>{item.time}</PoppinsText>
          </View>

          {/* Last Message Preview */}
          <View style={styles.messagePreview}>
            <PoppinsText
              style={[
                styles.lastMessage,
                item.unread > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </PoppinsText>

            {/* Unread Badge */}
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <PoppinsText style={styles.unreadCount}>{item.unread}</PoppinsText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <PoppinsText style={styles.headerTitle}>Messages</PoppinsText>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#651B55" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.conversationList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, color: '#333', fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conversationList: { paddingBottom: 16 },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  conversationContent: { flex: 1, justifyContent: 'center' },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: { fontSize: 16, fontWeight: '600', color: '#333' },
  time: { fontSize: 12, color: '#999' },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: { flex: 1, fontSize: 14, color: '#666' },
  unreadMessage: { fontWeight: '600', color: '#333' },
  unreadBadge: {
    backgroundColor: '#651B55',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

// Subscription check
export default withSubscription(MessagesScreen, {
  redirectTo: '/(tabs)/subscribe',
});
