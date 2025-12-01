import { PoppinsText } from '@/components/PoppinsText';
import { useAuth } from '@/context/AuthContext';
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
  const [isLoading, setIsLoading] = useState(true);
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

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
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
      
      // Update profile via API
      const response = await api.updateProfile(profileData);
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to update profile');
      }
      
      // Update local storage
      await Storage.setItem('user', JSON.stringify({
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
        await Storage.setItem('userPhotos', JSON.stringify(profile.photos));
      }
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
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
        <View style={{ width: 24 }} /> {/* Spacer to balance the header */}
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
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          {profile.photos && profile.photos.length > 0 ? (
            <Image 
              source={{ uri: profile.photos[0] }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={50} color="#999" />
            </View>
          )}
          {isEditing && (
            <TouchableOpacity style={styles.editPhotoButton}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          )}
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
                value={profile.bio ||}
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
      </ScrollView>
    </View>
  );
}

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
