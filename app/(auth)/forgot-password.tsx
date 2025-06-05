import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import Snackbar from "react-native-snackbar";
import { useAuth } from "../../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

interface FocusState {
  phone: boolean;
  otp: boolean;
  newPassword: boolean;
}

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("SY");
  const [callingCode, setCallingCode] = useState("963");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<FocusState>({
    phone: false,
    otp: false,
    newPassword: false,
  });

  const router = useRouter();
  const { forgotPassword, resetPassword } = useAuth();

  const handleFocus = (field: keyof FocusState) => {
    setFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof FocusState) => {
    setFocused((prev) => ({ ...prev, [field]: false }));
  };

  const showSnackbar = (message: string, isError: boolean = true) => {
    Snackbar.show({
      text: message,
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: isError ? "#B80200" : "#323232",
      textColor: "#FFFFFF",
    });
  };

  const handleRequestOTP = async () => {
    if (!phone) {
      showSnackbar(t("All Feilds Required"));
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
    } catch (error: any) {
      console.error("ForgotPassword: Error requesting OTP:", error);
      showSnackbar(error.message || t("failedToSendOTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      showSnackbar(t("allFieldsRequired"));
      return;
    }
    if (otp.length < 4 || otp.length > 6) {
      showSnackbar(t("invalidOTP"));
      return;
    }
    if (newPassword.length < 6) {
      showSnackbar(t("passwordTooShort"));
      return;
    }
    const fullPhone = `+${callingCode}${phone}`;
    setLoading(true);
    try {
      await resetPassword(fullPhone, otp, newPassword);
      showSnackbar(t("passwordResetSuccess"), false);
      router.replace("/login");
    } catch (error: any) {
      console.error("ForgotPassword: Error resetting password:", error);
      showSnackbar(error.message || t("failedToResetPassword"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.fullScreenContainer}>
      {/* StatusBar and Background elements from Login screen - positioned absolutely behind content */}
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.backgroundGradient} />
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
              <Text style={styles.title}>{t("Forgot Password")}</Text>
              <Text style={styles.subtitle}>
                {step === 1 ? t("enterPhoneToReset") : t("enterOtpAndNewPass")}
              </Text>
            </View>
            {/* Main Card replicating Login UI */}
            <View style={styles.card}>
              {/* Phone Input with Country Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("phoneNumber")}</Text>
                <View style={styles.phoneInputRow}>
                  <CountryPicker
                    countryCode={countryCode}
                    withFilter
                    withFlag
                    withCallingCode
                    onSelect={(country: Country) => {
                      setCountryCode(country.cca2 as CountryCode);
                      setCallingCode(country.callingCode[0]);
                    }}
                    containerButtonStyle={[
                      styles.countryPickerButton,
                      focused.phone && styles.inputFocused,
                      step === 2 && styles.inputDisabled,
                    ]}
                  />
                  <View
                    style={[
                      styles.inputContainer,
                      styles.phoneInput,
                      focused.phone && styles.inputFocused,
                      step === 2 && styles.inputDisabled,
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
                      style={styles.textInput}
                      textContentType="telephoneNumber"
                      autoComplete="tel"
                      onFocus={() => handleFocus("phone")}
                      onBlur={() => handleBlur("phone")}
                      editable={step === 1}
                    />
                  </View>
                </View>
              </View>

              {step === 2 && (
                <>
                  {/* OTP Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t("otp")}</Text>
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
                        style={styles.textInput}
                        onFocus={() => handleFocus("otp")}
                        onBlur={() => handleBlur("otp")}
                        maxLength={6}
                      />
                    </View>
                  </View>

                  {/* New Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t("newPassword")}</Text>
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
                        style={styles.textInput}
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
                </>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading && styles.loginButtonDisabled,
                ]}
                onPress={step === 1 ? handleRequestOTP : handleResetPassword}
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
                      {step === 1 ? t("requestOTP") : t("resetPassword")}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Back to Login Link */}
              <View style={styles.registerLinkContainer}>
                <Text style={styles.registerLinkText}>
                  {t("rememberedYourPassword")}{" "}
                </Text>
                <TouchableOpacity onPress={() => router.back()}>
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
  // Background elements from Login screen
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: "#1a1a1a", // Changed from #000 to #1a1a1a to match previous Login styles
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
    marginLeft: 2,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countryPickerButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 50,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 70,
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
});
// import { useRouter } from "expo-router";
// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   Alert,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useAuth } from "../../contexts/AuthContext";

// export default function ForgotPassword() {
//   const { t } = useTranslation();
//   const [phone, setPhone] = useState("");
//   const [otp, setOtp] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP & Password
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const { forgotPassword, resetPassword } = useAuth();

//   const handleRequestOTP = async () => {
//     setLoading(true);
//     try {
//       await forgotPassword(phone);
//       Alert.alert(t("success"), t("otpSent"));
//       setStep(2);
//     } catch (error: any) {
//       Alert.alert(t("error"), error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResetPassword = async () => {
//     setLoading(true);
//     try {
//       await resetPassword(phone, otp, newPassword);
//       Alert.alert(t("success"), t("passwordResetSuccess"));
//       router.replace("/login");
//     } catch (error: any) {
//       Alert.alert(t("error"), error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>{t("forgotPassword")}</Text>
//       <TextInput
//         style={styles.input}
//         placeholder={t("phoneNumber")}
//         placeholderTextColor="#313332"
//         value={phone}
//         onChangeText={setPhone}
//         keyboardType="phone-pad"
//         editable={step === 1}
//       />
//       {step === 2 && (
//         <>
//           <TextInput
//             style={styles.input}
//             placeholder={t("otp")}
//             placeholderTextColor="#313332"
//             value={otp}
//             onChangeText={setOtp}
//             keyboardType="numeric"
//           />
//           <TextInput
//             style={styles.input}
//             placeholder={t("newPassword")}
//             placeholderTextColor="#313332"
//             value={newPassword}
//             onChangeText={setNewPassword}
//             secureTextEntry
//           />
//         </>
//       )}
//       <TouchableOpacity
//         style={styles.button}
//         onPress={step === 1 ? handleRequestOTP : handleResetPassword}
//         disabled={loading}
//       >
//         <Text style={styles.buttonText}>
//           {loading
//             ? t("loading")
//             : step === 1
//             ? t("requestOTP")
//             : t("resetPassword")}
//         </Text>
//       </TouchableOpacity>
//       <TouchableOpacity
//         style={styles.link}
//         onPress={() => router.push("/login")}
//       >
//         <Text style={styles.linkText}>{t("backToLogin")}</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#ffffff",
//     padding: 20,
//     justifyContent: "center",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#313332",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   input: {
//     backgroundColor: "#f8f8f8",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 12,
//     fontSize: 16,
//     color: "#313332",
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   button: {
//     backgroundColor: "#b80200",
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   buttonText: {
//     color: "#ffffff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   link: {
//     alignItems: "center",
//   },
//   linkText: {
//     color: "#b80200",
//     fontSize: 14,
//     fontWeight: "500",
//   },
// });
