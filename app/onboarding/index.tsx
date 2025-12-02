import { PoppinsText } from '@/components/PoppinsText';
import { Storage } from '@/utils/storage';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function OnboardingScreen() {
  const handleContinue = useCallback(async () => {
    try {
      await Storage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.warn('Failed to set onboarding flag', error);
    }
    router.replace('/(tabs)');
  }, []);

  return (
    <View style={styles.container}>
      <PoppinsText weight="bold" style={styles.title}>
        Welcome to Pairfect
      </PoppinsText>
      <PoppinsText style={styles.subtitle}>
        Tap continue to start using the app.
      </PoppinsText>
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <PoppinsText weight="semiBold" style={styles.buttonText}>
          Continue
        </PoppinsText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#651B55',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
