import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { PoppinsText } from '@/components/PoppinsText';
import { router } from 'expo-router';

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSignUp = () => {
    // Handle sign up logic here
    console.log('Sign up with:', { name, email, password });
    // For now, just navigate to the main app
    router.replace('/(tabs)');
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
          Create Account
        </PoppinsText>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <PoppinsText style={styles.label}>Full Name</PoppinsText>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

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
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.signUpButton}
          onPress={handleSignUp}
        >
          <PoppinsText weight="semiBold" style={styles.signUpButtonText}>
            Sign Up
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
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
