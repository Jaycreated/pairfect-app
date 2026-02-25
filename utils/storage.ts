import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Make sure we're using the correct SecureStore methods
export const Storage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    // Use the correct method name for SecureStore
    await SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string) {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },

  async deleteItem(key: string) {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },

  async clear() {
    if (Platform.OS === "web") {
      localStorage.clear();
      return;
    }
    // SecureStore doesn't have a clear method, so we need to clear known keys
    const knownKeys = [
      'auth_token',
      'message_count',
      'user_preferences',
      'onboarding_completed',
      'hasLaunched',
      'needsProfileSetup',
      'user',
      'userPhotos',
      'pending_payments',
    ];
    await Promise.all(knownKeys.map(key => SecureStore.deleteItemAsync(key)));
  },

  // Alias for backward compatibility
  async setValueWithKeyAsync(key: string, value: string) {
    return this.setItem(key, value);
  },
  
  // Alias for backward compatibility
  async getValueWithKeyAsync(key: string) {
    return this.getItem(key);
  }
};
