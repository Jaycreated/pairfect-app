import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Simple chat screen with basic messaging functionality
const ChatScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    senderId: string | number;
    timestamp: Date;
  }>>([]);
  
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await api.getMessages(id);
        
        if (response?.data?.messages) {
          const formattedMessages = response.data.messages.map((msg: any) => ({
            id: String(msg.id || `msg-${Date.now()}`),
            text: msg.content || msg.text || '',
            senderId: String(msg.senderId || ''),
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          }));
          
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [id]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !id) return;
    
    const tempId = `temp-${Date.now()}`;
    const messageToSend = {
      id: tempId,
      text: newMessage,
      senderId: user.id,
      timestamp: new Date(),
    };
    
    // Optimistically add the message
    setMessages(prev => [...prev, messageToSend]);
    setNewMessage('');
    
    try {
      // Send the message via API
      await api.sendMessage(id, {
        content: newMessage,
        senderId: user.id,
        recipientId: id,
      });
      
      // Refresh messages
      const response = await api.getMessages(id);
      if (response?.data?.messages) {
        setMessages(response.data.messages.map((msg: any) => ({
          id: String(msg.id),
          text: msg.content || '',
          senderId: String(msg.senderId || ''),
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        })));
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageToSend.text); // Restore the message
    }
  };

  // Render a single message
  const renderMessage = ({ item }: { item: any }) => {
    const isCurrentUser = item.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageBubble,
        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
      ]}>
        <View style={[
          styles.messageContent,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        style={styles.messagesContainer}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 100, // Extra space for input
  },
  messageBubble: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    padding: 12,
    borderRadius: 16,
  },
  currentUserMessage: {
    backgroundColor: '#651B55',
    borderTopRightRadius: 4,
  },
  otherUserMessage: {
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  currentUserMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingBottom: 30, // Extra padding for iOS home indicator
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#333',
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#651B55',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ChatScreen;
