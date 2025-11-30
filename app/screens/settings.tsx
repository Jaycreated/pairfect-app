import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const SettingsScreen = () => {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      // The signOut function already handles navigation to login
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(tabs)/profile')}>
          <View style={styles.settingLeft}>
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.settingText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Switch
            trackColor={{ false: '#f4f3f4', true: '#e0d3e6' }}
            thumbColor="#651B55"
            value={true}
            onValueChange={() => {}}
          />
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
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
