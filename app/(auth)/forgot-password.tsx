import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
  const { isRTL, rtlViewStyle } = useRTL();

  // Debug log to confirm isRTL value
  useEffect(() => {
    console.log("isRTL:", isRTL);
  }, [isRTL]);

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
      showSnackbar(t("all_feilds_required"));
      return;
    }
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(phone)) {
      showSnackbar(t("phoneDigitsOnly"));
      return;
    }
    const fullPhone = `${callingCode}${phone}`;
    setLoading(true);
    try {
      console.log(fullPhone);
      await forgotPassword(fullPhone);
      showSnackbar(t("otpSent"), false);
      setStep(2);
    } catch (error: any) {
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
      showSnackbar(error.message || t("failedToResetPassword"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.fullScreenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <Image
        source={bannerImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.backgroundOverlay} />
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            <View style={styles.header}>
              <Image
                source={{
                  uri: "https://syriasouq.com/assets/logo-new-transparent-bg-03GdExie.png",
                }}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>{t("request_otp")}</Text>
              {/* <Text style={styles.subtitle}>
                {step === 1 ? t("enterPhoneToReset") : t("enterOtpAndNewPass")}
              </Text> */}
            </View>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <View
                  style={[
                    styles.phoneInputRow,
                    isRTL ? styles.phoneInputRowRTL : styles.phoneInputRowLTR,
                  ]}
                >
                  <View style={styles.countryPickerContainer}>
                    {countryCode === "SY" && (
                      <Image source={syriaFlag} style={styles.syriaFlag} />
                    )}
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
                        countryCode === "SY" && styles.hiddenCountryPicker,
                      ]}
                      disabled={step === 2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.callingCodeText,
                      isRTL
                        ? styles.callingCodeTextRTL
                        : styles.callingCodeTextLTR,
                    ]}
                  >
                    +{callingCode}
                  </Text>
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
                      placeholder={t("example_phone_number")}
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
                      editable={step === 1}
                    />
                  </View>
                </View>
              </View>

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
                </>
              )}

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

              {/* <View style={styles.registerLinkContainer}>
                <Text style={styles.registerLinkText}>
                  {t("rememberedYourPassword")}{" "}
                </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.registerLink}>{t("backToLogin")}</Text>
                </TouchableOpacity>
              </View> */}
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
    backgroundColor: "#f8f9fa",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
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
    backgroundColor: "transparent",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
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
    gap: 4,
  },
  phoneInputRowLTR: {
    flexDirection: "row",
  },
  phoneInputRowRTL: {
    flexDirection: "row-reverse",
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 10,
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
  callingCodeText: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  callingCodeTextLTR: {
    marginHorizontal: 4,
  },
  callingCodeTextRTL: {
    marginHorizontal: 4,
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
    zIndex: 0,
  },
});
// "use client";

// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   Dimensions,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import CountryPicker, {
//   type Country,
//   type CountryCode,
// } from "react-native-country-picker-modal";
// import { showToastable } from "react-native-toastable"; // Replaced Snackbar import
// import bannerImage from "../../assets/banner.jpeg";
// import syriaFlag from "../../assets/flags/syria-flag.png";
// import { useAuth } from "../../contexts/AuthContext";
// import { useRTL } from "../../hooks/useRTL";
// const { width, height } = Dimensions.get("window");

// interface FocusState {
//   phone: boolean;
//   otp: boolean;
//   newPassword: boolean;
// }

// export default function ForgotPassword() {
//   const { t } = useTranslation();
//   const [phone, setPhone] = useState("");
//   const [otp, setOtp] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [countryCode, setCountryCode] = useState<CountryCode>("SY");
//   const [callingCode, setCallingCode] = useState("963");
//   const [step, setStep] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [focused, setFocused] = useState<FocusState>({
//     phone: false,
//     otp: false,
//     newPassword: false,
//   });

//   const router = useRouter();
//   const { forgotPassword, resetPassword } = useAuth();
//   const { isRTL, rtlViewStyle } = useRTL();

//   const handleFocus = (field: keyof FocusState) => {
//     setFocused((prev) => ({ ...prev, [field]: true }));
//   };

//   const handleBlur = (field: keyof FocusState) => {
//     setFocused((prev) => ({ ...prev, [field]: false }));
//   };

//   const showSnackbar = (message: string, isError = true) => {
//     showToastable({
//       message: message,
//       status: isError ? "warning" : "success",
//       duration: 2000, // Matches Snackbar.LENGTH_LONG
//     });
//   };

//   const handleRequestOTP = async () => {
//     if (!phone) {
//       showSnackbar(t("all_feilds_required"));
//       return;
//     }
//     const phoneRegex = /^[0-9]+$/;
//     if (!phoneRegex.test(phone)) {
//       showSnackbar(t("phoneDigitsOnly"));
//       return;
//     }
//     const fullPhone = `+${callingCode}${phone}`;
//     setLoading(true);
//     try {
//       console.log(fullPhone);
//       await forgotPassword(fullPhone);
//       showSnackbar(t("otpSent"), false);
//       setStep(2);
//     } catch (error: any) {
//       // console.error("ForgotPassword: Error requesting OTP:", error);
//       showSnackbar(error.message || t("failedToSendOTP"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResetPassword = async () => {
//     if (!otp || !newPassword) {
//       showSnackbar(t("allFieldsRequired"));
//       return;
//     }
//     if (otp.length < 4 || otp.length > 6) {
//       showSnackbar(t("invalidOTP"));
//       return;
//     }
//     if (newPassword.length < 6) {
//       showSnackbar(t("passwordTooShort"));
//       return;
//     }
//     const fullPhone = `+${callingCode}${phone}`;
//     setLoading(true);
//     try {
//       await resetPassword(fullPhone, otp, newPassword);
//       showSnackbar(t("passwordResetSuccess"), false);
//       router.replace("/login");
//     } catch (error: any) {
//       // console.error("ForgotPassword: Error resetting password:", error);
//       showSnackbar(error.message || t("failedToResetPassword"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.fullScreenContainer}>
//       {/* StatusBar and Background elements from Login screen - positioned absolutely behind content */}
//       <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
//       {/* Background Image replacing the gradient */}
//       <Image
//         source={bannerImage}
//         style={styles.backgroundImage}
//         resizeMode="cover"
//       />
//       <View style={styles.backgroundOverlay} />
//       <View style={styles.backgroundCircle1} />
//       <View style={styles.backgroundCircle2} />

//       {/* Main content wrapped in KeyboardAvoidingView and ScrollView */}
//       <KeyboardAvoidingView
//         style={styles.keyboardAvoidingContainer} // This needs to be transparent
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//         >
//           <View style={styles.contentWrapper}>
//             {/* Added a wrapper for consistent padding/sizing */}
//             {/* Header with Logo */}
//             <View style={styles.header}>
//               <Image
//                 source={{
//                   uri: "https://syriasouq.com/assets/logo-new-transparent-bg-03GdExie.png",
//                 }}
//                 style={styles.logo}
//                 resizeMode="contain"
//               />
//               <Text style={styles.title}>{t("request_otp")}</Text>
//               {/* <Text style={styles.subtitle}>
//                 {step === 1 ? t("enterPhoneToReset") : t("enterOtpAndNewPass")}
//               </Text> */}
//             </View>
//             {/* Main Card replicating Login UI */}
//             <View style={styles.card}>
//               {/* Phone Input with Country Picker */}
//               <View style={styles.inputGroup}>
//                 <Text
//                   style={[
//                     styles.label,
//                     {
//                       textAlign: isRTL ? "right" : "left",
//                       marginLeft: isRTL ? 0 : 2,
//                       marginRight: isRTL ? 2 : 0,
//                     },
//                   ]}
//                 >
//                   {/* {t("phoneNumber")} */}
//                 </Text>
//                 <View style={[styles.phoneInputRow, rtlViewStyle]}>
//                   <View
//                     style={[
//                       styles.countryPickerContainer,
//                       focused.phone && styles.inputFocused,
//                       step === 2 && styles.inputDisabled,
//                     ]}
//                   >
//                     {countryCode === "SY" && (
//                       <Image source={syriaFlag} style={styles.syriaFlag} />
//                     )}
//                     <CountryPicker
//                       countryCode={countryCode}
//                       withFilter
//                       withFlag={true}
//                       withCallingCode
//                       onSelect={(country: Country) => {
//                         setCountryCode(country.cca2 as CountryCode);
//                         setCallingCode(country.callingCode[0]);
//                       }}
//                       containerButtonStyle={[
//                         styles.countryPickerButton,
//                         countryCode === "SY" && styles.hiddenCountryPicker,
//                       ]}
//                       disabled={step === 2}
//                     />
//                   </View>
//                   <View
//                     style={[
//                       styles.inputContainer,
//                       styles.phoneInput,
//                       focused.phone && styles.inputFocused,
//                       step === 2 && styles.inputDisabled,
//                     ]}
//                   >
//                     <Ionicons
//                       name="call-outline"
//                       size={20}
//                       color={focused.phone ? "#B80200" : "#666"}
//                       style={styles.inputIcon}
//                     />
//                     <TextInput
//                       placeholder={t("example_phone_number")}
//                       placeholderTextColor="#999"
//                       value={phone}
//                       onChangeText={setPhone}
//                       keyboardType="phone-pad"
//                       style={[
//                         styles.textInput,
//                         { textAlign: isRTL ? "right" : "left" },
//                       ]}
//                       textContentType="telephoneNumber"
//                       autoComplete="tel"
//                       onFocus={() => handleFocus("phone")}
//                       onBlur={() => handleBlur("phone")}
//                       editable={step === 1}
//                     />
//                   </View>
//                 </View>
//               </View>

//               {step === 2 && (
//                 <>
//                   {/* OTP Input */}
//                   <View style={styles.inputGroup}>
//                     <Text
//                       style={[
//                         styles.label,
//                         {
//                           textAlign: isRTL ? "right" : "left",
//                           marginLeft: isRTL ? 0 : 2,
//                           marginRight: isRTL ? 2 : 0,
//                         },
//                       ]}
//                     >
//                       {t("otp")}
//                     </Text>
//                     <View
//                       style={[
//                         styles.inputContainer,
//                         focused.otp && styles.inputFocused,
//                       ]}
//                     >
//                       <Ionicons
//                         name="key-outline"
//                         size={20}
//                         color={focused.otp ? "#B80200" : "#666"}
//                         style={styles.inputIcon}
//                       />
//                       <TextInput
//                         placeholder={t("enterOTP")}
//                         placeholderTextColor="#999"
//                         value={otp}
//                         onChangeText={setOtp}
//                         keyboardType="numeric"
//                         style={[
//                           styles.textInput,
//                           { textAlign: isRTL ? "right" : "left" },
//                         ]}
//                         onFocus={() => handleFocus("otp")}
//                         onBlur={() => handleBlur("otp")}
//                         maxLength={6}
//                       />
//                     </View>
//                   </View>

//                   {/* New Password Input */}
//                   <View style={styles.inputGroup}>
//                     <Text
//                       style={[
//                         styles.label,
//                         {
//                           textAlign: isRTL ? "right" : "left",
//                           marginLeft: isRTL ? 0 : 2,
//                           marginRight: isRTL ? 2 : 0,
//                         },
//                       ]}
//                     >
//                       {t("newPassword")}
//                     </Text>
//                     <View
//                       style={[
//                         styles.inputContainer,
//                         focused.newPassword && styles.inputFocused,
//                       ]}
//                     >
//                       <Ionicons
//                         name="lock-closed-outline"
//                         size={20}
//                         color={focused.newPassword ? "#B80200" : "#666"}
//                         style={styles.inputIcon}
//                       />
//                       <TextInput
//                         placeholder={t("enterNewPassword")}
//                         placeholderTextColor="#999"
//                         value={newPassword}
//                         onChangeText={setNewPassword}
//                         secureTextEntry={!showPassword}
//                         style={[
//                           styles.textInput,
//                           { textAlign: isRTL ? "right" : "left" },
//                         ]}
//                         textContentType="newPassword"
//                         autoComplete="new-password"
//                         onFocus={() => handleFocus("newPassword")}
//                         onBlur={() => handleBlur("newPassword")}
//                       />
//                       <TouchableOpacity
//                         onPress={() => setShowPassword(!showPassword)}
//                         style={styles.passwordToggle}
//                         activeOpacity={0.7}
//                       >
//                         <Ionicons
//                           name={showPassword ? "eye-off" : "eye"}
//                           size={22}
//                           color={focused.newPassword ? "#B80200" : "#666"}
//                         />
//                       </TouchableOpacity>
//                     </View>
//                   </View>
//                 </>
//               )}

//               {/* Action Button */}
//               <TouchableOpacity
//                 style={[
//                   styles.loginButton,
//                   loading && styles.loginButtonDisabled,
//                 ]}
//                 onPress={step === 1 ? handleRequestOTP : handleResetPassword}
//                 disabled={loading}
//                 activeOpacity={0.8}
//               >
//                 <View style={styles.buttonContent}>
//                   {loading ? (
//                     <>
//                       <ActivityIndicator color="#FFFFFF" size="small" />
//                       <Text style={styles.loginButtonText}>
//                         {t("loading")}...
//                       </Text>
//                     </>
//                   ) : (
//                     <Text style={styles.loginButtonText}>
//                       {step === 1 ? t("requestOTP") : t("resetPassword")}
//                     </Text>
//                   )}
//                 </View>
//               </TouchableOpacity>

//               {/* Back to Login Link */}
//               {/* <View style={styles.registerLinkContainer}>
//                 <Text style={styles.registerLinkText}>
//                   {t("rememberedYourPassword")}{" "}
//                 </Text>
//                 <TouchableOpacity onPress={() => router.back()}>
//                   <Text style={styles.registerLink}>{t("backToLogin")}</Text>
//                 </TouchableOpacity>
//               </View> */}
//             </View>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   fullScreenContainer: {
//     flex: 1,
//     backgroundColor: "#f8f9fa", // Default background for the entire screen
//   },
//   backgroundImage: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     height: height * 0.5,
//     width: width,
//   },
//   backgroundOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     height: height * 0.5,
//     backgroundColor: "rgba(0, 0, 0, 0.4)",
//     borderBottomLeftRadius: 10,
//     borderBottomRightRadius: 10,
//   },
//   backgroundCircle1: {
//     position: "absolute",
//     width: width * 0.6,
//     height: width * 0.6,
//     borderRadius: width * 0.3,
//     backgroundColor: "#B80200",
//     opacity: 0.1,
//     top: -width * 0.15,
//     right: -width * 0.15,
//   },
//   backgroundCircle2: {
//     position: "absolute",
//     width: width * 0.4,
//     height: width * 0.4,
//     borderRadius: width * 0.2,
//     backgroundColor: "#313332",
//     opacity: 0.1,
//     bottom: height * 0.15,
//     left: -width * 0.1,
//   },
//   keyboardAvoidingContainer: {
//     flex: 1,
//     backgroundColor: "transparent", // Make KeyboardAvoidingView transparent
//   },
//   scrollContent: {
//     flexGrow: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingBottom: 20,
//   },
//   contentWrapper: {
//     // Added wrapper to hold header and card, applies common padding/max width
//     width: "100%",
//     maxWidth: 400,
//     paddingHorizontal: 20,
//     paddingTop: Platform.OS === "ios" ? 50 : 30, // Adjust paddingTop for header
//     justifyContent: "center",
//     alignItems: "center",
//     flex: 1, // Ensures it takes available space
//   },
//   header: {
//     alignItems: "center",
//     width: "100%",
//     marginBottom: 10,
//     paddingTop: 10,
//   },
//   logo: {
//     width: 140,
//     height: 50,
//     marginBottom: 10,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#ffffff",
//     marginBottom: 4,
//     letterSpacing: -0.3,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "rgba(255, 255, 255, 0.8)",
//     textAlign: "center",
//     fontWeight: "400",
//   },
//   card: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 20,
//     padding: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.12,
//     shadowRadius: 16,
//     elevation: 12,
//     borderWidth: 1,
//     borderColor: "rgba(0, 0, 0, 0.05)",
//     width: "100%",
//   },
//   inputGroup: {
//     marginBottom: 12,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#1a1a1a",
//     marginBottom: 6,
//   },
//   phoneInputRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   countryPickerContainer: {
//     position: "relative",
//     backgroundColor: "#f8f9fa",
//     borderRadius: 12,
//     height: 50,
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1.5,
//     borderColor: "#e9ecef",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 4,
//     elevation: 2,
//     minWidth: 70,
//     overflow: "hidden",
//   },
//   countryPickerButton: {
//     width: "100%",
//     height: "100%",
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "transparent",
//     zIndex: 1,
//   },
//   hiddenCountryPicker: {
//     opacity: 0,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f8f9fa",
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     height: 50,
//     borderWidth: 1.5,
//     borderColor: "#e9ecef",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   phoneInput: {
//     flex: 1,
//   },
//   inputFocused: {
//     borderColor: "#B80200",
//     backgroundColor: "#ffffff",
//     shadowColor: "#B80200",
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   inputDisabled: {
//     backgroundColor: "#e9ecef",
//     opacity: 0.7,
//     borderColor: "#d1d1d1",
//   },
//   inputIcon: {
//     width: 28,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 6,
//   },
//   textInput: {
//     flex: 1,
//     fontSize: 15,
//     color: "#1a1a1a",
//     paddingVertical: 0,
//     fontWeight: "500",
//   },
//   passwordToggle: {
//     paddingLeft: 8,
//     paddingRight: 2,
//   },
//   loginButton: {
//     backgroundColor: "#B80200",
//     paddingVertical: 14,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#B80200",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//     minHeight: 50,
//   },
//   loginButtonDisabled: {
//     opacity: 0.8,
//   },
//   buttonContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   loginButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//     letterSpacing: 0.3,
//   },
//   registerLinkContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 12,
//   },
//   registerLinkText: {
//     fontSize: 14,
//     color: "#666",
//   },
//   registerLink: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#B80200",
//   },
//   syriaFlag: {
//     position: "absolute",
//     width: 24,
//     height: 16,
//     resizeMode: "cover",
//     borderRadius: 2,
//     zIndex: 0,
//   },
// });
