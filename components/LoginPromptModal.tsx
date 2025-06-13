"use client";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

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
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.7}
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={300}
      useNativeDriverForBackdrop={true}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
      >
        {/* Decorative top bar */}
        <View style={styles.topBar} />

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <View style={styles.closeButtonBackground}>
            <Ionicons name="close" size={22} color="#666" />
          </View>
        </TouchableOpacity>

        {/* Header with S logo and layered styling */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: "https://syriasouq.com/assets/logo-new-transparent-bg-03GdExie.png",
              }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.brandText}> {t("syria_souq")} </Text>
            <View style={styles.brandUnderline} />
            <Text style={styles.subtitle}>{t("loginPrompt")}</Text>
          </View>
        </View>

        {/* Decorative divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerIconContainer}>
            <Ionicons name="car-sport" size={20} color="#b80200" />
          </View>
          <View style={styles.dividerLine} />
        </View>

        {/* Action buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              onClose();
              router.push("/(auth)/login");
            }}
            activeOpacity={0.8}
          >
            {/* Layered button for gradient effect */}
            <View style={styles.loginButtonBackground} />
            <View style={styles.loginButtonContent}>
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color="#ffffff"
                style={styles.buttonIcon}
              />
              <Text style={styles.loginButtonText}>
                {t("continueWithPhone")}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => {
              onClose();
              router.push("/(auth)/register");
            }}
            activeOpacity={0.8}
          >
            <View style={styles.registerButtonBorder} />
            <View style={styles.registerButtonContent}>
              <Ionicons
                name="person-add-outline"
                size={20}
                color="#b80200"
                style={styles.buttonIcon}
              />
              <Text style={styles.registerButtonText}>
                {t("createAccount")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom decorative element */}
        {/* <View style={styles.bottomDecoration}>
          <View style={[styles.decorativeDot, styles.dotActive]} />
          <View style={styles.decorativeDot} />
          <View style={styles.decorativeDot} />
        </View> */}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  logo: { width: 200, height: 70, marginBottom: 10 },
  modal: {
    margin: 0,
    justifyContent: "flex-start",
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 15,
  },
  topBar: {
    width: 50,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 20,
  },
  closeButton: {
    position: "absolute",
    top: 25,
    right: 20,
    zIndex: 1,
  },
  closeButtonBackground: {
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerSection: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  logoBackgroundOuter: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#b80200",
    shadowColor: "#b80200",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  logoBackgroundInner: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#d40300",
    top: 2,
    left: 2,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 1,
  },
  titleContainer: {
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  brandText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#313332",
    marginBottom: 6,
  },
  brandUnderline: {
    width: 60,
    height: 3,
    backgroundColor: "#b80200",
    borderRadius: 2,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    width: "80%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerIconContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  buttonsContainer: {
    width: "100%",
    alignItems: "center",
  },
  loginButton: {
    width: "90%",
    borderRadius: 12,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  loginButtonBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#b80200",
    borderRadius: 12,
    shadowColor: "#b80200",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonContent: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(212, 3, 0, 0.1)",
    borderRadius: 12,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  registerButton: {
    width: "90%",
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
  },
  registerButtonBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: "#b80200",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  registerButtonContent: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(184, 2, 0, 0.02)",
    borderRadius: 10,
    margin: 2,
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
  bottomDecoration: {
    flexDirection: "row",
    marginTop: 40,
    marginBottom: 20,
  },
  decorativeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#b80200",
  },
});
