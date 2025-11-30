import { PoppinsText } from '@/components/PoppinsText';
import { useSubscription } from '@/context/SubscriptionContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

// Mock notification data
const NOTIFICATIONS: NotificationType[] = [
  {
    id: '0',
    type: 'match',
    user: {
      id: 'premium',
      name: 'New Match!',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60',
    },
    message: 'You have a new match! Subscribe to see who liked you!',
    time: 'Just now',
    read: false,
    isSubscriptionPrompt: true
  } as NotificationType,
  {
    id: '1',
    type: 'like',
    user: {
      id: '2',
      name: 'Alex Johnson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60',
    },
    message: 'liked your profile',
    time: '2m ago',
    read: false,
  },
  {
    id: '2',
    type: 'match',
    user: {
      id: '3',
      name: 'Jordan Smith',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop&q=60',
    },
    message: 'You matched with Jordan!',
    time: '1h ago',
    read: false,
  },
  {
    id: '3',
    type: 'message',
    user: {
      id: '4',
      name: 'Taylor Swift',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60',
    },
    message: 'sent you a message',
    time: '3h ago',
    read: true,
  },
  {
    id: '4',
    type: 'view',
    user: {
      id: '5',
      name: 'Chris Evans',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60',
    },
    message: 'viewed your profile',
    time: '1d ago',
    read: true,
  },
];

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
};

const NotificationsScreen = () => {
  const { subscription } = useSubscription();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Filter out subscription prompt if user is already subscribed
  useEffect(() => {
    const filteredNotifications = NOTIFICATIONS.filter(
      notification => !(notification.isSubscriptionPrompt && subscription)
    ) as NotificationType[];
    setNotifications(filteredNotifications);
  }, [subscription]);

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

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate network request
    setTimeout(() => {
      setRefreshing(false);
      // In a real app, you would fetch new notifications here
    }, 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  const handleNotificationPress = (notification: NotificationType) => {
    if (notification.isSubscriptionPrompt) {
      router.push('/screens/subscribe');
      return;
    }
    markAsRead(notification.id);
    // Navigate based on notification type
    if (notification.type === 'message') {
      router.push(`/messages/${notification.user.id}`);
    } else if (notification.type === 'match') {
      router.push(`/matches`);
    } else {
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
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PoppinsText style={styles.headerTitle}>Notifications</PoppinsText>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
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
});

export default NotificationsScreen;
