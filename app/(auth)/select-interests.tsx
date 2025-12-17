import { PoppinsText } from '@/components/PoppinsText';
import { useToast } from '@/context/ToastContext';
import { Storage } from '@/utils/storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const INTERESTS = [
  'Relationship', 
  'Casual friendship', 
  'Hookup', 
  'Chat buddy', 
  'Friends with benefit',
  'Sugar Mummy', 
  'Sugar Daddy'
] as const;

const SelectInterests = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? [] : [interest]
    );
  };

  const handleContinue = async () => {
    if (selectedInterests.length === 0) {
      showToast('Please select an interest', 'error');
      return;
    }
    
    try {
      // Get the user data from storage
      const userData = await Storage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }
      
      const user = JSON.parse(userData);
      
      // Update user with selected interests
      const updatedUser = {
        ...user,
        interests: selectedInterests
      };
      
      // Save updated user data
      await Storage.setItem('user', JSON.stringify(updatedUser));
      
      // Navigate to photo upload screen
      router.push('/(auth)/photo-upload');
    } catch (error) {
      console.error('Error saving interests:', error);
      showToast('Failed to save interests. Please try again.', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <PoppinsText style={styles.title}>Select Your Interests</PoppinsText>
        <PoppinsText style={styles.subtitle}>Choose an interest to help us find better matches for you</PoppinsText>
        
        <View style={styles.interestsContainer}>
          {INTERESTS.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[
                styles.interestButton,
                selectedInterests.includes(interest) && styles.selectedInterestButton,
              ]}
              onPress={() => toggleInterest(interest)}
            >
              <PoppinsText
                style={[
                  styles.interestText,
                  selectedInterests.includes(interest) && styles.selectedInterestText,
                ]}
              >
                {interest}
              </PoppinsText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            selectedInterests.length < 3 && styles.continueButtonDisabled
          ]} 
          onPress={handleContinue}
          disabled={selectedInterests.length < 3}
        >
          <PoppinsText style={styles.continueButtonText}>
            {selectedInterests.length >= 3 
              ? `Continue (${selectedInterests.length} selected)` 
              : `Select ${3 - selectedInterests.length} more`}
          </PoppinsText>
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
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  interestButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedInterestButton: {
    backgroundColor: '#651B55',
    borderColor: '#651B55',
  },
  interestText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 16,
  },
  selectedInterestText: {
    color: 'white',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  continueButton: {
    backgroundColor: '#651B55',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SelectInterests;
