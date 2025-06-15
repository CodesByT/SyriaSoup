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
  password: boolean;
}

export default function Login() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [countryCode, setCountryCode] = useState<CountryCode>("SY");
  const [callingCode, setCallingCode] = useState<string>("963");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [focused, setFocused] = useState<FocusState>({
    phone: false,
    password: false,
  });

  const router = useRouter();
  const { loginUser } = useAuth();
  const { isRTL, rtlViewStyle } = useRTL();

  useEffect(() => {
    console.log("isRTL:", isRTL);
  }, [isRTL]);

  const handleFocus = (field: keyof FocusState): void => {
    setFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof FocusState): void => {
    setFocused((prev) => ({ ...prev, [field]: false }));
  };

  const handleLogin = async (): Promise<void> => {
    if (!phone || !password) {
      showToastable({
        message: t("all_feilds_required"),
        status: "warning",
        duration: 2000,
      });
      return;
    }
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(phone)) {
      showToastable({
        message: t("phone_number_must_be_digits_only"),
        status: "warning",
        duration: 2000,
      });
      return;
    }
    setLoading(true);
    try {
      await loginUser(`${callingCode}${phone}`, password);
      showToastable({
        message: t("login_successful"),
        status: "success",
        duration: 2000,
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      showToastable({
        message: t("invalid_email_or_password"),
        status: "warning",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = (country: Country): void => {
    console.log("Login: Selected country code:", country.cca2);
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
            <View style={styles.header}>
              <Image
                source={{
                  uri: "https://syriasouq.com/assets/logo-new-transparent-bg-03GdExie.png",
                }}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>{t("Login")}</Text>
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
                      onSelect={handleCountrySelect}
                      containerButtonStyle={[
                        styles.countryPickerButton,
                        countryCode === "SY" && styles.hiddenCountryPicker,
                      ]}
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
                  {t("password_statement")}
                </Text>
              </View>

              <View style={styles.inputGroup}>
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
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={[
                      styles.textInput,
                      { textAlign: isRTL ? "right" : "left" },
                    ]}
                    textContentType="password"
                    autoComplete="password"
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

              <TouchableOpacity
                style={[
                  styles.forgotPasswordLink,
                  isRTL ? styles.forgotPasswordRTL : styles.forgotPasswordLTR,
                ]}
                onPress={() => router.push("/forgot-password")}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>
                  {t("forgot_password")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.loginButtonText}>
                        {t("signingIn")}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.loginButtonText}>
                      {t("LoginButton")}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
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
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#696969",
    marginBottom: 6,
    marginTop: 5,
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
  countryPickerFocused: {
    borderColor: "#B80200",
    backgroundColor: "#ffffff",
    shadowColor: "#B80200",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
  forgotPasswordLink: {
    marginBottom: 12,
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B80200",
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
    resizeMode: "contain",
    borderRadius: 2,
    zIndex: 0,
    left: (70 - 24) / 2, // 23px
    top: (50 - 16) / 2, // 17px
  },
  forgotPasswordRTL: {
    alignItems: "flex-end",
    alignSelf: "flex-end",
  },
  forgotPasswordLTR: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
  },
});
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
// import { showToastable } from "react-native-toastable";
// import bannerImage from "../../assets/banner.jpeg";
// import syriaFlag from "../../assets/flags/syria-flag.png";
// import { useAuth } from "../../contexts/AuthContext";
// import { useRTL } from "../../hooks/useRTL";

// const { width, height } = Dimensions.get("window");

// interface FocusState {
//   phone: boolean;
//   password: boolean;
// }

// export default function Login() {
//   const { t } = useTranslation();
//   const [phone, setPhone] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [countryCode, setCountryCode] = useState<CountryCode>("SY");
//   const [callingCode, setCallingCode] = useState<string>("963");
//   const [loading, setLoading] = useState<boolean>(false);
//   const [showPassword, setShowPassword] = useState<boolean>(false);
//   const [focused, setFocused] = useState<FocusState>({
//     phone: false,
//     password: false,
//   });

//   const router = useRouter();
//   const { loginUser } = useAuth();
//   const { isRTL, rtlViewStyle } = useRTL();

//   const handleFocus = (field: keyof FocusState): void => {
//     setFocused((prev) => ({ ...prev, [field]: true }));
//   };

//   const handleBlur = (field: keyof FocusState): void => {
//     setFocused((prev) => ({ ...prev, [field]: false }));
//   };

//   const handleLogin = async (): Promise<void> => {
//     if (!phone || !password) {
//       showToastable({
//         message: t("all_feilds_required"),
//         status: "warning",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
//       });
//       return;
//     }
//     const phoneRegex = /^[0-9]+$/;
//     if (!phoneRegex.test(phone)) {
//       showToastable({
//         message: t("phone_number_must_be_digits_only"),
//         status: "warning",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       await loginUser(`${callingCode}${phone}`, password);

//       showToastable({
//         message: t("login_successful"),
//         status: "success",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
//       });
//       router.replace("/(tabs)");
//     } catch (error: any) {
//       showToastable({
//         message: t("invalid_email_or_password"),
//         status: "warning",
//         duration: 4000, // Matches Snackbar.LENGTH_LONG
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCountrySelect = (country: Country): void => {
//     console.log("Login: Selected country code:", country.cca2);
//     setCountryCode(country.cca2 as CountryCode);
//     setCallingCode(country.callingCode[0]);
//   };

//   return (
//     <>
//       <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
//       <KeyboardAvoidingView
//         style={styles.keyboardAvoidingContainer}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//       >
//         {/* Background Image replacing the gradient */}
//         <Image
//           source={bannerImage}
//           style={styles.backgroundImage}
//           resizeMode="cover"
//         />
//         <View style={styles.backgroundOverlay} />
//         <View style={styles.backgroundCircle1} />
//         <View style={styles.backgroundCircle2} />

//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//         >
//           <View style={styles.container}>
//             {/* Header with Logo */}
//             <View style={styles.header}>
//               <Image
//                 source={{
//                   uri: "https://syriasouq.com/assets/logo-new-transparent-bg-03GdExie.png",
//                 }}
//                 style={styles.logo}
//                 resizeMode="contain"
//               />
//               <Text style={styles.title}>{t("Login")}</Text>
//               {/* <Text style={styles.subtitle}>{t("welcomeBack")}</Text> */}
//             </View>

//             {/* Main Card */}
//             <View style={styles.card}>
//               {/* Phone Input with Country Picker */}
//               <View style={styles.inputGroup}>
//                 <View style={[styles.phoneInputRow, rtlViewStyle]}>
//                   <View
//                     style={[
//                       styles.countryPickerContainer,
//                       focused.phone && styles.countryPickerFocused,
//                       { flexDirection: isRTL ? "row-reverse" : "row" }, // Adjust flex direction based on RTL
//                     ]}
//                   >
//                     {countryCode === "SY" && (
//                       <Image source={syriaFlag} style={styles.syriaFlag} />
//                     )}
//                     <CountryPicker
//                       countryCode={countryCode}
//                       withFilter
//                       withFlag={true} // Always show flag
//                       withCallingCode
//                       onSelect={handleCountrySelect}
//                       containerButtonStyle={[
//                         styles.countryPickerButton,
//                         countryCode === "SY" && styles.hiddenCountryPicker,
//                       ]}
//                     />
//                   </View>
//                   <View
//                     style={[
//                       styles.inputContainer,
//                       styles.phoneInput,
//                       focused.phone && styles.inputFocused,
//                     ]}
//                   >
//                     <View style={styles.iconContainer}>
//                       <Ionicons
//                         name="call-outline"
//                         size={20}
//                         color={focused.phone ? "#B80200" : "#666"}
//                       />
//                     </View>
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
//                     />
//                   </View>
//                 </View>
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
//                   {t("password_statement")}
//                 </Text>
//               </View>

//               {/* Password Input */}
//               <View style={styles.inputGroup}>
//                 <View
//                   style={[
//                     styles.inputContainer,
//                     focused.password && styles.inputFocused,
//                   ]}
//                 >
//                   <View style={styles.iconContainer}>
//                     <Ionicons
//                       name="lock-closed-outline"
//                       size={20}
//                       color={focused.password ? "#B80200" : "#666"}
//                     />
//                   </View>
//                   <TextInput
//                     placeholder={t("enter_password")}
//                     placeholderTextColor="#999"
//                     value={password}
//                     onChangeText={setPassword}
//                     secureTextEntry={!showPassword}
//                     style={[
//                       styles.textInput,
//                       { textAlign: isRTL ? "right" : "left" },
//                     ]}
//                     textContentType="password"
//                     autoComplete="password"
//                     onFocus={() => handleFocus("password")}
//                     onBlur={() => handleBlur("password")}
//                   />
//                   <TouchableOpacity
//                     onPress={() => setShowPassword(!showPassword)}
//                     style={styles.passwordToggle}
//                     activeOpacity={0.7}
//                   >
//                     <Ionicons
//                       name={showPassword ? "eye-off" : "eye"}
//                       size={22}
//                       color={focused.password ? "#B80200" : "#666"}
//                     />
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               {/* Forgot Password Link */}
//               <TouchableOpacity
//                 style={[
//                   styles.forgotPasswordLink,
//                   isRTL ? styles.forgotPasswordRTL : styles.forgotPasswordLTR,
//                 ]}
//                 onPress={() => router.push("/forgot-password")}
//                 activeOpacity={0.7}
//               >
//                 <Text style={styles.forgotPasswordText}>
//                   {t("forgot_password")}
//                 </Text>
//               </TouchableOpacity>

//               {/* Login Button */}
//               <TouchableOpacity
//                 style={[
//                   styles.loginButton,
//                   loading && styles.loginButtonDisabled,
//                 ]}
//                 onPress={handleLogin}
//                 disabled={loading}
//                 activeOpacity={0.8}
//               >
//                 <View style={styles.buttonContent}>
//                   {loading ? (
//                     <>
//                       <ActivityIndicator color="#FFFFFF" size="small" />
//                       <Text style={styles.loginButtonText}>
//                         {t("signingIn")}
//                       </Text>
//                     </>
//                   ) : (
//                     <Text style={styles.loginButtonText}>
//                       {t("LoginButton")}
//                     </Text>
//                   )}
//                 </View>
//               </TouchableOpacity>

//               {/* Register Link */}
//               {/* <View style={styles.registerLinkContainer}>
//                  <Text style={styles.registerLinkText}>
//                    {t("dontHaveAccount")}
//                  </Text>
//                  <TouchableOpacity onPress={() => router.push("/register")}>
//                    <Text style={styles.registerLink}>{t("signUp")}</Text>
//                  </TouchableOpacity>
//                </View> */}
//             </View>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   keyboardAvoidingContainer: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
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
//   scrollContent: {
//     flexGrow: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingBottom: 20,
//   },
//   container: {
//     flex: 1,
//     width: "100%",
//     maxWidth: 400,
//     paddingHorizontal: 10,
//     paddingTop: Platform.OS === "ios" ? 50 : 30,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   header: {
//     alignItems: "center",
//     width: "100%",
//     marginBottom: 10,
//     paddingTop: 10,
//   },
//   logo: {
//     width: 200,
//     height: 70,
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
//     color: "#696969",
//     marginBottom: 6,
//     marginTop: 5,
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
//     flexDirection: "row", // Ensure content is in a row
//     paddingHorizontal: 10, // Add horizontal padding
//   },
//   countryPickerButton: {
//     width: "100%",
//     height: "100%",
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "transparent",
//     zIndex: 1, // Higher z-index to be above Syria flag
//   },
//   hiddenCountryPicker: {
//     opacity: 0,
//   },
//   countryPickerFocused: {
//     borderColor: "#B80200",
//     backgroundColor: "#ffffff",
//     shadowColor: "#B80200",
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   callingCodeText: {
//     fontSize: 15,
//     color: "#1a1a1a",
//     fontWeight: "500",
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
//   iconContainer: {
//     width: 28,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   textInput: {
//     flex: 1,
//     fontSize: 15,
//     color: "#1a1a1a",
//     paddingVertical: 0,
//     marginLeft: 6,
//     fontWeight: "500",
//   },
//   passwordToggle: {
//     paddingLeft: 8,
//     paddingRight: 2,
//   },
//   forgotPasswordLink: {
//     marginBottom: 12,
//     marginTop: 4,
//   },
//   forgotPasswordText: {
//     fontSize: 13,
//     fontWeight: "600",
//     color: "#B80200",
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
//     // Adjust these styles if needed to make it look good next to the country code
//     width: 24,
//     height: 16,
//     resizeMode: "contain", // Changed to contain to ensure flag is fully visible
//     borderRadius: 2,
//     marginRight: 5, // Space between Syria flag and calling code
//   },
//   forgotPasswordRTL: {
//     alignItems: "flex-end",
//     alignSelf: "flex-end",
//   },
//   forgotPasswordLTR: {
//     alignItems: "flex-start",
//     alignSelf: "flex-start",
//   },
// });
