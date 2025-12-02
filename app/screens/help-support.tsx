import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const HelpSupportScreen = () => {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Welcome to Pairfect</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Pairfect is a dating application designed to help you find meaningful connections. 
            Our intelligent matching system helps you discover people who share your interests and values.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Navigate</Text>
        
        <View style={styles.navItem}>
          <View style={[styles.navIcon, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="compass" size={24} color="#2e7d32" />
          </View>
          <View style={styles.navTextContainer}>
            <Text style={styles.navTitle}>Discover & Swipe</Text>
            <Text style={styles.navDescription}>Swipe right to like or left to pass on profiles in your area</Text>
          </View>
        </View>

        <View style={styles.divider} />
        
        <View style={styles.navItem}>
          <View style={[styles.navIcon, { backgroundColor: '#f3e5f5' }]}>
            <Ionicons name="heart" size={24} color="#8e24aa" />
          </View>
          <View style={styles.navTextContainer}>
            <Text style={styles.navTitle}>Matches</Text>
            <Text style={styles.navDescription}>View your current matches and connections</Text>
          </View>
        </View>

        <View style={styles.divider} />
        
        <View style={styles.navItem}>
          <View style={[styles.navIcon, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="chatbubbles" size={24} color="#1976d2" />
          </View>
          <View style={styles.navTextContainer}>
            <Text style={styles.navTitle}>Messages</Text>
            <Text style={styles.navDescription}>Chat with your matches</Text>
          </View>
        </View>

        <View style={styles.divider} />
        
        <View style={styles.navItem}>
          <View style={[styles.navIcon, { backgroundColor: '#fff3e0' }]}>
            <Ionicons name="person" size={24} color="#ef6c00" />
          </View>
          <View style={styles.navTextContainer}>
            <Text style={styles.navTitle}>Profile</Text>
            <Text style={styles.navDescription}>Edit your profile and adjust settings</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Getting Started</Text>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Complete Your Profile</Text>
            <Text style={styles.stepDescription}>
              Add photos and information about yourself to help others get to know you better.
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Discover & Swipe</Text>
            <Text style={styles.stepDescription}>
              Browse through profiles and swipe right to like or left to pass on potential matches.
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Connect & Chat</Text>
            <Text style={styles.stepDescription}>
              Once matched, start a conversation and get to know each other better.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
  },
  infoBox: {
    padding: 16,
    paddingTop: 0,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  navTextContainer: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  navDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 76,
  },
  step: {
    flexDirection: 'row',
    padding: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#651B55',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default HelpSupportScreen;
