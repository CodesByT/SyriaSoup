"use client";

import React, { useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import bannerImage from "../assets/banner.jpeg";
import syriaFlag from "../assets/flags/syria-flag.png";
import { useAuth } from "../contexts/AuthContext";
import { useRTL } from "../hooks/useRTL";

const { width, height } = Dimensions.get("window");

interface FocusState {
  phone: boolean;
  otp: boolean;
  newPassword: boolean;
  confirmPassword: boolean;
}

export default function ResetPassword() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("SY");
  const [callingCode, setCallingCode] = useState("963");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused] = useState<FocusState>({
    phone: false,
    otp: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [timer, setTimer] = useState(0);

  const router = useRouter();
  const { forgotPassword, resetPassword } = useAuth();
  const { isRTL, rtlViewStyle } = useRTL();

  const handleFocus = (field: keyof FocusState) => {
    setFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof FocusState) => {
    setFocused((prev) => ({ ...prev, [field]: false }));
  };

  const showSnackbar = (message: string, isError = true) => {
    showToastable({
      message: message,
      status: isError ? "warning" : "success",
      duration: 2000,
    });
  };

  const handleRequestOTP = async () => {
    if (!phone) {
      showSnackbar(t("All Fields Required"));
      return;
    }
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(phone)) {
      showSnackbar(t("phoneDigitsOnly"));
      return;
    }
    const fullPhone = `+${callingCode}${phone}`;
    setLoading(true);
    try {
      await forgotPassword(fullPhone);
      showSnackbar(t("otpSent"), false);
      setStep(2);
      setTimer(120); // 2 minutes countdown
    } catch (error: any) {
      // console.error("ResetPassword: Error requesting OTP:", error);
      showSnackbar(error.message || t("failedToSendOTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;

    const fullPhone = `+${callingCode}${phone}`;
    setLoading(true);
    try {
      await forgotPassword(fullPhone);
      setTimer(120); // Reset timer
      showSnackbar(t("otpResent"), false);
    } catch (error: any) {
      // console.error("ResetPassword: Error resending OTP:", error);
      showSnackbar(error.message || t("failedToSendOTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = () => {
    if (!otp) {
      showSnackbar(t("otpRequired"));
      return;
    }
    if (otp.length < 4 || otp.length > 6) {
      showSnackbar(t("invalidOTP"));
      return;
    }

    // Move to password reset step
    setStep(3);
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showSnackbar(t("allFieldsRequired"));
      return;
    }
    if (newPassword.length < 6) {
      showSnackbar(t("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar(t("passwordsDoNotMatch"));
      return;
    }

    const fullPhone = `+${callingCode}${phone}`;
    setLoading(true);
    try {
      await resetPassword(fullPhone, otp, newPassword);
      showSnackbar(t("passwordResetSuccess"), false);
      router.replace("/(auth)/login");
    } catch (error: any) {
      // console.error("ResetPassword: Error resetting password:", error);
      showSnackbar(error.message || t("failedToResetPassword"));
    } finally {
      setLoading(false);
    }
  };

  // Timer effect for OTP resend
  React.useEffect(() => {
    let interval: NodeJS.Timeout | number;
    if (timer > 0 && step === 2) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <View style={styles.fullScreenContainer}>
      {/* StatusBar and Background elements from Login screen - positioned absolutely behind content */}
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      {/* Background Image replacing the gradient */}
      <Image
        source={bannerImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.backgroundOverlay} />
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />

      {/* Main content wrapped in KeyboardAvoidingView and ScrollView */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer} // This needs to be transparent
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            {/* Added a wrapper for consistent padding/sizing */}
            {/* Header with Logo */}
            <View style={styles.header}>
              <Image
                source={{
                  uri: "https://syriasouq.com/assets/logo-new-transparent-bg-03GdExie.png",
                }}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>{t("reset_password")}</Text>
              <Text style={styles.subtitle}>
                {step === 1
                  ? t("enterPhoneToReset")
                  : step === 2
                  ? t("enterOtpToVerify")
                  : t("enterNewPassword")}
              </Text>
            </View>
            {/* Main Card replicating Login UI */}
            <View style={styles.card}>
              {/* Step 1: Phone Input */}
              {step === 1 && (
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
                    {t("phoneNumber")}
                  </Text>
                  <View style={[styles.phoneInputRow, rtlViewStyle]}>
                    <View
                      style={[
                        styles.countryPickerContainer,
                        focused.phone && styles.inputFocused,
                      ]}
                    >
                      {countryCode === "SY" && (
                        <Image source={syriaFlag} style={styles.syriaFlag} />
                      )}
                      <CountryPicker
                        countryCode={countryCode}
                        withFilter
                        withFlag={countryCode !== "SY"}
                        withCallingCode
                        onSelect={(country: Country) => {
                          setCountryCode(country.cca2 as CountryCode);
                          setCallingCode(country.callingCode[0]);
                        }}
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
                      <Ionicons
                        name="call-outline"
                        size={20}
                        color={focused.phone ? "#B80200" : "#666"}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder={t("e.g (11223344)")}
                        placeholderTextColor="#999"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        style={[
                          styles.textInput,
                          { textAlign: isRTL ? "right" : "left" },
                        ]}
                        textContentType="telephoneNumber"
                        autoComplete="tel"
                        onFocus={() => handleFocus("phone")}
                        onBlur={() => handleBlur("phone")}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Step 2: OTP Input */}
              {step === 2 && (
                <>
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
                      {t("otp")}
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        focused.otp && styles.inputFocused,
                      ]}
                    >
                      <Ionicons
                        name="key-outline"
                        size={20}
                        color={focused.otp ? "#B80200" : "#666"}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder={t("enterOTP")}
                        placeholderTextColor="#999"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        style={[
                          styles.textInput,
                          { textAlign: isRTL ? "right" : "left" },
                        ]}
                        onFocus={() => handleFocus("otp")}
                        onBlur={() => handleBlur("otp")}
                        maxLength={6}
                      />
                    </View>
                  </View>

                  {/* Timer and Resend */}
                  <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>
                      {timer > 0
                        ? t("resendIn", { time: formatTime(timer) })
                        : t("didntReceiveOTP")}
                    </Text>
                    <TouchableOpacity
                      onPress={handleResendOTP}
                      disabled={timer > 0 || loading}
                      style={
                        timer > 0 ? styles.resendDisabled : styles.resendEnabled
                      }
                    >
                      <Text
                        style={[
                          styles.resendText,
                          timer > 0
                            ? styles.resendTextDisabled
                            : styles.resendTextEnabled,
                        ]}
                      >
                        {t("resendOTP")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 3: New Password Input */}
              {step === 3 && (
                <>
                  {/* New Password Input */}
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
                      {t("newPassword")}
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        focused.newPassword && styles.inputFocused,
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={focused.newPassword ? "#B80200" : "#666"}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder={t("enterNewPassword")}
                        placeholderTextColor="#999"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        style={[
                          styles.textInput,
                          { textAlign: isRTL ? "right" : "left" },
                        ]}
                        textContentType="newPassword"
                        autoComplete="new-password"
                        onFocus={() => handleFocus("newPassword")}
                        onBlur={() => handleBlur("newPassword")}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.passwordToggle}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off" : "eye"}
                          size={22}
                          color={focused.newPassword ? "#B80200" : "#666"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm Password Input */}
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
                      {t("confirmPassword")}
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        focused.confirmPassword && styles.inputFocused,
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={focused.confirmPassword ? "#B80200" : "#666"}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder={t("confirmNewPassword")}
                        placeholderTextColor="#999"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        style={[
                          styles.textInput,
                          { textAlign: isRTL ? "right" : "left" },
                        ]}
                        textContentType="newPassword"
                        autoComplete="new-password"
                        onFocus={() => handleFocus("confirmPassword")}
                        onBlur={() => handleBlur("confirmPassword")}
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        style={styles.passwordToggle}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off" : "eye"}
                          size={22}
                          color={focused.confirmPassword ? "#B80200" : "#666"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading && styles.loginButtonDisabled,
                ]}
                onPress={
                  step === 1
                    ? handleRequestOTP
                    : step === 2
                    ? handleVerifyOTP
                    : handleResetPassword
                }
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.loginButtonText}>
                        {t("loading")}...
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.loginButtonText}>
                      {step === 1
                        ? t("requestOTP")
                        : step === 2
                        ? t("verifyOTP")
                        : t("resetPassword")}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Back to Login Link */}
              <View style={styles.registerLinkContainer}>
                <Text style={styles.registerLinkText}>
                  {t("rememberedYourPassword")}{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/(auth)/login")}
                >
                  <Text style={styles.registerLink}>{t("backToLogin")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Default background for the entire screen
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
    opacity: 0.1,
    top: -width * 0.15,
    right: -width * 0.15,
  },
  backgroundCircle2: {
    position: "absolute",
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: "#313332",
    opacity: 0.1,
    bottom: height * 0.15,
    left: -width * 0.1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: "transparent", // Make KeyboardAvoidingView transparent
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
  },
  contentWrapper: {
    // Added wrapper to hold header and card, applies common padding/max width
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 30, // Adjust paddingTop for header
    justifyContent: "center",
    alignItems: "center",
    flex: 1, // Ensures it takes available space
  },
  header: {
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
    paddingTop: 10,
  },
  logo: {
    width: 140,
    height: 50,
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
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
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
  },
  hiddenCountryPicker: {
    opacity: 0,
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
  inputDisabled: {
    backgroundColor: "#e9ecef",
    opacity: 0.7,
    borderColor: "#d1d1d1",
  },
  inputIcon: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
    paddingVertical: 0,
    fontWeight: "500",
  },
  passwordToggle: {
    paddingLeft: 8,
    paddingRight: 2,
  },
  loginButton: {
    backgroundColor: "#B80200",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#B80200",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 50,
  },
  loginButtonDisabled: {
    opacity: 0.8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  registerLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  registerLinkText: {
    fontSize: 14,
    color: "#666",
  },
  registerLink: {
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
    zIndex: 1,
  },
  timerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  timerText: {
    fontSize: 14,
    color: "#666",
    marginRight: 5,
  },
  resendEnabled: {
    padding: 5,
  },
  resendDisabled: {
    padding: 5,
    opacity: 0.5,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "600",
  },
  resendTextEnabled: {
    color: "#B80200",
  },
  resendTextDisabled: {
    color: "#999",
  },
});
