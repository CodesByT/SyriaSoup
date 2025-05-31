import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface LoginPromptModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function LoginPromptModal({
  isVisible,
  onClose,
}: LoginPromptModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal} // Will make the modal itself full screen
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.6}
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={300}
      useNativeDriverForBackdrop={true}
      // To ensure the modal slides from the bottom up while occupying full screen,
      // we keep the default 'justifyContent: center' or specify it if needed.
      // The inner content will define its position.
    >
      {/* The main content container that will have the curved corners and white background */}
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={26} color="#313332" />
        </TouchableOpacity>

        {/* Header content with an icon */}
        <View style={styles.headerContent}>
          <Ionicons
            name="car-outline"
            size={60}
            color="#b80200"
            style={styles.headerIcon}
          />
          <Text style={styles.title}>{t("loginPrompt")}</Text>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => {
            onClose();
            router.push("/(auth)/login");
          }}
        >
          <Ionicons
            name="phone-portrait-outline"
            size={20}
            color="#ffffff"
            style={styles.buttonIcon}
          />
          <Text style={styles.loginButtonText}>{t("continueWithPhone")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => {
            onClose();
            router.push("/(auth)/register");
          }}
        >
          <Ionicons
            name="person-add-outline"
            size={20}
            color="#b80200"
            style={styles.buttonIcon}
          />
          <Text style={styles.registerButtonText}>{t("createAccount")}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    // This will make the modal occupy the entire screen space.
    // The content inside will then be positioned.
    margin: 0,
    justifyContent: "flex-start", // Push content to the top
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 25, // Curved top-left corner
    borderTopRightRadius: 25, // Curved top-right corner
    flex: 1, // Make this container take up the remaining space from the top
    paddingHorizontal: 20,
    // paddingTop and paddingBottom will be handled by inline style for safe area
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    // Adjust top relative to container's content (after insets.top+20)
    top: 20, // Keep some margin from the very top after safe area
    right: 20,
    padding: 8,
    zIndex: 1,
  },
  headerContent: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20, // Add some top margin below the safe area
  },
  headerIcon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#313332",
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#b80200",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: "90%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  registerButton: {
    borderWidth: 1.5,
    borderColor: "#b80200",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: "90%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerButtonText: {
    color: "#b80200",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
});
