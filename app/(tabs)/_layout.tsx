import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nManager, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginPromptModal from "../../components/LoginPromptModal";
import { useAuth } from "../../contexts/AuthContext";
import { useChatContext } from "../../contexts/ChatContext";

export default function TabsLayout() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { unreadCount, hasUnread } = useChatContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  // FORCE LTR FOR ENTIRE APP TO PREVENT TAB REVERSAL
  useEffect(() => {
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("TabsLayout - Unread count:", unreadCount);
    console.log("TabsLayout - Has unread:", hasUnread);
    console.log("TabsLayout - Is authenticated:", isAuthenticated);
    console.log("Current language:", i18n.language);
    console.log("RTL Status:", I18nManager.isRTL);
  }, [unreadCount, hasUnread, isAuthenticated, i18n.language]);

  const handleTabPress = (tabName: string) => (e: any) => {
    if (tabName === "index") return; // Allow Home tab without auth check
    if (!isAuthenticated) {
      e.preventDefault(); // Prevent navigation
      setPendingTab(tabName);
      setShowLoginModal(true);
    }
  };

  const handleModalClose = () => {
    setShowLoginModal(false);
    setPendingTab(null);
  };

  const ChatIcon = ({ color, size }: { color: string; size: number }) => (
    <View style={styles.chatIconContainer}>
      <Ionicons name="chatbubbles-outline" size={size} color={color} />
      {isAuthenticated && unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount.toString()}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#b80200",
          tabBarInactiveTintColor: "#313332",
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopColor: "#e0e0e0",
            borderTopWidth: 1,
            height: 60,
            paddingTop: 8,
            paddingBottom: 10,
            // FORCE LTR DIRECTION FOR TABS
            flexDirection: "row",
          },
          tabBarLabelStyle: {
            fontSize: 1,
            fontWeight: "600",
            marginBottom: 4,
            // Force LTR text alignment for tab labels
            textAlign: "center",
            writingDirection: "ltr",
          },
          headerShown: false,
        }}
      >
        {/* Home Tab - ALWAYS FIRST */}
        <Tabs.Screen
          name="index"
          options={{
            tabBarShowLabel: false,
            tabBarLabel: t("home"),
            tabBarIcon: ({ color, size = 15 }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
            headerShown: false,
          }}
        />

        {/* Favorites Tab - ALWAYS SECOND */}
        <Tabs.Screen
          name="favorites"
          options={{
            tabBarShowLabel: false,
            tabBarLabel: t("favorites"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart-outline" size={size} color={color} />
            ),
            headerShown: false,
          }}
          listeners={{ tabPress: handleTabPress("favorites") }}
        />

        {/* Place Ad Tab - ALWAYS THIRD */}
        <Tabs.Screen
          name="place-ad"
          options={{
            tabBarLabel: t("placeAd"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle-outline" size={size} color={color} />
            ),
            headerShown: false,
          }}
          listeners={{ tabPress: handleTabPress("place-ad") }}
        />

        {/* Chat Tab - ALWAYS FOURTH */}
        <Tabs.Screen
          name="chat"
          options={{
            tabBarShowLabel: false,
            tabBarLabel: t("chat"),
            tabBarIcon: ChatIcon,
            headerShown: false,
          }}
          listeners={{ tabPress: handleTabPress("chat") }}
        />

        {/* Profile Tab - ALWAYS FIFTH */}
        <Tabs.Screen
          name="profile"
          options={{
            tabBarShowLabel: false,
            tabBarLabel: t("profile"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
            headerShown: false,
          }}
          listeners={{ tabPress: handleTabPress("profile") }}
        />
      </Tabs>
      <LoginPromptModal isVisible={showLoginModal} onClose={handleModalClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  chatIconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#b80200",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});
