import { PoppinsText } from '@/components/PoppinsText';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) {
        console.error('No user ID provided');
        setError('No user ID provided');
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
        console.log('Received user data:', userData);
        
        if (!userData) {
          throw new Error('No user data received');
        }

        // Transform the API response to match our UserProfile interface
        const transformedUser: UserProfile = {
          id: userData.id || String(id),
          name: userData.name || 'User',
          age: userData.age,
          bio: userData.bio || userData.about,
          interests: Array.isArray(userData.interests) 
            ? userData.interests 
            : userData.interests ? [userData.interests] : [],
          photos: Array.isArray(userData.photos) && userData.photos.length > 0 
            ? userData.photos 
            : userData.avatar 
              ? [userData.avatar]
              : ['https://i.pravatar.cc/300?img=32'],
          location: userData.location || userData.city,
          gender: userData.gender,
          orientation: userData.orientation,
          lastActive: userData.lastActive || userData.last_seen
        };
        
        console.log('Transformed user data:', transformedUser);
        setUser(transformedUser);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
        console.error('Error in fetchUserProfile:', {
          error: err,
          message: errorMessage,
          stack: err instanceof Error ? err.stack : undefined
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
          <PoppinsText style={styles.errorText}>
            {error}
          </PoppinsText>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <PoppinsText style={styles.headerTitle}>Profile</PoppinsText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Main Profile Photo */}
        <View style={styles.photoContainer}>
          <Image 
            source={{ uri: user.photos?.[currentPhotoIndex] || 'https://via.placeholder.com/300' }} 
            style={styles.mainPhoto}
            resizeMode="cover"
          />
          
          {/* Photo indicators */}
          {user.photos?.length > 1 && (
            <View style={styles.photoIndicators}>
              {user.photos.map((_: any, index: number) => (
                <View 
                  key={index} 
                  style={[
                    styles.photoIndicator, 
                    index === currentPhotoIndex && styles.photoIndicatorActive
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
            {user.age && <PoppinsText style={styles.age}>{user.age}</PoppinsText>}
          </View>
          
          {/* Location */}
          {user.location && (
            <View style={styles.section}>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={20} color="#651B55" />
                <PoppinsText style={styles.locationText}>{user.location}</PoppinsText>
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
                    <PoppinsText style={styles.interestText}>{interest}</PoppinsText>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Additional Photos */}
          {user.photos && user.photos.length > 1 && (
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
                    onPress={() => setCurrentPhotoIndex(index)}
                    style={[
                      styles.photoThumbnail,
                      index === currentPhotoIndex && styles.photoThumbnailActive
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
        <TouchableOpacity style={[styles.actionButton, styles.likeButton]}>
          <Ionicons name="heart" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.messageButton]}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
          <PoppinsText style={styles.messageButtonText}>Message</PoppinsText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const PHOTO_HEIGHT = width * 1.1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    fontFamily: 'Poppins_400Regular',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40, // Same as back button for centering
  },
  scrollView: {
    flex: 1,
  },
  photoContainer: {
    position: 'relative',
    height: PHOTO_HEIGHT,
    backgroundColor: '#f8f8f8',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  photoIndicatorActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  infoContainer: {
    padding: 20,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 8,
  },
  age: {
    fontSize: 24,
    color: '#666',
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#f0e6f7',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#651B55',
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
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  photoThumbnailActive: {
    borderColor: '#651B55',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  likeButton: {
    backgroundColor: '#FF6B6B',
    marginRight: 12,
    maxWidth: 60,
  },
  messageButton: {
    backgroundColor: '#651B55',
    paddingHorizontal: 24,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 16,
    color: '#651B55',
    marginLeft: 8,
  },
});
