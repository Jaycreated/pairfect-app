import { api } from '@/services/api';
import { getAuthToken } from '@/services/userService';
import { debugLogger } from '@/utils/debugLogger';
import { registerForPushNotificationsAsync } from '@/utils/notifications';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export function NotificationTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testNotificationRegistration = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      debugLogger.info('🚀 Starting notification registration test');
      addResult('🚀 Starting notification registration test...');
      
      // 1. Check if user is authenticated
      debugLogger.debug('Checking authentication status');
      const token = await getAuthToken();
      if (!token) {
        debugLogger.error('No auth token found - user not logged in');
        addResult('❌ No auth token found - user not logged in');
        return;
      }
      debugLogger.info('Auth token found', { tokenLength: token.length });
      addResult('✅ Auth token found');
      
      // 2. Get Expo push token
      debugLogger.debug('Attempting to get Expo push token');
      addResult('📱 Getting Expo push token...');
      const expoPushToken = await registerForPushNotificationsAsync();
      
      if (!expoPushToken) {
        debugLogger.error('Failed to get Expo push token');
        addResult('❌ Failed to get Expo push token');
        addResult('💡 Make sure you\'re running on a physical device');
        return;
      }
      
      debugLogger.info('Expo push token obtained', { 
        token: expoPushToken.substring(0, 20) + '...',
        tokenLength: expoPushToken.length 
      });
      addResult(`✅ Expo push token: ${expoPushToken.substring(0, 20)}...`);
      
      // 3. Register token with backend
      debugLogger.info('Registering token with backend');
      addResult('📡 Registering token with backend...');
      
      // Use debugFetch for detailed network logging
      const response = await api.registerPushToken(expoPushToken);
      
      if (response.error) {
        debugLogger.error('Backend registration failed', {
          error: response.error.message,
          status: response.error.status
        });
        addResult(`❌ Backend error: ${response.error.message}`);
        addResult(`📊 Status: ${response.error.status || 'N/A'}`);
      } else {
        debugLogger.info('Token successfully registered with backend', response.data);
        addResult('✅ Token successfully registered with backend!');
        addResult('📄 Backend response: ' + JSON.stringify(response.data));
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugLogger.error('Test failed with exception', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      addResult(`💥 Test failed: ${errorMessage}`);
      
      // Show alert for critical errors
      Alert.alert('Test Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View className="p-4 bg-white rounded-lg shadow-md m-4">
      <Text className="text-lg font-bold mb-4">Notification Registration Test</Text>
      
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          onPress={testNotificationRegistration}
          disabled={isLoading}
          className={`flex-1 p-3 rounded-lg ${
            isLoading 
              ? 'bg-gray-300' 
              : 'bg-blue-500'
          }`}
        >
          <Text className="text-white text-center font-semibold">
            {isLoading ? 'Testing...' : 'Test Registration'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={clearResults}
          className="p-3 bg-gray-500 rounded-lg"
        >
          <Text className="text-white font-semibold">Clear</Text>
        </TouchableOpacity>
      </View>
      
      {testResults.length > 0 && (
        <ScrollView className="max-h-64 bg-gray-50 rounded-lg p-3">
          {testResults.map((result, index) => (
            <Text key={index} className="text-xs mb-1 font-mono">
              {result}
            </Text>
          ))}
        </ScrollView>
      )}
      
      <View className="mt-4 p-3 bg-blue-50 rounded-lg">
        <Text className="text-xs text-blue-800">
          💡 This test will:
        </Text>
        <Text className="text-xs text-blue-600 mt-1">
          {"• Check if you're logged in"}
        </Text>
        <Text className="text-xs text-blue-600">
          • Get your Expo push token
        </Text>
        <Text className="text-xs text-blue-600">
          • Register it with the backend
        </Text>
        <Text className="text-xs text-blue-600">
          • Show detailed results
        </Text>
      </View>
      
      <View className="mt-2 p-3 bg-yellow-50 rounded-lg">
        <Text className="text-xs text-yellow-800">
          ⚠️ Expo Go Notes:
        </Text>
        <Text className="text-xs text-yellow-600 mt-1">
          • Push tokens work but notifications may be limited
        </Text>
        <Text className="text-xs text-yellow-600">
          • For full testing, use a development build
        </Text>
        <Text className="text-xs text-yellow-600">
          • Backend registration will still work
        </Text>
      </View>
      
      <View className="mt-2 p-3 bg-purple-50 rounded-lg">
        <Text className="text-xs text-purple-800">
          🔍 Debug Features:
        </Text>
        <Text className="text-xs text-purple-600 mt-1">
          • All actions are logged to debug console
        </Text>
        <Text className="text-xs text-purple-600">
          • Tap the 🐛 button to view detailed logs
        </Text>
        <Text className="text-xs text-purple-600">
          • Export logs for troubleshooting
        </Text>
      </View>
    </View>
  );
}
