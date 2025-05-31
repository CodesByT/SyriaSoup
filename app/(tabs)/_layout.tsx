import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginPromptModal from "../../components/LoginPromptModal";
import { useAuth } from "../../contexts/AuthContext";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

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
            paddingBottom: 16,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 4,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: t("home"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            tabBarLabel: t("favorites"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart-outline" size={size} color={color} />
            ),
            headerShown: false,
          }}
          listeners={{ tabPress: handleTabPress("favorites") }}
        />
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
        <Tabs.Screen
          name="chat"
          options={{
            tabBarLabel: t("chat"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles-outline" size={size} color={color} />
            ),
            headerShown: false,
          }}
          listeners={{ tabPress: handleTabPress("chat") }}
        />
        <Tabs.Screen
          name="profile"
          options={{
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
});
