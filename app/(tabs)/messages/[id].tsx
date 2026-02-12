import { PoppinsText } from "@/components/PoppinsText";
import { useAuth } from "@/context/AuthContext";
import { useMessageCount } from "@/context/MessageCountContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Simple chat screen with basic messaging functionality
const ChatScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { subscription, refreshSubscription } = useSubscription();
  const { canSend, remainingFreeMessages, sendMessage } = useMessageCount();
  const router = useRouter();
  const { showToast } = useToast();
  const navigation = useNavigation();
  const [requiresSubscription, setRequiresSubscription] = useState(false);

  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      senderId: string | number;
      timestamp: Date;
    }>
  >([]);

  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Hide tab bar when entering this chat screen, show it when leaving
  useEffect(() => {
    // Hide the tab bar when entering this screen
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: "none" },
    });

    // Show the tab bar when leaving this screen
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          backgroundColor: "#651B55",
          borderTopWidth: 0,
          height: 92,
          paddingBottom: 0,
          paddingTop: 8,
          paddingRight: 32,
          paddingLeft: 32,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -5,
          },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        },
      });
    };
  }, [navigation]);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await api.getMessages(id);

        // Check for subscription required error
        if (response.error) {
          const msg = (response.error.message || "").toString().toLowerCase();
          const status = response.error.status as number | undefined;
          const code = (response.error.code || "").toString();

          // Detect subscription-required responses
          const isSubscriptionRequired =
            status === 402 ||
            status === 403 ||
            code === "SUBSCRIPTION_REQUIRED" ||
            msg.includes("subscription") ||
            msg.includes("payment required") ||
            msg.includes("active subscription") ||
            msg.includes("upgrade") ||
            msg.includes("premium");

          if (isSubscriptionRequired) {
            setRequiresSubscription(true);
            return;
          }

          throw new Error(response.error.message || "Failed to load messages");
        }

        if (response?.data?.messages) {
          const formattedMessages = response.data.messages.map((msg: any) => ({
            id: String(msg.id || `msg-${Date.now()}`),
            text: msg.content || msg.text || "",
            senderId: String(msg.senderId || ""),
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          }));

          setMessages(formattedMessages);
          setRequiresSubscription(false);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        showToast("Failed to load messages. Please try again.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [id, subscription]);

  // Tab bar visibility is handled by the parent tab layout based on nested route state.

  // Handle subscription button press
  const handleSubscribe = async () => {
    try {
      // Default to the production subscribe URL if not provided in env
      const baseUrl = process.env.EXPO_PUBLIC_SUBSCRIBE_URL
        ? `${process.env.EXPO_PUBLIC_SUBSCRIBE_URL}/pricing`
        : "https://dating-g2mc.onrender.com/pricing";

      // On iOS, use in-app subscription flow
      if (Platform.OS === "ios") {
        router.push("/screens/subscribe" as any);
        return;
      }

      // On Android, open external browser with deep link back
      const timestamp = Date.now();
      const callbackUrl = `pairfect://messages/${id}?ts=${timestamp}`;
      const externalSubscribeUrl = `${baseUrl}?redirect_uri=${encodeURIComponent(callbackUrl)}`;

      const supported = await Linking.canOpenURL(externalSubscribeUrl);
      if (supported) {
        await Linking.openURL(externalSubscribeUrl);
      } else {
        throw new Error("Cannot open subscription URL");
      }
    } catch (error) {
      console.error("Failed to open subscribe URL:", error);
      showToast("Failed to open subscription page. Please try again.", "error");
    }
  };

  // Check if user can send messages
  const canSendMessage = canSend && !requiresSubscription && user?.id && id;

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !canSendMessage) return;

    const tempId = `temp-${Date.now()}`;
    const messageToSend = {
      id: tempId,
      text: newMessage,
      senderId: user.id,
      timestamp: new Date(),
    };

    // Optimistically add the message
    setMessages((prev) => [...prev, messageToSend]);
    const messageContent = newMessage;
    setNewMessage("");

    try {
      // Use the message service with free message limit checking
      const result = await sendMessage(id, messageContent);

      if (!result.success) {
        // Remove the optimistic message
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setNewMessage(messageContent); // Restore the message

        if (
          result.message?.includes("subscription") ||
          result.message?.includes("free messages")
        ) {
          setRequiresSubscription(true);
        }
        return;
      }

      // Refresh messages to get the actual message from server
      const messagesResponse = await api.getMessages(id);
      if (messagesResponse?.data?.messages) {
        setMessages(
          messagesResponse.data.messages.map((msg: any) => ({
            id: String(msg.id),
            text: msg.content || "",
            senderId: String(msg.senderId || ""),
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          })),
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageContent); // Restore the message
      showToast("Failed to send message. Please try again.", "error");
    }
  };

  // Render a single message
  const renderMessage = ({ item }: { item: any }) => {
    const isCurrentUser = item.senderId === user?.id;

    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
      >
        <View
          style={[
            styles.messageContent,
            isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  // Show subscription required overlay if needed
  if (requiresSubscription) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        >
          <View style={styles.subscriptionOverlay}>
            <View style={styles.subscriptionContent}>
              <Ionicons
                name="lock-closed"
                size={60}
                color="#651B55"
                style={styles.lockIcon}
              />
              <PoppinsText style={styles.subscriptionTitle}>
                Upgrade to Premium
              </PoppinsText>
              <PoppinsText style={styles.subscriptionText}>
                Subscribe to unlock unlimited messaging and connect with your
                matches
              </PoppinsText>
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={handleSubscribe}
                accessibilityLabel="Subscribe to unlock chat"
              >
                <PoppinsText style={styles.subscribeButtonText}>
                  Subscribe Now
                </PoppinsText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Show blurred messages in the background */}
          <View style={styles.blurredContainer}>
            {messages.length > 0 && (
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                style={{ opacity: 0.5 }}
              />
            )}
          </View>

          {/* Disabled input */}
          <View style={[styles.inputContainer, { opacity: 0.5 }]}>
            <TextInput
              style={styles.messageInput}
              placeholder="Subscribe to send messages"
              placeholderTextColor="#999"
              editable={false}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, styles.sendButtonDisabled]}
              disabled={true}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#651B55" />
        <PoppinsText style={styles.loadingText}>
          Loading messages...
        </PoppinsText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
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
            placeholder={
              canSendMessage
                ? remainingFreeMessages > 0 && !subscription
                  ? `Type a message... (${remainingFreeMessages} free left)`
                  : "Type a message..."
                : "Subscribe to send messages"
            }
            placeholderTextColor="#999"
            multiline
            editable={!!canSendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || !canSendMessage) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || !canSendMessage}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    position: "relative",
     paddingBottom: Platform.OS === "ios" ? 40 : 40,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontFamily: "Poppins_400Regular",
  },
  subscriptionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: 20,
  },
  subscriptionContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center",
  },
  lockIcon: {
    marginBottom: 15,
  },
  subscriptionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  subscriptionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 24,
    fontFamily: "Poppins_400Regular",
  },
  subscribeButton: {
    backgroundColor: "#651B55",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  blurredContainer: {
    flex: 1,
    opacity: 0.5,
    filter: "blur(2px)",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 160, // Extra space for input and keyboard
  },
  messageBubble: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  currentUserBubble: {
    alignSelf: "flex-end",
  },
  otherUserBubble: {
    alignSelf: "flex-start",
  },
  messageContent: {
    padding: 12,
    borderRadius: 16,
  },
  currentUserMessage: {
    backgroundColor: "#651B55",
    borderTopRightRadius: 4,
  },
  otherUserMessage: {
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  currentUserMessageText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 10,
    color: "rgba(0,0,0,0.5)",
    marginTop: 4,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  
    borderTopWidth: 2,
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "ios" ? 40 : 40,
    borderRadius: 20,
    marginHorizontal: 12,
    marginBottom: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: "#333",
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: "#651B55",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default ChatScreen;
