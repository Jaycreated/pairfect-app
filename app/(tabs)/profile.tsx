import { PoppinsText } from '@/components/PoppinsText';
import { useAuth } from '@/context/AuthContext';
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
  name: string;
  email: string;
  age: string;
  bio: string;
  interests: string[];
  photos: string[];
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: user?.email || '',
    age: '',
    bio: '',
    interests: [],
    photos: [],
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      // Load profile data from storage
      const userData = await Storage.getItem('user');
      const userPhotos = await Storage.getItem('userPhotos');
      
      if (userData) {
        const parsedData = JSON.parse(userData);
        setProfile(prev => ({
          ...prev,
          ...parsedData,
          photos: userPhotos ? JSON.parse(userPhotos) : [],
        }));
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
      // Save updated profile to storage
      await Storage.setItem('user', JSON.stringify(profile));
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
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

  const renderField = (label: string, value: string, key: keyof UserProfile) => {
    return isEditing ? (
      <View style={styles.fieldContainer}>
        <PoppinsText style={styles.label}>{label}</PoppinsText>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => setProfile({ ...profile, [key]: text })}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </View>
    ) : (
      <View style={styles.fieldContainer}>
        <PoppinsText style={styles.label}>{label}</PoppinsText>
        <PoppinsText style={styles.value}>{value || 'Not set'}</PoppinsText>
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
          {renderField('Age', profile.age, 'age')}
          
          {/* Bio */}
          <View style={styles.fieldContainer}>
            <PoppinsText style={styles.label}>Bio</PoppinsText>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={profile.bio}
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

          {/* Interests */}
          <View style={styles.fieldContainer}>
            <PoppinsText style={styles.label}>Interests</PoppinsText>
            <View style={styles.interestsContainer}>
              {profile.interests && profile.interests.length > 0 ? (
                profile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <PoppinsText style={styles.interestText}>{interest}</PoppinsText>
                  </View>
                ))
              ) : (
                <PoppinsText style={styles.value}>No interests selected</PoppinsText>
              )}
            </View>
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
    borderBottomColor: '#f0f0f0',
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
