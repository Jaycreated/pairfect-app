import { PoppinsText } from '@/components/PoppinsText';
import { useAuth } from '@/context/AuthContext';
import { useSubscription, withSubscription } from '@/context/SubscriptionContext';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface ConversationType {
  id: string;
  user: User;
  lastMessage: string;
  time: string;
  unread: number;
}

interface ApiConversation {
  id?: string;
  _id?: string;
  participantId?: string;
  userId?: string;
  name?: string;
  avatar?: string;
  lastMessage?: {
    content?: string;
  };
  updatedAt?: string;
  unreadCount?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats timestamp to relative or absolute time
 * Examples: "Just now", "5m ago", "2h ago", "Yesterday", "Dec 1"
 */
const formatMessageTime = (timestamp: string): string => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInMs = now.getTime() - messageDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Just now (less than 1 minute)
  if (diffInMinutes < 1) {
    return 'Just now';
  }

  // Minutes ago (1-59 minutes)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  // Hours ago (1-23 hours)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  // Yesterday
  if (diffInDays === 1) {
    return 'Yesterday';
  }

  // Within a week (2-6 days ago)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // Older than a week - show date
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  
  // If different year, add year
  if (messageDate.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }

  return messageDate.toLocaleDateString('en-US', options);
};

/**
 * Transforms API response to app conversation format
 */
const transformApiConversation = (conv: ApiConversation): ConversationType => {
  return {
    id: conv.id || conv._id || '',
    user: {
      id: conv.participantId || conv.userId || '',
      name: conv.name || 'Unknown User',
      avatar: conv.avatar || 'https://via.placeholder.com/56',
    },
    lastMessage: conv.lastMessage?.content || 'No messages yet',
    time: conv.updatedAt || new Date().toISOString(),
    unread: conv.unreadCount || 0,
  };
};

// ============================================================================
// CONVERSATION ITEM COMPONENT (Memoized for performance)
// ============================================================================

interface ConversationItemProps {
  item: ConversationType;
  onPress: (id: string) => void;
}

const ConversationItem = React.memo<ConversationItemProps>(({ item, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);

  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={handlePress}
      testID={`conversation-${item.id}`}
      accessibilityLabel={`Conversation with ${item.user.name}`}
      accessibilityHint="Double tap to open conversation"
      accessibilityRole="button"
    >
      <Image
        source={{ uri: item.user.avatar }}
        style={styles.avatar}
        accessibilityLabel={`${item.user.name}'s avatar`}
      />
      
      <View style={styles.conversationContent}>
        {/* Header: Name and Time */}
        <View style={styles.conversationHeader}>
          <PoppinsText style={styles.userName} numberOfLines={1}>
            {item.user.name}
          </PoppinsText>
          <PoppinsText style={styles.time}>
            {formatMessageTime(item.time)}
          </PoppinsText>
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

          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <PoppinsText style={styles.unreadCount}>
                {item.unread > 99 ? '99+' : item.unread}
              </PoppinsText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

ConversationItem.displayName = 'ConversationItem';

// ============================================================================
// MAIN MESSAGES SCREEN COMPONENT
// ============================================================================

const MessagesScreen = () => {
  console.log('[MessagesScreen] Rendering component');

  // ========== Context Hooks ==========
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const { user } = useAuth();
  const router = useRouter();

  // ========== State ==========
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== Refs ==========
  const isMountedRef = useRef(true);
  const searchInputRef = useRef<TextInput>(null);

  console.log('[MessagesScreen] State:', {
    userLoggedIn: !!user,
    hasSubscription: !!subscription,
    conversationsCount: conversations.length,
    isLoading,
    error,
  });

  // ========== Effects ==========

  /**
   * Cleanup on unmount to prevent memory leaks
   */
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch conversations when component mounts or user changes
   */
  useEffect(() => {
    console.log('[MessagesScreen] useEffect triggered - fetching conversations');
    fetchConversations(false);
  }, [user?.id]);

  // ========== API Functions ==========

  /**
   * Fetches conversations from the API
   * @param isRefresh - Whether this is a pull-to-refresh action
   */
  const fetchConversations = async (isRefresh: boolean = false) => {
    console.log('[fetchConversations] Starting fetch, isRefresh:', isRefresh);

    if (!user?.id) {
      console.warn('[fetchConversations] No user ID, skipping fetch');
      setIsLoading(false);
      return;
    }

    try {
      // Set appropriate loading state
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);

      console.log('[fetchConversations] Making API request to /api/conversations');
      const response = await api.get<ApiConversation[]>('/api/conversations');
      
      console.log('[fetchConversations] API response received:', {
        status: response.status,
        dataLength: response.data?.length || 0,
      });

      if (!isMountedRef.current) {
        console.log('[fetchConversations] Component unmounted, aborting state update');
        return;
      }

      if (response.data && Array.isArray(response.data)) {
        console.log('[fetchConversations] Processing', response.data.length, 'conversations');
        
        const formattedConversations = response.data.map(transformApiConversation);
        
        // Sort by most recent first
        formattedConversations.sort((a, b) => 
          new Date(b.time).getTime() - new Date(a.time).getTime()
        );

        setConversations(formattedConversations);
        console.log('[fetchConversations] Conversations updated successfully');
      } else {
        console.warn('[fetchConversations] Invalid response data format');
        setConversations([]);
      }
    } catch (err) {
      console.error('[fetchConversations] Error occurred:', err);
      
      if (!isMountedRef.current) {
        console.log('[fetchConversations] Component unmounted, skipping error handling');
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[fetchConversations] Error details:', {
        message: errorMessage,
        type: err instanceof Error ? err.name : typeof err,
      });

      setError('Failed to load conversations. Please check your connection and try again.');
      
      // Show alert on refresh errors (user-initiated action)
      if (isRefresh) {
        Alert.alert(
          'Refresh Failed',
          'Could not refresh conversations. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      if (isMountedRef.current) {
        console.log('[fetchConversations] Fetch complete, updating loading states');
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  // ========== Event Handlers ==========

  /**
   * Handles search input changes
   */
  const handleSearch = useCallback((query: string) => {
    console.log('[handleSearch] Search query:', query);
    setSearchQuery(query);
  }, []);

  /**
   * Handles conversation item press - navigates to chat
   */
  const handleConversationPress = useCallback((conversationId: string) => {
    console.log('[handleConversationPress] Opening conversation:', conversationId);
    router.push(`/messages/${conversationId}`);
  }, [router]);

  /**
   * Handles pull-to-refresh
   */
  const handleRefresh = useCallback(() => {
    console.log('[handleRefresh] User initiated refresh');
    fetchConversations(true);
  }, [user?.id]);

  /**
   * Handles retry button press
   */
  const handleRetry = useCallback(() => {
    console.log('[handleRetry] User clicked retry');
    fetchConversations(false);
  }, [user?.id]);

  // ========== Computed Values ==========

  /**
   * Filters conversations based on search query
   * Searches in: user name and last message content
   */
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    const query = searchQuery.toLowerCase().trim();
    console.log('[filteredConversations] Filtering with query:', query);

    return conversations.filter(conv => {
      const nameMatch = conv.user.name.toLowerCase().includes(query);
      const messageMatch = conv.lastMessage.toLowerCase().includes(query);
      return nameMatch || messageMatch;
    });
  }, [conversations, searchQuery]);

  // ========== Render Functions ==========

  /**
   * Renders individual conversation item
   */
  const renderConversation = useCallback(({ item }: { item: ConversationType }) => {
    return <ConversationItem item={item} onPress={handleConversationPress} />;
  }, [handleConversationPress]);

  /**
   * Renders empty state when no conversations exist
   */
  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return null;
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
        <PoppinsText style={styles.emptyStateText}>
          {searchQuery
            ? `No conversations found for "${searchQuery}"`
            : 'No conversations yet.\nStart chatting to see your messages here!'}
        </PoppinsText>
      </View>
    );
  }, [isLoading, searchQuery]);

  /**
   * Key extractor for FlatList
   */
  const keyExtractor = useCallback((item: ConversationType) => item.id, []);

  // ========== Loading States ==========

  /**
   * Show loading spinner while checking subscription or loading initial data
   */
  if (isSubscriptionLoading || (isLoading && !isRefreshing)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#651B55" />
        <PoppinsText style={styles.loadingText}>Loading conversations...</PoppinsText>
      </View>
    );
  }

  /**
   * Show error state with retry button
   */
  if (error && conversations.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={80} color="#ff6b6b" />
        <PoppinsText style={styles.errorText}>{error}</PoppinsText>
        <TouchableOpacity
          onPress={handleRetry}
          style={styles.retryButton}
          accessibilityLabel="Retry loading conversations"
          accessibilityRole="button"
        >
          <PoppinsText style={styles.retryButtonText}>Retry</PoppinsText>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Show subscription required message
   * Note: withSubscription HOC should prevent reaching here,
   * but keeping as fallback
   */
  if (!subscription) {
    return (
      <View style={styles.subscriptionContainer}>
        <Ionicons name="lock-closed-outline" size={80} color="#651B55" />
        <PoppinsText style={styles.subscriptionTitle}>
          Subscription Required
        </PoppinsText>
        <PoppinsText style={styles.subscriptionText}>
          A subscription is required to view and send messages.
        </PoppinsText>
        <TouchableOpacity
          onPress={() => router.push('/screens/subscribe' as any)}
          style={styles.subscribeButton}
          accessibilityLabel="Subscribe now"
          accessibilityRole="button"
        >
          <PoppinsText style={styles.subscribeButtonText}>
            Subscribe Now
          </PoppinsText>
        </TouchableOpacity>
      </View>
    );
  }

  // ========== Main Render ==========

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <PoppinsText style={styles.headerTitle}>Messages</PoppinsText>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search conversations"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.conversationList,
          filteredConversations.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#651B55"
            colors={['#651B55']}
          />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
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
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#333',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#651B55',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subscriptionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  subscribeButton: {
    backgroundColor: '#651B55',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  conversationList: {
    flexGrow: 1,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#333',
  },
  unreadBadge: {
    backgroundColor: '#651B55',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

// ============================================================================
// EXPORT WITH SUBSCRIPTION PROTECTION
// ============================================================================

export default withSubscription(MessagesScreen, {
  redirectTo: '/subscribe' as any,
});