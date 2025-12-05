import { useWebSocket } from '@/context/WebSocketContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const WebSocketDebug = () => {
  const { connectionStatus, socketId, isConnected, reconnect } = useWebSocket();
  
  // Only show in development
  if (!__DEV__) return null;
  
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50'; // Green
      case 'connecting': return '#FFC107'; // Amber
      case 'disconnected': return '#F44336'; // Red
      case 'error': return '#9C27B0'; // Purple
      default: return '#9E9E9E'; // Grey
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() + '33' }]}>
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>
          WebSocket: {connectionStatus.toUpperCase()}
          {socketId && ` (${socketId.substring(0, 8)})`}
        </Text>
      </View>
      
      {!isConnected && (
        <TouchableOpacity onPress={reconnect} style={styles.reconnectButton}>
          <Text style={styles.reconnectText}>Reconnect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#333',
  },
  reconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reconnectText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
});
