import { PoppinsText } from '@/components/PoppinsText';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { api } from '@/services/api';
import { Storage } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal, Platform, ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

interface UserProfile {
  id?: string | number;
  name: string;
  email: string;
  age: number | string | null;
  bio: string | null;
  interests: string[];
  photos: string[];
  gender?: string | null;
  location?: string | null;
  orientation?: string | null;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: user?.email || '',
    age: null,
    bio: null,
    interests: [],
    photos: [],
    gender: null,
    location: null,
    orientation: null
  });
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const INTERESTS = [
    'Relationship',
    'Casual friendship',
    'Hookup',
    'Chat buddy',
    'Friends with benefit',
    'Sugar Mummy',
    'Sugar Daddy'
  ] as const;

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      // Try to fetch profile from API
      const response = await api.getProfile();

      if (response.data?.user) {
        const { user: apiData } = response.data;
        
        setProfile({
          id: apiData.id,
          name: apiData.name,
          email: apiData.email || user?.email || '',
          age: apiData.age,
          bio: apiData.bio,
          interests: apiData.interests || [],
          photos: apiData.photos || [],
          gender: apiData.gender,
          location: apiData.location,
          orientation: apiData.orientation
        });

        // Cache the data locally
        await Storage.setItem('user', JSON.stringify({
          name: apiData.name,
          email: apiData.email || user?.email || '',
          age: apiData.age,
          bio: apiData.bio,
          interests: apiData.interests || [],
          gender: apiData.gender,
          location: apiData.location,
          orientation: apiData.orientation
        }));

        if (apiData.photos && apiData.photos.length > 0) {
          await Storage.setItem('userPhotos', JSON.stringify(apiData.photos));
        }
      } else {
        // Fallback to local storage if API fails
        const userData = await Storage.getItem('user');
        const userPhotos = await Storage.getItem('userPhotos');

        if (userData) {
          const localData = JSON.parse(userData);
          const photos = userPhotos ? JSON.parse(userPhotos) : [];

          setProfile(prev => ({
            ...prev,
            ...localData,
            photos: photos,
            email: localData.email || user?.email || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('Failed to load profile data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelect = (index: number) => {
    if (isEditing) {
      // In edit mode, allow reordering or removing photos
      // For now, just set as main photo
      setSelectedPhotoIndex(index);
      // Move the selected photo to the first position
      const newPhotos = [...profile.photos];
      const [movedPhoto] = newPhotos.splice(index, 1);
      newPhotos.unshift(movedPhoto);
      setProfile({ ...profile, photos: newPhotos });
      setSelectedPhotoIndex(0);
    } else {
      // In view mode, open the modal with the selected photo
      setSelectedPhotoIndex(index);
      setIsModalVisible(true);
    }
  };

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const handleTouchStart = (e: any) => {
    setTouchStartX(e.nativeEvent.pageX);
  };

  const handleTouchMove = (e: any) => {
    setTouchEndX(e.nativeEvent.pageX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const difference = touchStartX - touchEndX;
    
    // Minimum swipe distance to trigger navigation (in pixels)
    const minSwipeDistance = 50;
    
    if (Math.abs(difference) > minSwipeDistance) {
      if (difference > 0) {
        // Swipe left - go to next photo
        if (selectedPhotoIndex < profile.photos.length - 1) {
          setSelectedPhotoIndex(selectedPhotoIndex + 1);
        }
      } else {
        // Swipe right - go to previous photo
        if (selectedPhotoIndex > 0) {
          setSelectedPhotoIndex(selectedPhotoIndex - 1);
        }
      }
    }
    
    // Reset touch coordinates
    setTouchStartX(0);
    setTouchEndX(0);
  };

  const handleAddPhoto = async () => {
    if (profile.photos.length >= 4) {
      showToast('You can only upload up to 4 photos.', 'warning');
      return;
    }

    // Request permission to access the photo library
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('We need access to your photo library to upload images.', 'warning');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // In a real app, you would upload the image to your server here
        // For now, we'll just add the local URI to the photos array
        setProfile({
          ...profile,
          photos: [...profile.photos, selectedImage.uri]
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('Failed to pick an image. Please try again.', 'error');
    }
  };

  const handleRemovePhoto = (index: number) => {
    // For now, we'll just remove the photo directly since we don't have a custom confirmation dialog
    // In a production app, you might want to implement a custom confirmation modal
    const newPhotos = [...profile.photos];
    newPhotos.splice(index, 1);
    setProfile({ ...profile, photos: newPhotos });
    showToast('Photo removed', 'info');
  };

  const handleSave = () => {
    // Prepare data for API
    const profileData = {
      name: profile.name,
      age: profile.age ? parseInt(profile.age.toString()) : null,
      bio: profile.bio,
      interests: profile.interests,
      photos: profile.photos,
      gender: profile.gender || null,
      location: profile.location || null,
      orientation: profile.orientation || null
    };

    // Update profile using the hook
    updateProfile(profileData, {
      onSuccess: () => {
        // Update local storage on success
        Storage.setItem('user', JSON.stringify({
          name: profile.name,
          email: profile.email,
          age: profile.age,
          bio: profile.bio,
          interests: profile.interests,
          gender: profile.gender,
          location: profile.location,
          orientation: profile.orientation
        }));

        if (profile.photos && profile.photos.length > 0) {
          Storage.setItem('userPhotos', JSON.stringify(profile.photos));
        }

        setIsEditing(false);
        showToast('Profile updated successfully!', 'success');
      }
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderField = (label: string, value: string | number | null | undefined, key: keyof UserProfile) => {
    // Skip rendering if value is null or undefined and we're not in edit mode
    if (!isEditing && (value === null || value === undefined || value === '')) {
      return null;
    }
    const stringValue = value !== null && value !== undefined ? value.toString() : '';
    const inputValue = value !== null && value !== undefined ? value.toString() : '';
    return isEditing ? (
      <View style={styles.fieldContainer}>
        <PoppinsText style={styles.label}>{label}</PoppinsText>
        <TextInput
          style={[styles.input, { fontFamily: 'Poppins_400Regular' }]}
          value={inputValue}
          onChangeText={(text) => setProfile({ ...profile, [key]: text || null })}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#999"
          editable={isEditing}
          selectTextOnFocus={isEditing}
        />
      </View>
    ) : (
      <View style={styles.fieldContainer}>
        <PoppinsText style={styles.label}>{label}</PoppinsText>
        <PoppinsText style={[styles.value, !stringValue && styles.placeholderText]}>
          {stringValue || 'Not set'}
        </PoppinsText>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#651B55" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Image Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsModalVisible(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          
          <View 
            style={styles.modalBackground}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
              <Image
                source={{ uri: profile.photos[selectedPhotoIndex] }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </TouchableWithoutFeedback>
          </View>
          
          {profile.photos.length > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity 
                style={[styles.navButton, selectedPhotoIndex === 0 && styles.disabledNavButton]}
                onPress={() => {
                  if (selectedPhotoIndex > 0) {
                    setSelectedPhotoIndex(selectedPhotoIndex - 1);
                  }
                }}
                disabled={selectedPhotoIndex === 0}
              >
                <Ionicons name="chevron-back" size={32} color={selectedPhotoIndex === 0 ? '#666' : '#fff'} />
              </TouchableOpacity>
              
              <View style={styles.paginationDots}>
                {profile.photos.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.paginationDot,
                      index === selectedPhotoIndex && styles.paginationDotActive
                    ]} 
                  />
                ))}
              </View>
              
              <TouchableOpacity 
                style={[styles.navButton, selectedPhotoIndex === profile.photos.length - 1 && styles.disabledNavButton]}
                onPress={() => {
                  if (selectedPhotoIndex < profile.photos.length - 1) {
                    setSelectedPhotoIndex(selectedPhotoIndex + 1);
                  }
                }}
                disabled={selectedPhotoIndex === profile.photos.length - 1}
              >
                <Ionicons name="chevron-forward" size={32} color={selectedPhotoIndex === profile.photos.length - 1 ? '#666' : '#fff'} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
      <View style={styles.header}>
        <PoppinsText style={styles.title}>My Profile</PoppinsText>

      </View>

      <ScrollView style={styles.scrollView}>
        {/* Main Profile Photo */}
        <View style={styles.profileHeaderContainer}>
          <View style={styles.profileHeader}>
            <View style={styles.mainPhotoContainer}>
              {profile.photos && profile.photos.length > 0 ? (
                <TouchableOpacity 
                  onPress={() => profile.photos.length > 0 && setIsModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: profile.photos[selectedPhotoIndex] }}
                    style={styles.mainProfileImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={50} color="#999" />
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <PoppinsText style={styles.profileName}>
                {profile.name}
                {profile.age && `, ${profile.age}`}
              </PoppinsText>

              {profile.location && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color="#651B55" style={styles.infoIcon} />
                  <PoppinsText style={styles.infoText}>{profile.location}</PoppinsText>
                </View>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <View style={styles.infoRow}>
                  <Ionicons name="heart-outline" size={20} color="#666" style={styles.infoIcon} />
                  <PoppinsText style={styles.infoText} numberOfLines={2}>
                    {profile.interests.join(', ')}
                  </PoppinsText>
                </View>
              )}
            </View>
          </View>


          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => router.push('/screens/settings')}
              style={{ marginRight: 10 }}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color="#651B55"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isLoading}
            >
              {isEditing ? (
                <Ionicons
                  name="checkmark"
                  size={24}
                  color="#651B55"
                />
              ) : (
                <Image
                  source={require('@/assets/images/edit.png')}
                  style={{ width: 24, height: 24, tintColor: '#651B55' }}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>


        {/* Photo Gallery */}
        <View style={styles.photoGallery}>
          {Array.from({ length: 4 }).map((_, index) => {
            const isEmpty = index >= profile.photos.length;
            if (index < profile.photos.length) {
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handlePhotoSelect(index)}
                  style={[
                    styles.thumbnailContainer,
                    selectedPhotoIndex === index && styles.selectedThumbnail,
                    isEmpty && styles.emptyThumbnail
                  ]}
                >
                  <Image
                    source={{ uri: profile.photos[index] }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            } else if (isEditing && index === profile.photos.length) {
              return (
                <TouchableOpacity
                  key="add"
                  style={[styles.thumbnailContainer, styles.emptyThumbnail, styles.addPhotoButton]}
                  onPress={handleAddPhoto}
                  disabled={profile.photos.length >= 4}
                >
                  <Ionicons name="add" size={24} color="#651B55" />
                </TouchableOpacity>
              );
            } else {
              return (
                <View key={index} style={[styles.thumbnailContainer, styles.emptyThumbnail]}>
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.addPhotoButton}
                      onPress={handleAddPhoto}
                    >
                      <Ionicons name="camera" size={32} color="#651B55" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }
          })}
        </View>

        {/* Profile Fields */}
        <View style={styles.section}>
          {renderField('Name', profile.name, 'name')}
          {renderField('Email', profile.email, 'email')}
          {renderField('Age', profile.age?.toString(), 'age')}
          {profile.gender && renderField('Gender', profile.gender, 'gender')}
          {profile.location && renderField('Location', profile.location, 'location')}
          {profile.orientation && renderField('Orientation', profile.orientation, 'orientation')}

          {/* Bio */}
          <View style={styles.fieldContainer}>
            <PoppinsText style={styles.label}>Bio</PoppinsText>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.bioInput, { fontFamily: 'Poppins_400Regular' }]}
                value={profile.bio || ''}
                onChangeText={(text) => setProfile({ ...profile, bio: text })}
                placeholder="Tell us about yourself"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : (
              <PoppinsText style={styles.value}>
                {profile.bio || 'No bio added yet'}
              </PoppinsText>
            )}
          </View>

          {/* Interest */}
          <View style={styles.fieldContainer}>
            <PoppinsText style={styles.label}>Interest</PoppinsText>
            {isEditing ? (
              <View style={styles.interestsContainer}>
                {INTERESTS.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.interestButton,
                      profile.interests.includes(interest) && styles.selectedInterestButton,
                    ]}
                    onPress={() => setProfile({ ...profile, interests: [interest] })}
                  >
                    <PoppinsText
                      style={[
                        styles.interestText,
                        profile.interests.includes(interest) && styles.selectedInterestText,
                      ]}
                    >
                      {interest}
                    </PoppinsText>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.interestsContainer}>
                {profile.interests && profile.interests[0] ? (
                  <View style={[styles.interestTag, { backgroundColor: '#f0f0f0' }]}>
                    <PoppinsText style={styles.interestText}>
                      {profile.interests[0]}
                    </PoppinsText>
                  </View>
                ) : (
                  <PoppinsText style={styles.value}>No interest selected</PoppinsText>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <PoppinsText style={styles.signOutText}>Sign Out</PoppinsText>
        </TouchableOpacity>
        {isEditing ? (
          <TouchableOpacity
            style={[styles.button, styles.saveButton, (isUpdating || isLoading) && styles.disabledButton]}
            onPress={handleSave}
            disabled={isUpdating || isLoading}
          >
            {isUpdating || isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <PoppinsText style={styles.buttonText}>Save Changes</PoppinsText>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={() => setIsEditing(true)}
            disabled={isLoading}
          >
            <PoppinsText style={styles.buttonText}>Edit Profile</PoppinsText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  profileHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mainPhotoContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#f0f0f0',
    borderRadius: 48,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FF35D3',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
    fontFamily: 'Poppins_600SemiBold',

  },
  profileName: {
    fontSize: 20,
    fontWeight: 600,
    color: '#651B55',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  infoIcon: {
    marginRight: 6,
    color: '#651B55',
  },
  infoText: {
    fontSize: 16,
    fontWeight: 400,
    color: '#651B55',
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
  },
  mainProfileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 10,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnailContainer: {
    width: 150,
    height: 150,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: '1%',
  },
  emptyThumbnail: {
    borderWidth: 1.5,
    borderColor: '#A3A3A3',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  selectedThumbnail: {
    borderColor: '#651B55',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(101, 27, 85, 0.05)',
    shadowColor: '#651B55',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  addPhotoButton: {
    width: '23%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#651B55',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  emptyPhotoSlot: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  saveButton: {
    backgroundColor: '#651B55',
  },
  editButton: {
    backgroundColor: '#4a90e2',
  },
  disabledButton: {
    opacity: 0.6,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width - 40,
    height: height - 200,
    borderRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  navButton: {
    padding: 10,
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 12,
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
    justifyContent: "space-between",
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerIcons: {
    flexDirection: 'row',
    marginLeft: 16,
    padding: 8,
    
  },
  title: {
    fontSize: 24,
    fontWeight: "semibold",
    color: '#000000',
    fontFamily: 'Poppins_600SemiBold',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 15,
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 10,
    right: '35%',
    backgroundColor: '#651B55',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 30,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    fontFamily: 'Poppins_400Regular',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 8,
  },
  interestButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedInterestButton: {
    backgroundColor: '#651B55',
    borderColor: '#651B55',
  },
  selectedInterestText: {
    color: '#fff',
  },
  interestTag: {
    backgroundColor: '#f0e6f7',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#651B55',
    fontSize: 14,
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  signOutButton: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  signOutText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: '600',
  },
});
