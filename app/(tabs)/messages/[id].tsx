import { PoppinsText } from '@/components/PoppinsText';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
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

// Mock data - in a real app, this would come from your backend
const MOCK_MESSAGES = [
  {
    id: '1',
    text: 'Hey there! How are you doing?',
    senderId: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: '2',
    text: 'I\'m good, thanks for asking! How about you?',
    senderId: '1', // Current user
    timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
  },
  {
    id: '3',
    text: 'Doing great! Just finished that project we talked about.',
    senderId: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 3), // 3 minutes ago
  },
  {
    id: '4',
    text: 'That\'s awesome! Can you share some details?',
    senderId: '1', // Current user
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
  },
  {
    id: '5',
    text: 'Sure! It\'s a mobile app for connecting people with similar interests. Would you like to check it out?',
    senderId: '2',
    timestamp: new Date(), // Now
  },
];

// Mock user data - in a real app, this would come from your backend
const MOCK_USER = {
  id: '2',
  name: 'Alex Johnson',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60',
};

const ChatScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // In a real app, you would fetch the conversation and messages here
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        // In a real app, you would set the messages from the API response
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [id]);

  const handleSend = useCallback(() => {
    if (!newMessage.trim()) return;

    // In a real app, you would send the message to your backend
    const newMsg = {
      id: Date.now().toString(),
      text: newMessage,
      senderId: user?.id || '1',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    
    // Scroll to bottom after sending a message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [newMessage, user?.id]);

  const renderMessage = useCallback(({ item }) => {
    const isCurrentUser = item.senderId === user?.id;
    
    return (
      <View 
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
      >
        {!isCurrentUser && (
          <Image source={{ uri: MOCK_USER.avatar }} style={styles.avatar} />
        )}
        <View 
          style={[
            styles.messageContent,
            isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
          ]}
        >
          <PoppinsText style={styles.messageText}>{item.text}</PoppinsText>
          <PoppinsText style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </PoppinsText>
        </View>
      </View>
    );
  }, [user?.id]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#651B55" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Image source={{ uri: MOCK_USER.avatar }} style={styles.headerAvatar} />
          <View>
            <PoppinsText style={styles.userName}>{MOCK_USER.name}</PoppinsText>
            <PoppinsText style={styles.status}>Online</PoppinsText>
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
          <Ionicons 
            name="send" 
            size={20} 
            color={newMessage ? '#fff' : '#999'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    padding: 8,
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
  currentUserText: {
    color: '#fff',
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

export default ChatScreen;
