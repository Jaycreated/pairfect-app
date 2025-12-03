import { PoppinsText } from '@/components/PoppinsText';
import { useAuth } from '@/context/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { api } from '@/services/api';
import { Storage } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
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
          email: apiData.email,
          age: apiData.age,
          bio: apiData.bio,
          interests: apiData.interests,
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
      Alert.alert('Error', 'Failed to load profile data');
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
      // In view mode, just select the photo
      setSelectedPhotoIndex(index);
    }
  };

  const handleAddPhoto = () => {
    // TODO: Implement photo upload functionality
    // For now, just add a placeholder
    if (profile.photos.length < 4) {
      const newPhoto = `https://picsum.photos/400/600?random=${Date.now()}`; // Replace with actual photo upload
      setProfile({
        ...profile,
        photos: [...profile.photos, newPhoto]
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...profile.photos];
    newPhotos.splice(index, 1);
    setProfile({
      ...profile,
      photos: newPhotos
    });
    if (selectedPhotoIndex >= newPhotos.length) {
      setSelectedPhotoIndex(Math.max(0, newPhotos.length - 1));
    }
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
          style={styles.input}
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
      <View style={styles.header}>
        <PoppinsText style={styles.title}>My Profile</PoppinsText>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            onPress={() => router.push('/screens/settings')}
            style={{ marginRight: 20 }}
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
            <Ionicons 
              name={isEditing ? 'checkmark' : 'pencil'} 
              size={24} 
              color="#651B55" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Main Profile Photo */}
        <View style={styles.mainPhotoContainer}>
          {profile.photos && profile.photos.length > 0 ? (
            <Image 
              source={{ uri: profile.photos[selectedPhotoIndex] }} 
              style={styles.mainProfileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={50} color="#999" />
            </View>
          )}
        </View>

        {/* Photo Gallery */}
        <View style={styles.photoGallery}>
          {Array.from({ length: 4 }).map((_, index) => {
            if (index < profile.photos.length) {
              return (
                <TouchableOpacity 
                  key={index}
                  onPress={() => handlePhotoSelect(index)}
                  style={[
                    styles.thumbnailContainer,
                    selectedPhotoIndex === index && styles.selectedThumbnail
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
                  key={index}
                  style={styles.addPhotoButton}
                  onPress={handleAddPhoto}
                  disabled={profile.photos.length >= 4}
                >
                  <Ionicons name="add" size={24} color="#651B55" />
                </TouchableOpacity>
              );
            } else {
              return <View key={index} style={styles.emptyPhotoSlot} />;
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
                style={[styles.input, styles.bioInput]}
                value={profile.bio || ''}
                onChangeText={(text) => setProfile({ ...profile, bio: text })}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
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

const styles = StyleSheet.create({
  mainPhotoContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#f0f0f0',
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 16,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FF35D3',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  mainProfileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
    width: '100%',
  },
  thumbnailContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 16,
  },
  selectedThumbnail: {
    borderColor: '#651B55',
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
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
