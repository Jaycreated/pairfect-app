import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { schedulePushNotification } from '@/utils/notifications';

export default function NotificationTest() {
  const [token, setToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('Unknown');

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
  };

  const getToken = async () => {
    try {
      const projectId = '52cdb0e5-ce26-4188-95b1-febc3d7b744f';
      const expoPushToken = await Notifications.getExpoPushTokenAsync({ projectId });
      setToken(expoPushToken.data);
      console.log('Push token:', expoPushToken.data);
    } catch (error) {
      console.error('Error getting token:', error);
      Alert.alert('Error', 'Failed to get push token');
    }
  };

  const testLocalNotification = async () => {
    try {
      await schedulePushNotification(
        'Test Notification',
        'This is a test notification from Pairfect!',
        { type: 'test' }
      );
      Alert.alert('Success', 'Test notification scheduled');
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  React.useEffect(() => {
    checkPermissions();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Test Panel</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.label}>Permission Status:</Text>
        <Text style={styles.value}>{permissionStatus}</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.label}>Push Token:</Text>
        <Text style={styles.token} selectable>
          {token || 'Not fetched'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={requestPermissions}>
        <Text style={styles.buttonText}>Request Permissions</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={getToken}>
        <Text style={styles.buttonText}>Get Push Token</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testLocalNotification}>
        <Text style={styles.buttonText}>Test Local Notification</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: '#666',
  },
  token: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
