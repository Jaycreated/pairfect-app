import { PoppinsText } from '@/components/PoppinsText';
import { useSubscription } from '@/context/SubscriptionContext';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

// Format time to relative time (e.g., '2m ago')
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return 'Just now';
};

type NotificationType = {
  id: string;
  type: 'like' | 'match' | 'message' | 'view' | 'other';
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  message: string;
  time: string;
  read: boolean;
  isSubscriptionPrompt?: boolean;
  createdAt: string;
};

const NotificationsScreen = () => {
  const { subscription } = useSubscription();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const [notificationsRes, unreadRes] = await Promise.all([
        api.getNotifications(),
        api.getUnreadNotificationCount()
      ]);

      if (notificationsRes.data) {
        const formattedNotifications = notificationsRes.data.map((n: any) => ({
          ...n,
          user: n.user || {
            id: 'unknown',
            name: 'Unknown User',
            avatar: 'https://i.pravatar.cc/150?img=32' // Default avatar
          },
          time: formatTimeAgo(n.createdAt || new Date().toISOString())
        }));
        setNotifications(formattedNotifications);
      }

      if (unreadRes.data) {
        setUnreadCount(unreadRes.data.count);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Fetch notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications();
    }, [])
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'match':
        return 'heart-circle';
      case 'message':
        return 'chatbubble';
      case 'view':
        return 'eye';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like':
        return '#FF4081';
      case 'match':
        return '#4CAF50';
      case 'message':
        return '#2196F3';
      case 'view':
        return '#9C27B0';
      default:
        return '#651B55';
    }
  };

  const handleNotificationPress = async (notification: NotificationType) => {
    if (notification.isSubscriptionPrompt) {
      router.push('/screens/subscribe');
      return;
    }

    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'message') {
      router.push(`/messages/${notification.user.id}`);
    } else if (notification.type === 'match') {
      router.push(`/matches`);
    } else if (notification.user?.id) {
      router.push(`/user/${notification.user.id}`);
    }
  };

  const renderNotification = ({ item }: { item: NotificationType }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification,
        item.isSubscriptionPrompt && styles.subscriptionPrompt,
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: item.user?.avatar || 'https://i.pravatar.cc/150?img=32' }} 
          style={styles.avatar} 
          defaultSource={{ uri: 'https://i.pravatar.cc/150?img=32' }}
        />
        <View style={[
          styles.notificationIcon,
          { backgroundColor: getNotificationColor(item.type) }
        ]}>
          <Ionicons 
            name={getNotificationIcon(item.type) as any} 
            size={16} 
            color="#fff"
          />
        </View>
      </View>
      <View style={styles.notificationContent}>
        <PoppinsText style={styles.notificationText}>
          <PoppinsText style={styles.userName}>{item.user.name} </PoppinsText>
          {item.message}
        </PoppinsText>
        <PoppinsText style={styles.timeAgo}>{item.time}</PoppinsText>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#651B55" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="warning-outline" size={48} color="#ff4d4f" />
        <PoppinsText style={styles.errorText}>{error}</PoppinsText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchNotifications}
        >
          <PoppinsText style={styles.retryButtonText}>Try Again</PoppinsText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <PoppinsText style={styles.headerTitle}>Notifications</PoppinsText>
          {unreadCount > 0 && (
            <PoppinsText style={styles.unreadCount}>
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </PoppinsText>
          )}
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <PoppinsText style={styles.markAllButton}>
              Mark all as read
            </PoppinsText>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notificationList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#651B55']}
            tintColor="#651B55"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <PoppinsText style={styles.emptyText}>No notifications yet</PoppinsText>
            <PoppinsText style={styles.emptySubtext}>
              When you get notifications, they'll appear here
            </PoppinsText>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationList: {
    paddingBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: '#f9f0ff',
  },
  subscriptionPrompt: {
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  notificationIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationContent: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    color: '#333',
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#651B55',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#651B55',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  unreadCount: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  markAllButton: {
    color: '#651B55',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default NotificationsScreen;
