import { PoppinsText } from '@/components/PoppinsText';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { LoginFormData, loginSchema } from '@/utils/validations/auth';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const LoginScreen = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const { signIn, isLoading, error } = useAuth();
  const { showToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle auth errors
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data);
      // The actual navigation will be handled by the auth state change in AuthContext
    } catch (error) {
      // Errors are already handled by the auth context
      console.error('Login error:', error);
    }
  };

  const navigateToSignUp = () => {
    router.replace('/(auth)/signup');
  };

  const navigateToForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };


  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
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
          </View>

          <PoppinsText style={styles.welcomeText}>
            Welcome Back
          </PoppinsText>
           <PoppinsText style={styles.welcomeText2}>
            Sign In to Your Account
          </PoppinsText>

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
            {errors.email && (
              <PoppinsText style={styles.errorText}>
                {errors.email.message}
              </PoppinsText>
            )}

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, styles.passwordInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
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
              )}
            />
            {errors.password && (
              <PoppinsText style={styles.errorText}>
                {errors.password.message}
              </PoppinsText>
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <PoppinsText style={styles.buttonText}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </PoppinsText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={navigateToForgotPassword}
            >
              <PoppinsText style={styles.forgotPasswordText}>
                Forgot Password?
              </PoppinsText>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <PoppinsText style={styles.signupText}>
                Don't have an account?{' '}
              </PoppinsText>
              <TouchableOpacity onPress={navigateToSignUp}>
                <PoppinsText style={styles.signupLink}>Sign Up</PoppinsText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
    fontFamily: 'Poppins_500Bold',
  },
  welcomeText2: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#636363',
    fontFamily: 'Poppins_400Regular',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    flexGrow: 1,
    padding: 25,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 70,
    height: 70,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: '#651B55',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: '#666',
  },
  signupLink: {
    color: '#1E1E1E',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
});

export default LoginScreen;