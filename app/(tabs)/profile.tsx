import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function Profile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert(t("success"), t("loggedOut"));
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Profile: Error logging out:", error);
      Alert.alert(t("error"), t("failedToLogout"));
    }
  };

  return (
    <View style={styles.container}>
      {isAuthenticated ? (
        <>
          <Text style={styles.text}>{t("profile")}</Text>
          <Text style={styles.subText}>{t("comingSoon")}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t("logoutButton")}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.text}>{t("pleaseLogin")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#313332",
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: "#313332",
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "#b80200",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
