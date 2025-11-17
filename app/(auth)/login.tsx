import { PoppinsText } from '@/components/PoppinsText';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Handle login logic here
    console.log('Login with:', { email, password });
    // For now, just navigate to the main app
    router.replace('/(tabs)');
  };

  const navigateToSignUp = () => {
    router.replace('/(auth)/signup');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/LandingLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <PoppinsText weight="bold" style={styles.title}>
          Welcome Back!
        </PoppinsText>
        <PoppinsText style={styles.subtitle}>
          Sign in to continue
        </PoppinsText>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <PoppinsText style={styles.label}>Email</PoppinsText>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <PoppinsText style={styles.label}>Password</PoppinsText>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.forgotPassword}>
            <PoppinsText style={styles.forgotPasswordText}>
              Forgot Password?
            </PoppinsText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <PoppinsText weight="bold" style={styles.buttonText}>
            Sign In
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    color: '#1E1E1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1E1E1E',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
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
});

export default LoginScreen;
