import { useMessageCount } from '@/context/MessageCountContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FreeMessageCounterProps {
  style?: any;
}

export const FreeMessageCounter: React.FC<FreeMessageCounterProps> = ({ style }) => {
  const { remainingFreeMessages, messageCount, isLoading } = useMessageCount();
  const { subscription } = useSubscription();

  // Don't show anything if user has subscription or still loading
  if (isLoading || subscription) {
    return null;
  }

  // Don't show if user has unlimited messages (has paid access)
  if (messageCount?.hasPaidAccess) {
    return null;
  }

  // Don't show if no free messages remaining
  if (remainingFreeMessages <= 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="chatbubble-outline" size={16} color="#651B55" />
      <Text style={styles.text}>
        {remainingFreeMessages} free message{remainingFreeMessages !== 1 ? 's' : ''} left
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8E8F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 12,
    color: '#651B55',
    fontFamily: 'Poppins_500Medium',
    marginLeft: 4,
  },
});

export default FreeMessageCounter;
