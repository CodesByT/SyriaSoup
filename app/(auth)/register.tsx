"use client";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CountryPicker, {
  type Country,
  type CountryCode,
} from "react-native-country-picker-modal";
import { showToastable } from "react-native-toastable";
import bannerImage from "../../assets/banner.jpeg";
import syriaFlag from "../../assets/flags/syria-flag.png";
import { useAuth } from "../../contexts/AuthContext";
import { useRTL } from "../../hooks/useRTL";

const { width, height } = Dimensions.get("window");

interface FocusState {
  username: boolean;
  phone: boolean;
  password: boolean;
}

export default function Register() {
  const [username, setUsername] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [countryCode, setCountryCode] = useState<CountryCode>("SY");
  const [callingCode, setCallingCode] = useState<string>("963");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [focused, setFocused] = useState<FocusState>({
    username: false,
    phone: false,
    password: false,
  });

  const { registerUser } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL, rtlViewStyle } = useRTL();

  const handleFocus = (field: keyof FocusState): void => {
    setFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof FocusState): void => {
    setFocused((prev) => ({ ...prev, [field]: false }));
  };

  const checkPasswordStrength = (password: string): string | null => {
    if (password.length < 8) {
      return t("password_min_length");
    }
    if (!/[A-Z]/.test(password)) {
      return t("password_uppercase");
    }
    if (!/[a-z]/.test(password)) {
      return t("password_lowercase");
    }
    if (!/[0-9]/.test(password)) {
      return t("password_number");
    }
    // Added special character check regex (common special chars)
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~` ]/.test(password)) {
      return t("password_special_char");
    }
    return null;
  };

  const handleRegister = async (): Promise<void> => {
    // --- Validation Checks using Snackbar ---
    if (!username || !phone || !password) {
      showToastable({
        message: t("all_feilds_required"),
        status: "warning",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
      });
      return;
    }

    const phoneRegex = /^[0-9]+$/; // Regex to match only digits (0-9)
    if (!phoneRegex.test(phone)) {
      showToastable({
        message: t("phone_number_must_be_digits_only"),
        status: "warning",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
      });
      return;
    }

    // --- Password Strength Check ---
    const passwordCheckResult = checkPasswordStrength(password);
    if (passwordCheckResult) {
      showToastable({
        message: t("weak_password") + ": " + passwordCheckResult,
        status: "warning",
        duration: 5000, // Matches Snackbar.LENGTH_LONG
      });
      return;
    }

    setIsLoading(true);

    try {
      await registerUser(username, `${callingCode}${phone}`, password);
      console.log("Register: Registration successful");

      showToastable({
        message: t("registration_successful"),
        status: "success",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
      });
      router.back();
    } catch (error: any) {
      console.error("Register: Error registering:", error);
      showToastable({
        message: t("failed_to_register") + ": " + error.message,
        status: "warning",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountrySelect = (country: Country): void => {
    console.log("Register: Selected country code:", country.cca2);
    setCountryCode(country.cca2 as CountryCode);
    setCallingCode(country.callingCode[0]);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Background Image replacing the gradient */}
        <Image
          source={bannerImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.backgroundOverlay} />
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header with Logo */}
            <View style={styles.header}>
              <Image
                source={{
                  uri: "https://syriasouq.com/assets/logo-new-transparent-bg-03GdExie.png",
                }}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>{t("register_new_account")}</Text>
              <Text style={styles.subtitle}>{t("joinCommunity")}</Text>
            </View>

            {/* Main Card */}
            <View style={styles.card}>
              {/* Username Input */}
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.label,
                    {
                      textAlign: isRTL ? "right" : "left",
                      marginLeft: isRTL ? 0 : 2,
                      marginRight: isRTL ? 2 : 0,
                    },
                  ]}
                >
                  {t("Username")}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    focused.username && styles.inputFocused,
                  ]}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={focused.username ? "#B80200" : "#666"}
                    />
                  </View>
                  <TextInput
                    placeholder={t("enter_username")}
                    value={username}
                    onChangeText={setUsername}
                    style={[
                      styles.textInput,
                      { textAlign: isRTL ? "right" : "left" },
                    ]}
                    autoCapitalize="none"
                    textContentType="username"
                    autoComplete="username"
                    placeholderTextColor="#999"
                    onFocus={() => handleFocus("username")}
                    onBlur={() => handleBlur("username")}
                  />
                </View>
              </View>

              {/* Phone Number Input Group */}
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.label,
                    {
                      textAlign: isRTL ? "right" : "left",
                      marginLeft: isRTL ? 0 : 2,
                      marginRight: isRTL ? 2 : 0,
                    },
                  ]}
                >
                  {t("phone_number")}
                </Text>
                <View style={[styles.phoneInputRow, rtlViewStyle]}>
                  <View
                    style={[
                      styles.countryPickerContainer,
                      focused.phone && styles.countryPickerFocused,
                    ]}
                  >
                    {countryCode === "SY" && (
                      <Image source={syriaFlag} style={styles.syriaFlag} />
                    )}
                    <CountryPicker
                      countryCode={countryCode}
                      withFilter
                      withFlag={true}
                      withCallingCode
                      onSelect={handleCountrySelect}
                      containerButtonStyle={[
                        styles.countryPickerButton,
                        countryCode === "SY" && styles.hiddenCountryPicker,
                      ]}
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      styles.phoneInput,
                      focused.phone && styles.inputFocused,
                    ]}
                  >
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="call-outline"
                        size={20}
                        color={focused.phone ? "#B80200" : "#666"}
                      />
                    </View>
                    <TextInput
                      placeholder={t("example_phone_number")}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      style={[
                        styles.textInput,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                      textContentType="telephoneNumber"
                      autoComplete="tel"
                      placeholderTextColor="#999"
                      onFocus={() => handleFocus("phone")}
                      onBlur={() => handleBlur("phone")}
                    />
                  </View>
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.label,
                    {
                      textAlign: isRTL ? "right" : "left",
                      marginLeft: isRTL ? 0 : 2,
                      marginRight: isRTL ? 2 : 0,
                    },
                  ]}
                >
                  {t("Password")}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    focused.password && styles.inputFocused,
                  ]}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={focused.password ? "#B80200" : "#666"}
                    />
                  </View>
                  <TextInput
                    placeholder={t("enter_password")}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={[
                      styles.textInput,
                      { textAlign: isRTL ? "right" : "left" },
                    ]}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    placeholderTextColor="#999"
                    onFocus={() => handleFocus("password")}
                    onBlur={() => handleBlur("password")}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color={focused.password ? "#B80200" : "#666"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isLoading && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  {isLoading ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.registerButtonText}>
                        {t("creating")}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.registerButtonText}>
                      {t("Register")}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginLinkContainer}>
                <Text style={styles.loginLinkText}>
                  {t("alreadyHaveAccount")}
                </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.loginLink}>{t("signIn")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    width: width,
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  backgroundCircle1: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: "#B80200",
    opacity: 0.06,
    top: -width * 0.15,
    right: -width * 0.15,
  },
  backgroundCircle2: {
    position: "absolute",
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: "#313332",
    opacity: 0.04,
    bottom: height * 0.15,
    left: -width * 0.1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
    paddingTop: 10,
  },
  logo: {
    width: 200,
    height: 70,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontWeight: "400",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    width: "100%",
    marginHorizontal: 0,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
    marginTop: 5,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countryPickerContainer: {
    position: "relative",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 70,
    overflow: "hidden",
  },
  countryPickerButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 1,
  },
  hiddenCountryPicker: {
    opacity: 0,
  },
  countryPickerFocused: {
    borderColor: "#B80200",
    backgroundColor: "#ffffff",
    shadowColor: "#B80200",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  phoneInput: {
    flex: 1,
  },
  inputFocused: {
    borderColor: "#B80200",
    backgroundColor: "#ffffff",
    shadowColor: "#B80200",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
    paddingVertical: 0,
    marginLeft: 6,
    fontWeight: "500",
  },
  passwordToggle: {
    paddingLeft: 8,
    paddingRight: 2,
  },
  registerButton: {
    backgroundColor: "#B80200",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#B80200",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 50,
  },
  registerButtonDisabled: {
    opacity: 0.8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  loginLinkText: {
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B80200",
  },
  syriaFlag: {
    position: "absolute",
    width: 24,
    height: 16,
    resizeMode: "cover",
    borderRadius: 2,
    zIndex: 0,
  },
});
