import { useAuth } from '@/context/AuthContext';
import { getUserSettings, updateUserSettings, UserSettings } from '@/services/userService';
import { Storage } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const SettingsScreen = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user settings on mount
  useEffect(() => {
    console.log('⚙️ [Settings] Component mounted, checking auth state...');
    
    const loadSettings = async () => {
      try {
        console.log('⚙️ [Settings] Attempting to load settings...');
        const token = await Storage.getItem('auth_token');
        console.log('⚙️ [Settings] Token in loadSettings:', token ? 'Exists' : 'Not found');
        
        if (!token) {
          console.log('⚠️ [Settings] No token found, user might need to log in');
          Alert.alert('Authentication Required', 'Please log in to access settings');
          router.replace('/(auth)/login');
          return;
        }

        console.log('⚙️ [Settings] Fetching user settings...');
        const userSettings = await getUserSettings();
        console.log('✅ [Settings] Settings loaded successfully:', userSettings);
        setSettings(userSettings);
      } catch (error) {
        console.error('❌ [Settings] Failed to load settings:', error);
        Alert.alert('Error', 'Failed to load settings. Please try again.');
        router.replace('/(auth)/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [router]);


  // Handle nested notification settings update
  const handleNotificationSettingChange = async (key: keyof UserSettings['notifications'], value: boolean) => {
    console.log('Toggle clicked:', { key, value, currentSettings: settings });
    
    if (!settings) {
      console.error('Cannot update settings: settings is null');
      return;
    }
    
    try {
      // Create updated settings object
      const updatedSettings: UserSettings = {
        ...settings,
        notifications: {
          ...settings.notifications,
          [key]: value
        }
      };
      
      console.log('Updating settings to:', updatedSettings);
      
      // Update local state immediately for better UX
      setSettings(updatedSettings);
      
      // Call the API to update settings on the server
      const result = await updateUserSettings(updatedSettings);
      console.log('Server response:', result);
      
      // Update with the server's response to ensure consistency
      setSettings(result);
      
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      // Revert to previous settings on error
      setSettings(settings);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // The signOut function already handles navigation to login
    } catch (error) {
      console.error('Failed to sign out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (isLoading || !settings) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#651B55" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={() => router.push('/(tabs)/profile')}
          disabled={isLoading}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="person-outline" size={24} color={isLoading ? '#ccc' : '#333'} />
            <Text style={[styles.settingText, isLoading && styles.disabledText]}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons 
              name="notifications-outline" 
              size={24} 
              color={isLoading ? '#ccc' : '#333'} 
            />
            <Text style={[styles.settingText, isLoading && styles.disabledText]}>
              New Matches
            </Text>
          </View>
          {isLoading ? (
            <ActivityIndicator color="#651B55" />
          ) : (
            <Switch
              trackColor={{ false: '#f4f3f4', true: '#e0d3e6' }}
              thumbColor="#651B55"
              value={settings.notifications.matches}
              onValueChange={(value) => handleNotificationSettingChange('matches', value)}
              disabled={isLoading}
            />
          )}
        </View>

        <View style={[styles.settingItem, styles.settingItemNested]}>
          <View style={styles.settingLeft}>
            <Ionicons 
              name="chatbubbles-outline" 
              size={24} 
              color={isLoading ? '#ccc' : '#333'} 
            />
            <Text style={[styles.settingText, isLoading && styles.disabledText]}>
              Messages
            </Text>
          </View>
          {isLoading ? (
            <ActivityIndicator color="#651B55" />
          ) : (
            <Switch
              trackColor={{ false: '#f4f3f4', true: '#e0d3e6' }}
              thumbColor="#651B55"
              value={settings.notifications.messages}
              onValueChange={(value) => handleNotificationSettingChange('messages', value)}
              disabled={isLoading}
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={() => router.push('/screens/help-support')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.settingText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.settingItem, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log Out</Text>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    color: '#651B55',
    fontSize: 16,
  },
  disabledText: {
    color: '#ccc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 16,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  settingItemNested: {
    paddingLeft: 52,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  nestedText: {
    color: '#666',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  logoutButton: {
    justifyContent: 'center',
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
});

export default SettingsScreen;
