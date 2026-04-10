import { PoppinsText } from '@/components/PoppinsText';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const { token } = useLocalSearchParams<{ token: string }>();

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword) {
      showToast('Please enter a new password', 'error');
      return;
    }

    if (!confirmPassword) {
      showToast('Please confirm your new password', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (!token) {
      showToast('Invalid reset token. Please request a new password reset.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.resetPassword(token, newPassword);
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to reset password');
      }
      
      showToast('Password reset successfully! Please login with your new password.', 'success');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.formContainer}>
          <PoppinsText style={styles.title}>Reset Password</PoppinsText>
          <PoppinsText style={styles.subtitle}>
            Enter your new password below.
          </PoppinsText>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            <PoppinsText style={styles.buttonText}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </PoppinsText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.backButton}>
            <PoppinsText style={styles.backButtonText}>Back to Login</PoppinsText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    fontFamily: 'Poppins_500Bold',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 30,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#651B55',
    padding: 15,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#651B55',
    fontSize: 16,
  },
});
