import { PoppinsText } from '@/components/PoppinsText';
import { SignUpFormData, signUpSchema } from '@/utils/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const SignUpScreen = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      console.log('Sign up with:', data);
      // Replace with actual signup logic
      // await AuthService.signUp(data);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Sign up error:', error);
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
                  autoCorrect={false}
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
            <PoppinsText style={styles.label}>Password</PoppinsText>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.password && styles.inputError,
                  ]}
                  placeholder="Create a password (min 8 characters)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                />
              )}
            />
            {errors.password && (
              <PoppinsText style={styles.errorText}>
                {errors.password.message}
              </PoppinsText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <PoppinsText style={styles.label}>Confirm Password</PoppinsText>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.confirmPassword && styles.inputError,
                  ]}
                  placeholder="Confirm your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                />
              )}
            />
            {errors.confirmPassword && (
              <PoppinsText style={styles.errorText}>
                {errors.confirmPassword.message}
              </PoppinsText>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.signUpButton, 
              isSubmitting && styles.buttonDisabled
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <PoppinsText weight="semiBold" style={styles.signUpButtonText}>
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </PoppinsText>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <PoppinsText style={styles.loginText}>
              Already have an account?{' '}
            </PoppinsText>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <PoppinsText weight="semiBold" style={styles.loginLink}>
                Log In
              </PoppinsText>
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
  scrollContent: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    color: '#651B55',
    marginBottom: 10,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingBottom: 40, // Add some padding at the bottom for better scrolling
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF0EF',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpButton: {
    backgroundColor: '#651B55',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#651B55',
  },
});

export default SignUpScreen;
