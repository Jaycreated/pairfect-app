import { PoppinsText } from '@/components/PoppinsText';
import { useAuth } from '@/context/AuthContext';
import { useSubscription, withSubscription } from '@/context/SubscriptionContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

/** ------------------ TYPES ------------------ **/
export type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isSending?: boolean;
  isError?: boolean;
};

/** ------------------ TYPES ------------------ **/
interface ChatUser {
  id: string;
  name: string;
  avatar: string;
}

/** ------------------ CHAT SCREEN ------------------ **/
const ChatScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const { socket, emit, on, off } = useWebSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Fetch initial messages and chat user data
  useEffect(() => {
    console.log('ChatScreen: useEffect - Loading chat data for ID:', id);
    
    const loadChatData = async () => {
      console.log('loadChatData: Starting to load chat data');
      try {
        setIsLoading(true);
        
        // Load messages from API
        console.log('loadChatData: Fetching messages from API');
        const messagesResponse = await api.getMessages(id as string);
        console.log('loadChatData: API response:', messagesResponse);
        
        if (messagesResponse?.data) {
          const formattedMessages = Array.isArray(messagesResponse.data) 
            ? messagesResponse.data.map((msg: any) => ({
                id: msg.id || `msg-${Date.now()}`,
                text: msg.content || msg.text || '',
                senderId: msg.senderId || '',
                timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              }))
            : [];
          
          console.log('loadChatData: Formatted messages:', formattedMessages);
          setMessages(formattedMessages);
          
          // Scroll to bottom after messages are loaded
          setTimeout(() => {
            console.log('loadChatData: Scrolling to bottom');
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } else {
          console.log('loadChatData: No messages data in response');
        }

        // For now, use a temporary user object
        // In a real app, you would fetch this from your API
        const tempUser = {
          id: id as string,
          name: 'Chat User',
          avatar: 'https://via.placeholder.com/40'
        };
        console.log('loadChatData: Setting temporary user:', tempUser);
        setChatUser(tempUser);
        
      } catch (error) {
        console.error('loadChatData: Failed to load chat data:', error);
        Alert.alert('Error', 'Failed to load chat. Please try again later.');
      } finally {
        console.log('loadChatData: Finished loading, setting isLoading to false');
        setIsLoading(false);
      }
    };

    loadChatData();
  }, [id]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    console.log('WebSocket effect running, socket:', socket ? 'connected' : 'not connected');
    if (!socket) {
      const error = 'No WebSocket connection available';
      console.error(error);
      Alert.alert('Connection Error', error);
      return;
    }
    
    console.log('WebSocket: Setting up message handlers');

    const handleNewMessage = (message: any) => {
    console.log('Received message:', message);
      console.log('New message received:', message);
      
      // Check if this message is for the current chat
      if (message.matchId === id || message.chatId === id) {
        const newMsg: ChatMessage = {
          id: message.id || `msg-${Date.now()}`,
          text: message.content || message.text || '',
          senderId: message.senderId || '',
          timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
        };
        
        setMessages(prev => {
          // Check if message already exists (for deduplication)
          const exists = prev.some(m => m.id === newMsg.id);
          return exists ? prev : [...prev, newMsg];
        });

        // Scroll to bottom when new message arrives
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    // Set up error handling
    const handleError = (error: any) => {
    console.error('WebSocket error occurred:', error);
      console.error('WebSocket error:', error);
      Alert.alert('Connection Error', 'There was a problem with the chat connection.');
    };

    // Set up event listeners first
    console.log('Setting up WebSocket event listeners');
    on('newMessage', handleNewMessage);
    on('error', handleError);
    
    // Then join the chat room
    console.log('Joining chat room:', id);
    const joinSuccess = emit('joinChat', { matchId: id });
    console.log('joinChat emit result:', joinSuccess);

    // Clean up
    return () => {
      console.log('Cleaning up WebSocket listeners');
      off('newMessage');
      off('error');
      const leaveSuccess = emit('leaveChat', { matchId: id });
      console.log('leaveChat emit result:', leaveSuccess);
    };
  }, [socket, id, on, off, emit]);

  const handleSend = useCallback(async () => {

    const tempId = `temp-${Date.now()}`;
    const messageToSend: ChatMessage = {
      id: tempId,
      text: newMessage,
      senderId: user?.id?.toString() || '', // Add null check with optional chaining
      timestamp: new Date(),
      isSending: true,
    };

    try {
      // Optimistically add message to UI
      setMessages(prev => [...prev, messageToSend]);
      setNewMessage('');

      // Send message via WebSocket
      const success = emit('sendMessage', {
        matchId: id,
        content: newMessage,
        timestamp: new Date().toISOString(),
      });

      if (!success) {
        throw new Error('Failed to send message');
      }

      // Update message state when sent successfully
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId ? { ...msg, isSending: false } : msg
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Update message to show error state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId ? { ...msg, isSending: false, isError: true } : msg
        )
      );
    }
  }, [newMessage, user?.id, subscription, id, emit, router]);

  /** ---- FIXED ⚠️: item now has a proper type ---- **/
  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isCurrentUser = item.senderId === user?.id?.toString();

      return (
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}
        >
          {!isCurrentUser && (
            <Image 
              source={{ uri: chatUser?.avatar || 'https://via.placeholder.com/40' }} 
              style={styles.avatar} 
            />
          )}
          <View
            style={[
              styles.messageContent,
              isCurrentUser
                ? styles.currentUserMessage
                : styles.otherUserMessage,
            ]}
          >
            <PoppinsText style={styles.messageText}>
              {item.text}
              {item.isSending && (
                <Ionicons 
                  name="time-outline" 
                  size={12} 
                  color="#666" 
                  style={{ marginLeft: 4 }} 
                />
              )}
              {item.isError && (
                <Ionicons 
                  name="alert-circle" 
                  size={12} 
                  color="#ff3b30" 
                  style={{ marginLeft: 4 }} 
                />
              )}
            </PoppinsText>
            <PoppinsText style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </PoppinsText>
          </View>
        </View>
      );
    },
    [user?.id]
  );

  if (isLoading || isSubscriptionLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#651B55" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: chatUser?.avatar || 'https://via.placeholder.com/40' }} 
            style={styles.headerAvatar} 
          />
          <View>
            <PoppinsText style={styles.userName}>
              {chatUser?.name || 'Loading...'}
            </PoppinsText>
            <PoppinsText style={styles.status}>
              {socket?.connected ? 'Online' : 'Offline'}
            </PoppinsText>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.messagesContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachmentButton}>
          <Ionicons name="add" size={24} color="#651B55" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage}
        >
          <Ionicons name="send" size={20} color={newMessage ? '#fff' : '#999'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

/** ------------------ STYLES ------------------ **/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  status: {
    fontSize: 12,
    color: '#4CAF50',
  },
  moreButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  errorMessage: {
    opacity: 0.8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesList: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageContent: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  currentUserMessage: {
    backgroundColor: '#651B55',
    borderTopRightRadius: 4,
    marginLeft: 8,
  },
  otherUserMessage: {
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 4,
    marginRight: 8,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  attachmentButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#651B55',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
});

/** ------------------ EXPORT WITH SUBSCRIPTION LOCK ------------------ **/
export default withSubscription(ChatScreen, {
  redirectTo: '/screens/subscribe',
});
