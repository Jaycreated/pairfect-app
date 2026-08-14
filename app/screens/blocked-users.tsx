import { PoppinsText } from "@/components/PoppinsText";
import { useToast } from "@/context/ToastContext";
import { api } from "@/services/api";
import { getBlockedUsers, unblockUser, BlockedUser } from "@/utils/safety";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [blockedList, setBlockedList] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingIds, setUnblockingIds] = useState<string[]>([]);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setIsLoading(true);
      const list = await getBlockedUsers();
      setBlockedList(list);
    } catch (error) {
      console.error("Failed to load blocked users:", error);
      showToast("Error loading blocked users", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (userId: string, name: string) => {
    try {
      setUnblockingIds(prev => [...prev, userId]);
      
      // 1. Update persistent storage locally
      await unblockUser(userId);
      
      // 2. Call backend unblock endpoint (optional notification)
      try {
        console.log(`Notifying backend of unblock for user: ${userId}`);
        await api.post(`/users/${userId}/unblock`, {});
      } catch (backendError) {
        console.log("Backend unblock notification error (non-fatal):", backendError);
      }

      // 3. Update local UI state
      setBlockedList(prev => prev.filter(user => user.id !== userId));
      showToast(`Successfully unblocked ${name}`, "success");
    } catch (error) {
      console.error("Error unblocking user:", error);
      showToast(`Failed to unblock ${name}`, "error");
    } finally {
      setUnblockingIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/screens/settings");
    }
  };

  const renderItem = ({ item }: { item: BlockedUser }) => {
    const isUnblocking = unblockingIds.includes(item.id);
    const dateFormatted = item.blockedAt
      ? new Date(item.blockedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recently";

    return (
      <View style={styles.itemCard}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color="#651B55" />
        </View>
        <View style={styles.userInfo}>
          <PoppinsText weight="bold" style={styles.userName}>
            {item.name}
          </PoppinsText>
          <PoppinsText style={styles.blockedDate}>
            Blocked on: {dateFormatted}
          </PoppinsText>
        </View>
        <TouchableOpacity
          style={[styles.unblockButton, isUnblocking && styles.unblockButtonDisabled]}
          onPress={() => handleUnblock(item.id, item.name)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <PoppinsText weight="bold" style={styles.unblockButtonText}>
              Unblock
            </PoppinsText>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#651B55" />
        </TouchableOpacity>
        <PoppinsText weight="bold" style={styles.headerTitle}>
          Blocked Users
        </PoppinsText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#651B55" />
        </View>
      ) : blockedList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#ccc" />
          <PoppinsText style={styles.emptyText}>
            No blocked users
          </PoppinsText>
          <PoppinsText style={styles.emptySubText}>
            Users you block will show up here.
          </PoppinsText>
        </View>
      ) : (
        <FlatList
          data={blockedList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: "#333",
  },
  headerSpacer: {
    width: 28,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#555",
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f2e6f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  blockedDate: {
    fontSize: 12,
    color: "#888",
  },
  unblockButton: {
    backgroundColor: "#651B55",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unblockButtonDisabled: {
    opacity: 0.6,
  },
  unblockButtonText: {
    color: "#fff",
    fontSize: 13,
  },
});
