import { PoppinsText } from "@/components/PoppinsText";
import { useAuth } from "@/context/AuthContext";
import { useMessageCount } from "@/context/MessageCountContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/services/api";
import { blockUser, containsObjectionableContent } from "@/utils/safety";
import { reportContent } from "@/services/reportService";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Pressable,
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
  const {
    id,
    recipientName: routeRecipientName,
    recipientId: routeRecipientId,
  } = useLocalSearchParams<{
    id?: string | string[];
    recipientName?: string | string[];
    recipientId?: string | string[];
  }>();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { canSend, remainingFreeMessages, sendMessage, refreshMessageCount } = useMessageCount();
  const router = useRouter();
  const { showToast } = useToast();
  const navigation = useNavigation();
  const [requiresSubscription, setRequiresSubscription] = useState(false);
  const [recipient, setRecipient] = useState<{ id: string; name: string } | null>(null);
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);

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
  const inputRef = useRef<TextInput>(null);
  const conversationId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const resolvedRecipientName = Array.isArray(routeRecipientName)
      ? routeRecipientName[0]
      : routeRecipientName;
    const resolvedRecipientId = Array.isArray(routeRecipientId)
      ? routeRecipientId[0]
      : routeRecipientId;

    if (conversationId && (resolvedRecipientName || resolvedRecipientId)) {
      const initialRecipient = {
        id: resolvedRecipientId || String(conversationId),
        name: resolvedRecipientName || "Chat Participant",
      };
      setRecipient(initialRecipient);
      console.log("🧭 [ChatScreen] Initial recipient from route params:", initialRecipient);
    }
  }, [conversationId, routeRecipientId, routeRecipientName]);

  // Fetch fresh message count and log it when entering the chat screen
  useEffect(() => {
    const fetchCount = async () => {
      if (!conversationId) return;
      console.log(`💬 [ChatScreen] Entered chat screen for conversation ${conversationId} — fetching fresh message count from server...`);
      try {
        await refreshMessageCount();
        console.log("💬 [ChatScreen] Refresh completed successfully");
      } catch (error) {
        console.error("💬 [ChatScreen] Error refreshing message count on screen entry:", error);
      }
    };
    fetchCount();
  }, [conversationId, refreshMessageCount]);

  // Fetch conversation details
  useEffect(() => {
    const loadConversationDetails = async () => {
      if (!conversationId) return;

      const resolvedRecipientName = Array.isArray(routeRecipientName)
        ? routeRecipientName[0]
        : routeRecipientName;
      const resolvedRecipientId = Array.isArray(routeRecipientId)
        ? routeRecipientId[0]
        : routeRecipientId;

      try {
        console.log("Fetching details for conversation:", conversationId);
        const response = await api.getConversation(conversationId);
        console.log('🔍 [ChatScreen] API response:', response);

        const payload = response?.data?.conversation ?? response?.data ?? response;
        const conv = payload?.conversation ?? payload;

        let name = resolvedRecipientName || 'Chat Participant';
        let recipId = resolvedRecipientId || String(conversationId);

        const directUser =
          conv?.user ??
          conv?.other_user ??
          conv?.chat_partner ??
          conv?.otherUser ??
          conv?.otherUserInfo ??
          conv?.participant ??
          conv?.recipient ??
          conv?.profile;

        if (directUser?.name || directUser?.full_name || directUser?.fullName) {
          name = directUser.name || directUser.full_name || directUser.fullName || name;
          recipId = String(directUser.id ?? directUser.user_id ?? directUser.userId ?? resolvedRecipientId ?? conversationId);
        } else if (Array.isArray(conv?.participants) && conv.participants.length) {
          const otherPart = conv.participants.find((p: any) => {
            const pid = p?.id ?? p?.user?.id ?? p?.user_id ?? p?.userId;
            return pid && String(pid) !== String(user?.id);
          });
          if (otherPart) {
            name = otherPart.name ?? otherPart.user?.name ?? otherPart.full_name ?? otherPart.fullName ?? name;
            recipId = String(otherPart.id ?? otherPart.user?.id ?? otherPart.user_id ?? otherPart.userId ?? resolvedRecipientId ?? conversationId);
          }
        } else if (conv?.name) {
          name = conv.name;
        } else if (Array.isArray(payload?.messages) && payload.messages.length) {
          const firstMsg = payload.messages[0];
          const otherId = firstMsg.sender_id !== Number(user?.id) ? firstMsg.sender_id : firstMsg.receiver_id;
          recipId = String(otherId || recipId);
          name = resolvedRecipientName || `User ${otherId}`;
        }

        setRecipient({ id: recipId, name });
        console.log('🔧 [ChatScreen] Recipient set:', { id: recipId, name });
      } catch (e) {
        console.error("Failed to load conversation details:", e);
        setRecipient({
          id: String(conversationId),
          name: resolvedRecipientName || 'Chat Participant'
        });
      }
    };
    loadConversationDetails();
  }, [conversationId, routeRecipientId, routeRecipientName, user?.id]);

  const handleBlockUser = async () => {
    if (!recipient) return;
    try {
      await blockUser(recipient.id, recipient.name);
      try {
        await api.post(`/users/${recipient.id}/block`, {});
      } catch (e) {
        console.log("Backend block notification failed:", e);
      }
      showToast(`Blocked ${recipient.name}`, "success");
      setSafetyModalVisible(false);
      router.push('/messages');
    } catch (error) {
      console.error("Failed to block user:", error);
      showToast("Error blocking user", "error");
    }
  };

  const handleReportUser = async () => {
    if (!recipient) return;
    try {
      // 1. Submit report to server
      await reportContent({
        reportedUserId: recipient.id,
        contentType: 'profile',
        reason: 'Objectionable user profile content reported'
      });

      // 2. Block user locally
      await blockUser(recipient.id, recipient.name);
      try {
        await api.post(`/users/${recipient.id}/block`, {});
      } catch (e) {
        console.log("Backend block notification failed:", e);
      }
      showToast(`Reported and blocked ${recipient.name}`, "success");
      setSafetyModalVisible(false);
      router.push('/messages');
    } catch (error) {
      console.error("Failed to report user:", error);
      showToast("Error reporting user", "error");
    }
  };

  const handleMessageLongPress = (message: any) => {
    const isCurrentUser = String(message.senderId) === String(user?.id);
    if (isCurrentUser) return;

    Alert.alert(
      "Safety Options",
      "Choose an action for this message:",
      [
        {
          text: "Report Message",
          style: "destructive",
          onPress: () => {
            confirmMessageReport(message);
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const confirmMessageReport = (message: any) => {
    Alert.alert(
      "Report Message",
      "Are you sure you want to report this message? This will instantly block the sender and remove the conversation from your feed.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Report & Block",
          style: "destructive",
          onPress: () => handleReportMessage(message)
        }
      ]
    );
  };

  const handleReportMessage = async (message: any) => {
    if (!recipient) return;
    try {
      // 1. Submit report to server
      await reportContent({
        reportedUserId: recipient.id,
        contentType: 'message',
        contentId: message.id,
        content: message.text,
        reason: 'Objectionable chat content reported by user'
      });

      // 2. Block user locally
      await blockUser(recipient.id, recipient.name);
      try {
        await api.post(`/users/${recipient.id}/block`, {});
      } catch (e) {
        console.log("Backend block notification failed (non-fatal):", e);
      }

      // 3. Clear feed and redirect
      showToast(`Message reported. ${recipient.name} has been blocked.`, "success");
      setMessages([]);
      router.replace('/(tabs)/messages');
    } catch (error) {
      console.error("Failed to report message:", error);
      showToast("Error reporting message", "error");
    }
  };

  const renderSafetyModal = () => {
    if (!recipient) return null;
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={safetyModalVisible}
        onRequestClose={() => setSafetyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.safetyModalContent}>
            <PoppinsText style={styles.safetyModalTitle}>
              Safety Options
            </PoppinsText>
            <PoppinsText style={styles.safetyModalSubTitle}>
              What would you like to do with {recipient.name}?
            </PoppinsText>

            <TouchableOpacity
              style={[styles.safetyOptionButton, styles.reportOptionButton]}
              onPress={handleReportUser}
            >
              <Ionicons name="flag-outline" size={20} color="#E03131" style={{ marginRight: 8 }} />
              <PoppinsText style={styles.reportOptionText}>
                Report User
              </PoppinsText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.safetyOptionButton, styles.blockOptionButton]}
              onPress={handleBlockUser}
            >
              <Ionicons name="ban-outline" size={20} color="#E03131" style={{ marginRight: 8 }} />
              <PoppinsText style={styles.blockOptionText}>
                Block User
              </PoppinsText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.safetyOptionButton, styles.cancelOptionButton]}
              onPress={() => setSafetyModalVisible(false)}
            >
              <PoppinsText style={styles.cancelOptionText}>
                Cancel
              </PoppinsText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

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
      if (!conversationId) return;

      try {
        setIsLoading(true);
        const response = await api.getMessages(conversationId);

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
            senderId: String(msg.senderId || msg.sender_id || ""),
            receiverId: String(msg.receiverId || msg.receiver_id || ""),
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(msg.created_at || new Date()),
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
    router.push("/screens/subscribe" as any);
  };

  // Allow typing regardless of access gating so the composer stays responsive.
  // Sending is still blocked until the message limit check allows it.
  const currentUserId = user?.id;
  const canTypeMessage = Boolean(currentUserId);
  const canSendMessage = canTypeMessage && (user?.has_chat_access || canSend) && !requiresSubscription && Boolean(conversationId);

  const focusComposer = () => {
    if (!canTypeMessage) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !canSendMessage || !conversationId || !currentUserId) {
      return;
    }

    // Check for objectionable content locally
    if (containsObjectionableContent(newMessage)) {
      Alert.alert(
        "Content Warning",
        "Your message contains objectionable or abusive content which violates our zero-tolerance safety policy. Please remove any offensive language.",
        [{ text: "OK" }]
      );
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const messageToSend = {
      id: tempId,
      text: newMessage,
      senderId: String(currentUserId),
      timestamp: new Date(),
    };

    // Optimistically add message
    setMessages((prev) => [...prev, messageToSend]);
    const messageContent = newMessage;
    setNewMessage("");

    try {
      // Use message service with free message limit checking
      const result = await sendMessage(conversationId, messageContent);

      if (!result.success) {
        // Remove optimistic message
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setNewMessage(messageContent); // Restore message

        if (
          result.message?.includes("subscription") ||
          result.message?.includes("free messages")
        ) {
          setRequiresSubscription(true);
        }
        return;
      }

      // Refresh messages to get actual message from server
      const messagesResponse = await api.getMessages(conversationId);
      if (messagesResponse?.data?.messages) {
        setMessages(
          messagesResponse.data.messages.map((msg: any) => ({
            id: String(msg.id),
            text: msg.content || "",
            senderId: String(msg.senderId || msg.sender_id || ""),
            receiverId: String(msg.receiverId || msg.receiver_id || ""),
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(msg.created_at || new Date()),
          })),
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageContent); // Restore message
      showToast("Failed to send message. Please try again.", "error");
    }
  };

  // Render a single message
  const renderMessage = ({ item }: { item: any }) => {
    const isCurrentUser = String(item.senderId) === String(user?.id);

    return (
      <TouchableOpacity
        onLongPress={() => handleMessageLongPress(item)}
        activeOpacity={0.8}
        disabled={isCurrentUser}
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
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserMessageText : null
          ]}>{item.text}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </TouchableOpacity>
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
              <Ionicons name="send" size={18} color="#94a3b8" />
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/messages')}>
            <Ionicons name="arrow-back" size={24} color="#651B55" />
          </TouchableOpacity>
          <PoppinsText weight="bold" style={styles.headerTitle}>
            {recipient?.name || 'Chat'}
          </PoppinsText>
          <TouchableOpacity onPress={() => setSafetyModalVisible(true)} style={styles.safetyHeaderButton}>
            <Ionicons name="shield-outline" size={24} color="#651B55" />
          </TouchableOpacity>
        </View>

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
          keyboardDismissMode="interactive"
          style={styles.messagesContainer}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <Pressable style={styles.messageInputWrapper} onPress={focusComposer}>
            <TextInput
              ref={inputRef}
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
              placeholderTextColor="#94a3b8"
              multiline
              editable={canTypeMessage}
              returnKeyType="default"
              blurOnSubmit={false}
              textAlignVertical="center"
              selectionColor="#651B55"
              showSoftInputOnFocus
              onFocus={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          </Pressable>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || !canSendMessage) &&
              styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || !canSendMessage}
          >
            <Ionicons
              name="send"
              size={18}
              color={!newMessage.trim() || !canSendMessage ? "#94a3b8" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {renderSafetyModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    position: "relative",
    paddingBottom: Platform.OS === "ios" ? 40 : 40,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#B2B2B2",
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
    marginTop: 4,
    textAlign: "right",
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 6,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messageInputWrapper: {
    flex: 1,
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 15,
    color: "#0f172a",
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#651B55",
    borderRadius: 999,
  },
  sendButtonDisabled: {
    backgroundColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  safetyHeaderButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  safetyModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 360,
    alignItems: 'center',
  },
  safetyModalTitle: {
    fontSize: 22,
    color: '#651B55',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  safetyModalSubTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  safetyOptionButton: {
    flexDirection: 'row',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  reportOptionButton: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFE3E3',
  },
  reportOptionText: {
    color: '#E03131',
    fontSize: 16,
    fontWeight: 'bold',
  },
  blockOptionButton: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFE3E3',
  },
  blockOptionText: {
    color: '#E03131',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelOptionButton: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E5E7EB',
    marginBottom: 0,
  },
  cancelOptionText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatScreen;
