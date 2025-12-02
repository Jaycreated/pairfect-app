import { PoppinsText } from '@/components/PoppinsText';
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

// Mock user data - in a real app, this would come from your backend
const MOCK_USER = {
  id: '1',
  name: 'Alex Johnson',
  age: 28,
  bio: 'Adventure seeker and coffee enthusiast. Love hiking on weekends and trying out new recipes. Looking for someone to share life\'s little moments with.',
  interests: ['Hookup'],
  photos: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  ],
};

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    // In a real app, you would fetch the user data here
    const fetchUser = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUser(MOCK_USER);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
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
      <View style={styles.container}>
        <PoppinsText>User not found</PoppinsText>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
});
