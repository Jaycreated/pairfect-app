import { PoppinsText } from '@/components/PoppinsText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { Storage } from '@/utils/storage';

const ProfileSetup = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    gender: '',
    name: '',
    age: '',
    location: '',
    orientation: '',
  });

  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const relationshipInterests = [
    'Relationship',
    'Casual Friendship',
    'Hook up',
    'Chat Buddy',
    'Friends with benefits',
    'Sugar Mummy',
    'Sugar Daddy'
  ];

  // FORM UPDATES
  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // NEXT STEP OR COMPLETE PROFILE
  const handleNext = async () => {
    if (!canProceed()) return;

    if (step < 4) {
      setStep(step + 1);
      return;
    }

    try {
      const tempUser = await Storage.getItem('tempUser');

      if (!tempUser) {
        throw new Error('User data not found. Please sign up again.');
      }

      const user = JSON.parse(tempUser);

      const finalUser = {
        ...user,
        profile: {
          ...formData,
          interests: selectedInterests
        }
      };

      await Storage.setItem('user', JSON.stringify(finalUser));
      await Storage.deleteItem('tempUser');
      router.push('/(auth)/select-interests');

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to complete profile setup. Please try again.');
    }
  };

  // BACK HANDLING
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  // VALIDATION
  const canProceed = () => {
    if (step === 1) return !!formData.gender;
    if (step === 2) return !!formData.name && !!formData.age && !!formData.location;
    if (step === 3) return !!formData.orientation;
    if (step === 4) return selectedInterests.length > 0;
    return false;
  };

  // STEP RENDERER
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
            <PoppinsText style={styles.stepTitle}>I'm interested in</PoppinsText>
            <View style={styles.orientationContainer}>
              {['Men', 'Women', 'Everyone'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.orientationButton,
                    formData.orientation === item && styles.orientationButtonSelected,
                  ]}
                  onPress={() => handleChange('orientation', item)}
                >
                  <PoppinsText
                    style={[
                      styles.orientationText,
                      formData.orientation === item && styles.orientationTextSelected,
                    ]}
                  >
                    {item}
                  </PoppinsText>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* PHOTO PLACEHOLDER */}
            <View style={styles.photoUploadContainer}>
              <PoppinsText style={styles.stepTitle}>Add Photos</PoppinsText>
              <PoppinsText style={styles.subtitle}>Add at least 2 photos to continue</PoppinsText>
              <View style={styles.photoGrid}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.photoPlaceholder}>
                    <Ionicons name="add" size={32} color="#999" />
                  </View>
                ))}
              </View>
            </View>
          </View>
        );

      case 4:
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

      {/* PROGRESS DOTS */}
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

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.content}>
        <PoppinsText style={styles.title}>
          {step === 4 ? 'Almost there!' : 'Tell us about yourself'}
        </PoppinsText>

        <PoppinsText style={styles.subtitle}>
          {step === 1 ? 'This helps us create your personalized experience' :
           step === 2 ? 'Help others get to know you' :
           step === 3 ? 'Almost there! Just a few more details' :
           'What kind of connections are you looking for?'}
        </PoppinsText>

        {renderStep()}
      </ScrollView>

      {/* FOOTER ACTION BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !canProceed() && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <PoppinsText style={styles.buttonText}>
            {step === 4 ? 'Complete Profile' : 'Continue'}
          </PoppinsText>
        </TouchableOpacity>
      </View>

    </View>
  );
};

/* ========================= STYLES ======================== */

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
  /* GENDER */
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
  /* INPUTS */
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
  /* ORIENTATION */
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
  /* PHOTOS */
  photoUploadContainer: {
    marginTop: 30,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  photoPlaceholder: {
    width: '48%',
    aspectRatio: 0.8,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  /* INTERESTS */
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
  /* FOOTER */
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
});

export default ProfileSetup;
