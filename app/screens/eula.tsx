import { PoppinsText } from "@/components/PoppinsText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function EULAScreen() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/signup");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#651B55" />
        </TouchableOpacity>
        <PoppinsText weight="bold" style={styles.headerTitle}>
          Terms of Use (EULA)
        </PoppinsText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <PoppinsText weight="bold" style={styles.title}>
          End User License Agreement (EULA)
        </PoppinsText>
        
        <PoppinsText style={styles.lastUpdated}>
          Last Updated: June 11, 2026
        </PoppinsText>

        <PoppinsText style={styles.paragraph}>
          Welcome to Pairfect. Please read this End User License Agreement (&quot;Agreement&quot; or &quot;EULA&quot;) carefully before using the Pairfect mobile application (&quot;Application&quot;). By downloading, installing, or using the Application, you agree to be bound by the terms and conditions of this Agreement.
        </PoppinsText>

        {/* Zero Tolerance Warning Card */}
        <View style={styles.warningCard}>
          <Ionicons name="shield-half-sharp" size={28} color="#E03131" style={styles.warningIcon} />
          <View style={styles.warningContent}>
            <PoppinsText weight="bold" style={styles.warningTitle}>
              Zero Tolerance Policy
            </PoppinsText>
            <PoppinsText style={styles.warningText}>
              Pairfect enforces a strict zero-tolerance policy towards objectionable content or abusive behavior. Any user violating these terms will be immediately banned and ejected.
            </PoppinsText>
          </View>
        </View>

        <View style={styles.section}>
          <PoppinsText weight="bold" style={styles.sectionTitle}>
            1. Objectionable Content & Activities
          </PoppinsText>
          <PoppinsText style={styles.paragraph}>
            You agree not to submit, post, or share any User Generated Content (UGC) that:
          </PoppinsText>
          <PoppinsText style={styles.bulletItem}>
            • Contains sexually explicit content, nudity, or pornography.
          </PoppinsText>
          <PoppinsText style={styles.bulletItem}>
            • Promotes hate speech, discrimination, bigotry, racism, or harassment.
          </PoppinsText>
          <PoppinsText style={styles.bulletItem}>
            • Incites violence, physical threats, or illegal activities.
          </PoppinsText>
          <PoppinsText style={styles.bulletItem}>
            • Infringes upon copyrights, patents, trademarks, or trade secrets of third parties.
          </PoppinsText>
          <PoppinsText style={styles.bulletItem}>
            • Contains spam, malicious links, viruses, or phishing attempts.
          </PoppinsText>
        </View>

        <View style={styles.section}>
          <PoppinsText weight="bold" style={styles.sectionTitle}>
            2. Abusive Behavior
          </PoppinsText>
          <PoppinsText style={styles.paragraph}>
            Harassment, bullying, stalking, impersonation, hate speech, or threatening communications directed at other users are strictly prohibited. We aim to keep the community safe, friendly, and respectful.
          </PoppinsText>
        </View>

        <View style={styles.section}>
          <PoppinsText weight="bold" style={styles.sectionTitle}>
            3. Safety Mechanisms (Block & Report)
          </PoppinsText>
          <PoppinsText style={styles.paragraph}>
            Pairfect provides robust safety tools directly on user feeds, profiles, and chat conversations:
          </PoppinsText>
          <PoppinsText style={styles.bulletItem}>
            • **Report User**: Users can flag/report any profile or message containing objectionable content. Reports are reviewed by our moderation team within 24 hours.
          </PoppinsText>
          <PoppinsText style={styles.bulletItem}>
            • **Block User**: Users can instantly block any abusive user. Once blocked, the blocked user is immediately removed from your feed, search recommendations, and chat messages.
          </PoppinsText>
        </View>

        <View style={styles.section}>
          <PoppinsText weight="bold" style={styles.sectionTitle}>
            4. Moderation and Enforcement
          </PoppinsText>
          <PoppinsText style={styles.paragraph}>
            The developer acts on objectionable content reports within **24 hours**. If objectionable content is identified or reported:
          </PoppinsText>
          <PoppinsText style={styles.bulletItem}>
            • The content will be removed from the system immediately.
          </PoppinsText>
          <PoppinsText style={styles.bulletItem}>
            • The user who posted the content will be ejected, suspended, or banned.
          </PoppinsText>
          <PoppinsText style={styles.bulletItem}>
            • System-level blocks cannot be undone by blocked users.
          </PoppinsText>
        </View>

        <View style={styles.section}>
          <PoppinsText weight="bold" style={styles.sectionTitle}>
            5. Age Restrictions
          </PoppinsText>
          <PoppinsText style={styles.paragraph}>
            You must be at least **18 years old** to register or use Pairfect. Registering with false age information is a direct violation of this EULA and will result in immediate termination of your account.
          </PoppinsText>
        </View>

        <PoppinsText style={styles.footerText}>
          By continuing to use this Application, you acknowledge that you have read, understood, and agreed to be bound by these safety policies.
        </PoppinsText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: "#333",
  },
  headerSpacer: {
    width: 28,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    color: "#651B55",
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: "#888",
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    marginBottom: 16,
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: "#FFF5F5",
    borderColor: "#FFE3E3",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    color: "#E03131",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: "#C92A2A",
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  bulletItem: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    paddingLeft: 12,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
});
