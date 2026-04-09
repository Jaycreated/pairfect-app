import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
import { debugLogger } from '@/utils/debugLogger';

export function DebugPanel() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadLogs();
    }
  }, [isVisible]);

  const loadLogs = async () => {
    try {
      const logEntries = await debugLogger.getLogs();
      const formattedLogs = logEntries.map(entry => 
        `[${entry.timestamp}] ${entry.level}: ${entry.message}`
      );
      setLogs(formattedLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const clearLogs = async () => {
    try {
      await debugLogger.clearLogs();
      setLogs([]);
      Alert.alert('Success', 'Logs cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear logs');
    }
  };

  const exportLogs = async () => {
    try {
      const exportData = await debugLogger.exportLogs();
      
      // Try to share the logs
      try {
        await Share.share({
          message: exportData,
          title: 'Debug Logs Export',
        });
      } catch (shareError) {
        // If sharing fails, copy to clipboard fallback
        Alert.alert(
          'Export Complete',
          'Logs exported to console. Check your development tools.',
          [{ text: 'OK' }]
        );
        console.log('=== DEBUG LOGS EXPORT ===');
        console.log(exportData);
        console.log('=== END DEBUG LOGS ===');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600';
      case 'WARN': return 'text-yellow-600';
      case 'DEBUG': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (!isVisible) {
    return (
      <View className="fixed bottom-4 right-4 z-50">
        <TouchableOpacity
          onPress={() => setIsVisible(true)}
          className="bg-blue-500 p-3 rounded-full shadow-lg"
        >
          <Text className="text-white font-bold text-lg">🐛</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="absolute inset-0 bg-black bg-opacity-90 z-50 p-4">
      <View className="bg-white rounded-lg flex-1">
        <View className="flex-row justify-between items-center p-4 border-b">
          <Text className="text-lg font-bold">Debug Console</Text>
          <TouchableOpacity
            onPress={() => setIsVisible(false)}
            className="bg-red-500 px-3 py-1 rounded"
          >
            <Text className="text-white text-sm">Close</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-2 p-4 border-b">
          <TouchableOpacity
            onPress={loadLogs}
            className="bg-blue-500 px-3 py-1 rounded flex-1"
          >
            <Text className="text-white text-sm text-center">Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={clearLogs}
            className="bg-yellow-500 px-3 py-1 rounded flex-1"
          >
            <Text className="text-white text-sm text-center">Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={exportLogs}
            className="bg-green-500 px-3 py-1 rounded flex-1"
          >
            <Text className="text-white text-sm text-center">Export</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {logs.length === 0 ? (
            <Text className="text-gray-500 text-center">No logs available</Text>
          ) : (
            logs.map((log, index) => {
              const level = log.match(/\[(.*?)\]/)?.[1] || 'INFO';
              return (
                <View key={index} className="mb-2">
                  <Text className={`text-xs font-mono ${getLevelColor(level)}`}>
                    {log}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        <View className="p-4 border-t bg-gray-50">
          <Text className="text-xs text-gray-600 mb-2">
            💡 Tips:
          </Text>
          <Text className="text-xs text-gray-500">
            • Logs are saved persistently
          </Text>
          <Text className="text-xs text-gray-500">
            • Export to share for debugging
          </Text>
          <Text className="text-xs text-gray-500">
            • Works in development builds
          </Text>
        </View>
      </View>
    </View>
  );
}
