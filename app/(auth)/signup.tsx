// In app/(auth)/signup.tsx
import { PoppinsText } from '@/components/PoppinsText';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { Storage } from '@/utils/storage';
import { SignUpFormData, signUpSchema } from '@/utils/validations/auth';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

const SignUpScreen = () => {
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const sexualOrientations = [
    { label: 'Straight', value: 'straight' },
    { label: 'Gay', value: 'gay' },
    { label: 'Lesbian', value: 'lesbian' },
    { label: 'Bisexual', value: 'bisexual' },
    { label: 'Other', value: 'other' },
  ];

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      sexualOrientation: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      console.log('Attempting to register with:', data);
      
      // Call the register API
      const response = await api.register({
        name: data.name,
        email: data.email,
        password: data.password,
        sexualOrientation: data.sexualOrientation,
      });
      
      console.log('Registration response:', response);
      
      if (response.error) {
        console.error('Registration error:', response.error);
        throw new Error(response.error.message || 'Registration failed');
      }
      
      // Set a flag indicating profile setup is needed
      await Storage.setItem('needsProfileSetup', 'true');
      
      // Navigate to profile setup on successful registration
      console.log('Navigating to profile setup');
      router.replace('/(auth)/profile-setup');
    } catch (error) {
      console.error('Sign up error:', error);
      showToast(
        error instanceof Error ? error.message : 'An error occurred during registration. Please try again.',
        'error',
        5000
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/LandingLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <PoppinsText weight="bold" style={styles.title}>
            Create Account
          </PoppinsText>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <PoppinsText style={styles.label}>Full Name</PoppinsText>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.name && styles.inputError,
                  ]}
                  placeholder="Enter your name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.name && (
              <PoppinsText style={styles.errorText}>
                {errors.name.message}
              </PoppinsText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <PoppinsText style={styles.label}>Email</PoppinsText>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError,
                  ]}
                  placeholder="Enter your email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && (
              <PoppinsText style={styles.errorText}>
                {errors.email.message}
              </PoppinsText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <PoppinsText style={styles.label}>Sexual Orientation</PoppinsText>
            <Controller
              control={control}
              name="sexualOrientation"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.sexualOrientation && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Select orientation"
                  onFocus={() => {
                    // Using a simple approach - you might want to implement a custom modal for better UX
                    const options = [
                      { text: 'Straight', onPress: () => onChange('straight') },
                      { text: 'Gay', onPress: () => onChange('gay') },
                      { text: 'Lesbian', onPress: () => onChange('lesbian') },
                      { text: 'Bisexual', onPress: () => onChange('bisexual') },
                      { text: 'Other', onPress: () => onChange('other') },
                    ];
                    
                    // Show a toast with instructions
                    showToast('Please select your sexual orientation', 'info', 3000);
                    
                    // You might want to implement a custom picker/modal here
                    // for a better user experience
                  }}
                  showSoftInputOnFocus={false}
                />
              )}
            />
            {errors.sexualOrientation && (
              <PoppinsText style={styles.errorText}>
                {errors.sexualOrientation.message}
              </PoppinsText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <PoppinsText style={styles.label}>Password</PoppinsText>
            <View style={[styles.passwordInputContainer, errors.password && styles.inputError]}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Create a password (min 6 characters)"
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <PoppinsText style={styles.errorText}>
                {errors.password.message}
              </PoppinsText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <PoppinsText style={styles.label}>Confirm Password</PoppinsText>
            <View style={[styles.passwordInputContainer, errors.confirmPassword && styles.inputError]}>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirmPassword}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <PoppinsText style={styles.errorText}>
                {errors.confirmPassword.message}
              </PoppinsText>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, (isLoading) && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <PoppinsText style={styles.buttonText}>
                Create Account
              </PoppinsText>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <PoppinsText style={styles.loginText}>
              Already have an account?{' '}
            </PoppinsText>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <PoppinsText style={styles.loginLink}>Log in</PoppinsText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    marginBottom: 4,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#333',
  },
  scrollContent: {
    padding: 40,
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#651B55',
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#651B55',
    fontWeight: '600',
  },
});

export default SignUpScreen;