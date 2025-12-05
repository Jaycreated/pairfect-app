import { PoppinsText } from '@/components/PoppinsText';
import { uploadToCloudinary } from '@/config/cloudinary';
import { api } from '@/services/api';
import { Storage } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const ProfileSetup = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    gender: '',
    name: '',
    age: '',
    location: '',
  });

  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relationshipInterests = [
    'Relationship',
    'Casual Friendship',
    'Hook up',
    'Chat Buddy',
    'Friends with benefits',
    'Sugar Mummy',
    'Sugar Daddy'
  ];

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const pickImage = async () => {
    try {
      console.log('📱 [Image Picker] Requesting permissions');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library to upload images.');
        return;
      }

      console.log('📱 [Image Picker] Launching image picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('📱 [Image Picker] Image selected, starting upload');
        setIsUploading(true);
        const uri = result.assets[0].uri;
        const imageUrl = await uploadToCloudinary(uri);
        setPhotos(prev => [...prev, imageUrl]);
        console.log('✅ [Image Picker] Image uploaded successfully');
      }
    } catch (error) {
      console.error('❌ [Image Picker] Error:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Load profile data when component mounts
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.getProfile();
        if (response.data?.user) {
          const { name, gender, age, location, orientation, interests } = response.data.user;
          setFormData(prev => ({
            ...prev,
            name: name || '',
            gender: gender || '',
            age: age ? age.toString() : '',
            location: location || '',
            orientation: orientation || '',
          }));
          if (interests) {
            setSelectedInterests(interests);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };

    loadProfile();
  }, []);

  const handleNext = async () => {
    console.log('handleNext called, step:', step);
    
    if (!canProceed()) {
      console.log('⏭️ [Profile Setup] Cannot proceed, validation failed');
      return;
    }

    // If not on the final step, just go to next step
    if (step < 4) {
      console.log('⏭️ [Profile Setup] Moving to next step:', step + 1);
      setStep(step + 1);
      return;
    }

    // Only submit on the final step (step 4)
    console.log('Final step - submitting profile data');
    await submitProfile();
  };

  const submitProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert gender to lowercase to match backend expectations
      const genderMapping: Record<string, string> = {
        'Woman': 'female',
        'Man': 'male',
        'Non-binary': 'non_binary'
      };

      const genderValue = genderMapping[formData.gender] || formData.gender?.toLowerCase();
      const ageValue = parseInt(formData.age, 10);
      
      console.log('📝 [Profile Setup] Preparing profile data');
      const profileData = {
        name: formData.name,
        gender: genderValue,
        age: ageValue,
        location: formData.location,
        interests: selectedInterests,
        photos: photos,
      };
      
      console.log('📤 [Profile Setup] Sending profile data:', JSON.stringify(profileData, null, 2));
      
      const response = await api.updateProfile(profileData);
      console.log('✅ [Profile Setup] API Response:', JSON.stringify(response, null, 2));
      
      if (response.error) {
        console.error('❌ [Profile Setup] Profile update error:', response.error);
        if (response.error.errors) {
          const errorMessages = response.error.errors.map((err: any) => 
            `${err.path}: ${err.msg}`
          ).join('\n');
          throw new Error(`Validation failed:\n${errorMessages}`);
        }
        throw new Error(response.error.message || 'Failed to save profile');
      }

      console.log('🔑 [Profile Setup] Clearing temp user data and profile setup flag');
      await Promise.all([
        Storage.deleteItem('tempUser'),
        Storage.deleteItem('needsProfileSetup')
      ]);
      
      console.log('🔄 [Profile Setup] Navigating to /(tabs)');
      router.replace({
        pathname: '/(tabs)',
        params: { screen: 'swipe' }
      });
    } catch (err) {
      console.error('Profile setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const canProceed = () => {
    if (step === 1) return !!formData.gender;
    if (step === 2) return !!formData.name && !!formData.age && !!formData.location;
    if (step === 3) return selectedInterests.length > 0; // Interest selection is step 3
    if (step === 4) return photos.length >= 2; // Require at least 2 photos in step 4
    return false;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <PoppinsText style={styles.stepTitle}>I am a</PoppinsText>
            <View style={styles.genderContainer}>
              {['Woman', 'Man', 'Non-binary'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    formData.gender === gender && styles.genderButtonSelected,
                  ]}
                  onPress={() => handleChange('gender', gender)}
                >
                  <Ionicons
                    name={
                      gender === 'Woman' ? 'female' :
                      gender === 'Man' ? 'male' : 'male-female'
                    }
                    size={32}
                    color={formData.gender === gender ? '#fff' : '#651B55'}
                  />
                  <PoppinsText
                    style={[
                      styles.genderText,
                      formData.gender === gender && styles.genderTextSelected,
                    ]}
                  >
                    {gender}
                  </PoppinsText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <PoppinsText style={styles.stepTitle}>My name is</PoppinsText>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              autoCapitalize="words"
              placeholderTextColor="#999"
            />

            <PoppinsText style={[styles.stepTitle, { marginTop: 30 }]}>I am</PoppinsText>
            <View style={styles.ageContainer}>
              <TextInput
                style={[styles.input, styles.ageInput]}
                placeholder="Age"
                value={formData.age}
                onChangeText={(text) => handleChange('age', text)}
                keyboardType="number-pad"
                maxLength={2}
                placeholderTextColor="#999"
              />
              <PoppinsText style={styles.yearsOld}>years old</PoppinsText>
            </View>

            <PoppinsText style={[styles.stepTitle, { marginTop: 30 }]}>I live in</PoppinsText>
            <TextInput
              style={styles.input}
              placeholder="Enter your location"
              value={formData.location}
              onChangeText={(text) => handleChange('location', text)}
              placeholderTextColor="#999"
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <PoppinsText style={styles.stepTitle}>What are you looking for?</PoppinsText>
            <PoppinsText style={styles.subtitle}>Select all that apply</PoppinsText>

            <View style={styles.interestsGrid}>
              {relationshipInterests.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestButton,
                    selectedInterests.includes(interest) && styles.interestButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedInterests(prev =>
                      prev.includes(interest)
                        ? prev.filter(i => i !== interest)
                        : [...prev, interest]
                    );
                  }}
                >
                  <PoppinsText
                    style={[
                      styles.interestButtonText,
                      selectedInterests.includes(interest) && styles.interestButtonTextSelected,
                    ]}
                  >
                    {interest}
                  </PoppinsText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <PoppinsText style={styles.stepTitle}>Add Your Photos</PoppinsText>
            <PoppinsText style={styles.subtitle}>Upload at least 2 photos to continue</PoppinsText>
            
            <View style={styles.photosContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity 
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {photos.length < 6 && (
                <TouchableOpacity 
                  style={styles.addPhotoButton}
                  onPress={pickImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#666" />
                  ) : (
                    <Ionicons name="add" size={40} color="#666" />
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            {photos.length < 2 && (
              <PoppinsText style={styles.errorText}>
                Please upload at least 2 photos
              </PoppinsText>
            )}
          </View>
        );
        return (
          <View style={styles.stepContainer}>
            <PoppinsText style={styles.stepTitle}>What are you looking for?</PoppinsText>
            <PoppinsText style={styles.subtitle}>Select all that apply</PoppinsText>

            <View style={styles.interestsGrid}>
              {relationshipInterests.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestButton,
                    selectedInterests.includes(interest) && styles.interestButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedInterests(prev =>
                      prev.includes(interest)
                        ? prev.filter(i => i !== interest)
                        : [...prev, interest]
                    );
                  }}
                >
                  <PoppinsText
                    style={[
                      styles.interestButtonText,
                      selectedInterests.includes(interest) && styles.interestButtonTextSelected,
                    ]}
                  >
                    {interest}
                  </PoppinsText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Dots */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              step >= i && styles.progressDotActive
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <PoppinsText style={styles.title}>
          {step === 4 ? 'Almost there!' : 'Tell us about yourself'}
        </PoppinsText>

        <PoppinsText style={styles.subtitle}>
          {step === 1 ? 'This helps us create your personalized experience' :
           step === 2 ? 'Help others get to know you' :
           step === 3 ? 'What kind of connections are you looking for?' :
           'Almost there! Just a few more details'}
        </PoppinsText>

        {renderStep()}
      </ScrollView>

      {/* Footer Action Button */}
      <View style={styles.footer}>
        {error && (
          <View style={styles.errorContainer}>
            <PoppinsText style={styles.errorText}>{error}</PoppinsText>
          </View>
        )}
        <TouchableOpacity
          style={[styles.button, (!canProceed() || isLoading) && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <PoppinsText style={styles.buttonText}>
              {step === 4 ? 'Complete Profile' : 'Continue'}
            </PoppinsText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#651B55',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  stepContainer: {
    marginTop: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    width: '30%',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  genderButtonSelected: {
    backgroundColor: '#651B55',
  },
  genderText: {
    marginTop: 8,
    fontSize: 16,
  },
  genderTextSelected: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageInput: {
    flex: 1,
    marginRight: 15,
  },
  yearsOld: {
    fontSize: 16,
    color: '#666',
  },
  orientationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  orientationButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
    marginBottom: 10,
  },
  orientationButtonSelected: {
    backgroundColor: '#651B55',
  },
  orientationText: {
    fontSize: 16,
  },
  orientationTextSelected: {
    color: '#fff',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 10,
    marginBottom: 10,
  },
  interestButtonSelected: {
    backgroundColor: '#651B55',
  },
  interestButtonText: {
    fontSize: 16,
  },
  interestButtonTextSelected: {
    color: '#fff',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#651B55',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#D1C4E9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    marginBottom: 10,
  },
  photoContainer: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.66%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.66%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
});

export default ProfileSetup;