import { PoppinsText } from "@/components/PoppinsText";
import { useToast } from "@/context/ToastContext";
import { api } from "@/services/api";
import { reportContent } from "@/services/reportService";
import { blockUser } from "@/utils/safety";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

// Default profile icon component for users without photos
const DefaultProfileIcon = ({ size = 50 }: { size?: number }) => (
  <View
    style={[
      styles.defaultAvatar,
      { width: size, height: size, borderRadius: size / 2 },
    ]}
  >
    <Ionicons name="person" size={size * 0.6} color="#fff" />
  </View>
);

// Types for the user profile
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    status?: number;
    code?: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  interests?: string[];
  photos: string[];
  location?: string;
  gender?: string;
  orientation?: string;
  lastActive?: string;
  about?: string;
  city?: string;
  avatar?: string;
  last_seen?: string;
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);
  const photoScrollRef = useRef<ScrollView | null>(null);

  const handleBlockUser = async () => {
    if (!user) return;
    try {
      await blockUser(user.id, user.name);
      try {
        await api.post(`/users/${user.id}/block`, {});
      } catch (e) {
        console.log("Backend block notification failed:", e);
      }
      showToast(`Blocked ${user.name}`, "success");
      setSafetyModalVisible(false);
      router.back();
    } catch (error) {
      console.error("Failed to block user:", error);
      showToast("Error blocking user", "error");
    }
  };

  const handleReportUser = async () => {
    if (!user) return;
    try {
      // 1. Submit report to server
      await reportContent({
        reportedUserId: user.id,
        contentType: "profile",
        reason: "Objectionable profile content reported",
      });

      // 2. Block user locally
      await blockUser(user.id, user.name);
      try {
        await api.post(`/users/${user.id}/block`, {});
      } catch (e) {
        console.log("Backend block notification failed:", e);
      }
      showToast(`Reported and blocked ${user.name}`, "success");
      setSafetyModalVisible(false);
      router.back();
    } catch (error) {
      console.error("Failed to report user:", error);
      showToast("Error reporting user", "error");
    }
  };

  const renderSafetyModal = () => {
    if (!user) return null;
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
              What would you like to do with {user.name}?
            </PoppinsText>

            <TouchableOpacity
              style={[styles.safetyOptionButton, styles.reportOptionButton]}
              onPress={handleReportUser}
            >
              <Ionicons
                name="flag-outline"
                size={20}
                color="#E03131"
                style={{ marginRight: 8 }}
              />
              <PoppinsText style={styles.reportOptionText}>
                Report User
              </PoppinsText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.safetyOptionButton, styles.blockOptionButton]}
              onPress={handleBlockUser}
            >
              <Ionicons
                name="ban-outline"
                size={20}
                color="#E03131"
                style={{ marginRight: 8 }}
              />
              <PoppinsText style={styles.blockOptionText}>
                Block User
              </PoppinsText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.safetyOptionButton, styles.cancelOptionButton]}
              onPress={() => setSafetyModalVisible(false)}
            >
              <PoppinsText style={styles.cancelOptionText}>Cancel</PoppinsText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Handle like button press
  const handleLike = async () => {
    if (!user?.id) return;

    try {
      console.log("Liking user:", user.id);
      const response = await api.likeUser(user.id);

      if (response.error) {
        console.error("Error liking user:", response.error);
        // Optionally show error message to user
        return;
      }

      console.log("User liked successfully:", response.data);

      // Check if it's a mutual match
      if (response.data && (response.data as any).matched === true) {
        console.log("Mutual match found with:", user.name);
        setMatchModalVisible(true);
      } else {
        console.log(
          "Like registered, but no mutual match yet with:",
          user.name,
        );
      }
    } catch (error) {
      console.error("Error in handleLike:", error);
    }
  };

  // Handle message button press
  const handleMessage = () => {
    if (!user?.id) return;

    console.log("Navigating to chat with user:", user.id);
    router.push({
      pathname: "/(tabs)/messages/[id]" as any,
      params: {
        id: user.id,
        recipientName: user.name,
        recipientId: String(user.id),
      },
    });
  };

  // Handle message from match modal
  const handleMessageMatch = () => {
    if (user) {
      setMatchModalVisible(false);
      router.push({
        pathname: "/(tabs)/messages/[id]" as any,
        params: {
          id: user.id,
          recipientName: user.name,
          recipientId: String(user.id),
        },
      });
    }
  };

  // Render match modal
  const renderMatchModal = () => {
    if (!user) return null;

    // Check if user has photos
    const hasMatchImage =
      user.photos && user.photos.length > 0 && user.photos[0];

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={matchModalVisible}
        onRequestClose={() => setMatchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.matchModalContainer}>
            {/* Matched User Image */}
            {hasMatchImage ? (
              <Image
                source={{ uri: user.photos[0] }}
                style={styles.matchModalImage}
              />
            ) : (
              <View
                style={[
                  styles.matchModalImage,
                  styles.defaultProfileImageContainer,
                ]}
              >
                <DefaultProfileIcon size={100} />
              </View>
            )}

            {/* Match Text */}
            <View style={styles.matchContent}>
              <PoppinsText style={styles.matchTitle}>
                {"It's a Match!"}
              </PoppinsText>
              <PoppinsText style={styles.matchSubtitle}>
                You and {user.name} have liked each other!
              </PoppinsText>
            </View>

            {/* Action Buttons */}
            <View style={styles.matchButtonContainer}>
              <TouchableOpacity
                style={styles.matchMessageButton}
                onPress={handleMessageMatch}
              >
                <PoppinsText style={styles.matchMessageButtonText}>
                  Message
                </PoppinsText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.matchContinueButton}
                onPress={() => setMatchModalVisible(false)}
              >
                <PoppinsText style={styles.matchContinueButtonText}>
                  View Profile
                </PoppinsText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) {
        console.error("No user ID provided");
        setError("No user ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching user profile for ID: ${id}`);
        const response = await api.get<any>(`/users/${id}`);

        // The API returns the user data nested under the "user" key
        const userData = response.data?.user;
        console.log("Received user data:", userData);

        if (!userData) {
          throw new Error("No user data received");
        }

        // Transform the API response to match our UserProfile interface
        const transformedUser: UserProfile = {
          id: userData.id || String(id),
          name: userData.name || "User",
          age: userData.age,
          bio: userData.bio || userData.about,
          interests: Array.isArray(userData.interests)
            ? userData.interests
            : userData.interests
              ? [userData.interests]
              : [],
          photos:
            Array.isArray(userData.photos) && userData.photos.length > 0
              ? userData.photos
              : userData.avatar
                ? [userData.avatar]
                : [],
          location: userData.location || userData.city,
          gender: userData.gender,
          orientation: userData.orientation,
          lastActive: userData.lastActive || userData.last_seen,
        };

        console.log("Transformed user data:", transformedUser);
        setUser(transformedUser);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load profile";
        console.error("Error in fetchUserProfile:", {
          error: err,
          message: errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#651B55" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        {error ? (
          <PoppinsText style={styles.errorText}>{error}</PoppinsText>
        ) : (
          <PoppinsText>User not found</PoppinsText>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <PoppinsText style={styles.headerTitle}>Profile</PoppinsText>
        <TouchableOpacity
          onPress={() => setSafetyModalVisible(true)}
          style={styles.headerSafetyButton}
        >
          <Ionicons name="shield-outline" size={24} color="#651B55" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Main Profile Photo (swipeable) */}
        <View style={styles.photoContainer}>
          {user.photos && user.photos.length > 0 && user.photos[0] ? (
            <ScrollView
              ref={(ref) => { photoScrollRef.current = ref; }}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const width = Dimensions.get("window").width;
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentPhotoIndex(index);
              }}
            >
              {user.photos.map((photo: string, idx: number) => (
                <Image
                  key={idx}
                  source={{ uri: photo }}
                  style={[
                    styles.mainPhoto,
                    { width: Dimensions.get("window").width },
                  ]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View
              style={[styles.mainPhoto, styles.defaultProfileImageContainer]}
            >
              <DefaultProfileIcon size={150} />
            </View>
          )}

          {/* Photo indicators */}
          {user.photos && user.photos.length > 1 && (
            <View style={styles.photoIndicators}>
              {user.photos.map((_: string, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.photoIndicator,
                    index === currentPhotoIndex && styles.photoIndicatorActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameContainer}>
            <PoppinsText style={styles.name}>{user.name}</PoppinsText>
            {user.age && (
              <PoppinsText style={styles.age}>{user.age}</PoppinsText>
            )}
          </View>

          {/* Location */}
          {user.location && (
            <View style={styles.section}>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={20} color="#651B55" />
                <PoppinsText style={styles.locationText}>
                  {user.location}
                </PoppinsText>
              </View>
            </View>
          )}

          {/* Bio */}
          <View style={styles.section}>
            <PoppinsText style={styles.bio}>{user.bio}</PoppinsText>
          </View>

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <View style={styles.section}>
              <PoppinsText style={styles.sectionTitle}>Interests</PoppinsText>
              <View style={styles.interestsContainer}>
                {user.interests.map((interest: string, index: number) => (
                  <View key={index} style={styles.interestTag}>
                    <PoppinsText style={styles.interestText}>
                      {interest}
                    </PoppinsText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Additional Photos */}
          {user.photos && user.photos.length > 0 && (
            <View style={styles.section}>
              <PoppinsText style={styles.sectionTitle}>Photos</PoppinsText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photosScrollContainer}
              >
                {user.photos.map((photo: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      const width = Dimensions.get("window").width;
                      photoScrollRef.current?.scrollTo({
                        x: index * width,
                        animated: true,
                      });
                      setCurrentPhotoIndex(index);
                    }}
                    style={[
                      styles.photoThumbnail,
                      index === currentPhotoIndex &&
                        styles.photoThumbnailActive,
                    ]}
                  >
                    <Image
                      source={{ uri: photo }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleLike}
        >
          <Ionicons name="heart" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={handleMessage}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
          <PoppinsText style={styles.messageButtonText}>Message</PoppinsText>
        </TouchableOpacity>
      </View>

      {renderMatchModal()}
      {renderSafetyModal()}
    </View>
  );
}

const { width } = Dimensions.get("window");
const PHOTO_HEIGHT = width * 1.1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    fontFamily: "Poppins_400Regular",
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ff3b30",
    textAlign: "center",
    marginHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 26,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 40, // Same as back button for centering
  },
  scrollView: {
    flex: 1,
  },
  photoContainer: {
    position: "relative",
    height: PHOTO_HEIGHT,
    backgroundColor: "#f8f8f8",
  },
  mainPhoto: {
    width: "100%",
    height: "100%",
  },
  photoIndicators: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  photoIndicatorActive: {
    backgroundColor: "#fff",
    width: 24,
  },
  infoContainer: {
    padding: 20,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    marginRight: 8,
  },
  age: {
    fontSize: 24,
    color: "#666",
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 20,
  },
  section: {
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestTag: {
    backgroundColor: "#f0e6f7",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: "#651B55",
    fontSize: 14,
  },
  photosScrollContainer: {
    paddingRight: 20,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  photoThumbnailActive: {
    borderColor: "#651B55",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flex: 1,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  likeButton: {
    backgroundColor: "#FF6B6B",
    marginRight: 12,
    maxWidth: 60,
  },
  messageButton: {
    backgroundColor: "#651B55",
    paddingHorizontal: 24,
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    fontSize: 16,
    color: "#651B55",
    marginLeft: 8,
  },
  // Match Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  matchModalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 0,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  matchModalImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  matchContent: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
  },
  matchTitle: {
    fontSize: 28,
    color: "#FF1B6D",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
  matchSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  matchButtonContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  matchMessageButton: {
    flex: 1,
    backgroundColor: "#651B55",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  matchMessageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  matchContinueButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  matchContinueButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  defaultAvatar: {
    backgroundColor: "#651B55",
    justifyContent: "center",
    alignItems: "center",
  },
  defaultProfileImageContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  headerSafetyButton: {
    padding: 8,
  },
  safetyModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 360,
    alignItems: "center",
  },
  safetyModalTitle: {
    fontSize: 22,
    color: "#651B55",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
  safetyModalSubTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  safetyOptionButton: {
    flexDirection: "row",
    width: "100%",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  reportOptionButton: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FFE3E3",
  },
  reportOptionText: {
    color: "#E03131",
    fontSize: 16,
    fontWeight: "bold",
  },
  blockOptionButton: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FFE3E3",
  },
  blockOptionText: {
    color: "#E03131",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelOptionButton: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E5E7EB",
    marginBottom: 0,
  },
  cancelOptionText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
});
