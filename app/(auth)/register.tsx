// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import CountryPicker, {
//   Country,
//   CountryCode,
// } from "react-native-country-picker-modal";
// import { useAuth } from "../../contexts/AuthContext";

// export default function Register() {
//   const [username, setUsername] = useState("");
//   const [phone, setPhone] = useState("");
//   const [password, setPassword] = useState("");
//   const [countryCode, setCountryCode] = useState<CountryCode>("SY");
//   const [callingCode, setCallingCode] = useState("963");
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [usernameFocused, setUsernameFocused] = useState(false);
//   const [phoneFocused, setPhoneFocused] = useState(false);
//   const [passwordFocused, setPasswordFocused] = useState(false);

//   const { registerUser } = useAuth();
//   const router = useRouter();
//   const { t } = useTranslation();

//   const handleRegister = async () => {
//     if (!username || !phone || !password) {
//       Alert.alert(t("error"), t("allFieldsRequired"));
//       return;
//     }
//     console.log(
//       "Register: Attempting registration with phone:",
//       `+${callingCode}${phone}`
//     );
//     setIsLoading(true);
//     try {
//       await registerUser(username, `${callingCode}${phone}`, password);
//       console.log("Register: Registration successful");
//       Alert.alert(t("success"), t("registered"));
//       router.back();
//     } catch (error: any) {
//       console.error("Register: Error registering:", error);
//       Alert.alert(t("error"), t("failedToRegister"));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.keyboardAvoidingContainer}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <View style={styles.container}>
//           <View style={styles.card}>
//             <Text style={styles.title}>{t("createAccount")}</Text>

//             {/* Username Input */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>{t("username")}</Text>
//               <View
//                 style={[
//                   styles.inputContainer,
//                   usernameFocused && styles.inputFocused,
//                 ]}
//               >
//                 <Ionicons
//                   name="person-outline"
//                   size={20}
//                   color={usernameFocused ? "#B80200" : "#666"}
//                   style={styles.inputIcon}
//                 />
//                 <TextInput
//                   placeholder={t("enterUsername")}
//                   value={username}
//                   onChangeText={setUsername}
//                   style={styles.textInput}
//                   autoCapitalize="none"
//                   textContentType="username"
//                   autoComplete="username"
//                   placeholderTextColor="#999"
//                   onFocus={() => setUsernameFocused(true)}
//                   onBlur={() => setUsernameFocused(false)}
//                 />
//               </View>
//             </View>

//             {/* Phone Number Input Group */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>{t("phoneNumber")}</Text>
//               <View style={styles.phoneInputRow}>
//                 <CountryPicker
//                   countryCode={countryCode}
//                   withFilter
//                   withFlag
//                   withCallingCode
//                   onSelect={(country: Country) => {
//                     console.log(
//                       "Register: Selected country code:",
//                       country.cca2
//                     );
//                     setCountryCode(country.cca2 as CountryCode);
//                     setCallingCode(country.callingCode[0]);
//                   }}
//                   containerButtonStyle={[
//                     styles.countryPickerButton,
//                     phoneFocused && styles.inputFocused,
//                   ]}
//                 />
//                 <View
//                   style={[
//                     styles.inputContainer,
//                     styles.phoneInput,
//                     phoneFocused && styles.inputFocused,
//                   ]}
//                 >
//                   <Ionicons
//                     name="call-outline"
//                     size={20}
//                     color={phoneFocused ? "#B80200" : "#666"}
//                     style={styles.inputIcon}
//                   />
//                   <TextInput
//                     placeholder={t("enterPhoneNumber")}
//                     value={phone}
//                     onChangeText={setPhone}
//                     keyboardType="phone-pad"
//                     style={styles.textInput}
//                     textContentType="telephoneNumber"
//                     autoComplete="tel"
//                     placeholderTextColor="#999"
//                     onFocus={() => setPhoneFocused(true)}
//                     onBlur={() => setPhoneFocused(false)}
//                   />
//                 </View>
//               </View>
//             </View>

//             {/* Password Input */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>{t("password")}</Text>
//               <View
//                 style={[
//                   styles.inputContainer,
//                   passwordFocused && styles.inputFocused,
//                 ]}
//               >
//                 <Ionicons
//                   name="lock-closed-outline"
//                   size={20}
//                   color={passwordFocused ? "#B80200" : "#666"}
//                   style={styles.inputIcon}
//                 />
//                 <TextInput
//                   placeholder={t("enterPassword")}
//                   value={password}
//                   onChangeText={setPassword}
//                   secureTextEntry={!showPassword}
//                   style={styles.textInput}
//                   textContentType="newPassword"
//                   autoComplete="new-password"
//                   placeholderTextColor="#999"
//                   onFocus={() => setPasswordFocused(true)}
//                   onBlur={() => setPasswordFocused(false)}
//                 />
//                 <TouchableOpacity
//                   onPress={() => setShowPassword(!showPassword)}
//                   style={styles.passwordToggle}
//                 >
//                   <Ionicons
//                     name={showPassword ? "eye-off" : "eye"}
//                     size={24}
//                     color={passwordFocused ? "#B80200" : "#666"}
//                   />
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* Register Button */}
//             <TouchableOpacity
//               style={[
//                 styles.registerButton,
//                 isLoading && styles.registerButtonDisabled,
//               ]}
//               onPress={handleRegister}
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <ActivityIndicator color="#FFFFFF" />
//               ) : (
//                 <Text style={styles.registerButtonText}>{t("register")}</Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   keyboardAvoidingContainer: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   scrollContent: {
//     flexGrow: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   container: {
//     flex: 1,
//     width: "100%",
//     paddingHorizontal: 20,
//     backgroundColor: "#FFFFFF",
//     justifyContent: "center",
//   },
//   card: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 20,
//     padding: 20,
//     width: "100%",
//     maxWidth: 400,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#314352",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#314352",
//     marginBottom: 8,
//   },
//   phoneInputRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },
//   countryPickerButton: {
//     backgroundColor: "#F5F5F5",
//     borderRadius: 15,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     height: 50,
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F5F5F5",
//     borderRadius: 15,
//     paddingHorizontal: 15,
//     height: 50,
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   phoneInput: {
//     flex: 1,
//   },
//   inputFocused: {
//     borderColor: "#B80200",
//     shadowColor: "#B80200",
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     elevation: 4,
//     transform: [{ scale: 1.02 }],
//   },
//   inputIcon: {
//     marginRight: 10,
//   },
//   textInput: {
//     flex: 1,
//     fontSize: 16,
//     color: "#314352",
//     paddingVertical: 0,
//   },
//   passwordToggle: {
//     paddingLeft: 10,
//   },
//   registerButton: {
//     backgroundColor: "#B80200",
//     paddingVertical: 15,
//     borderRadius: 15,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#B80200",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//     elevation: 5,
//   },
//   registerButtonDisabled: {
//     opacity: 0.6,
//   },
//   registerButtonText: {
//     color: "#FFFFFF",
//     fontSize: 18,
//     fontWeight: "700",
//   },
// });
//-----------------------------------------------
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  // Alert, // We can remove Alert as it's no longer used
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
import Snackbar from "react-native-snackbar"; // Keep this import
import { useAuth } from "../../contexts/AuthContext";

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

  const handleFocus = (field: keyof FocusState): void => {
    setFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof FocusState): void => {
    setFocused((prev) => ({ ...prev, [field]: false }));
  };

  // --- Strong Password Checker Function ---
  const checkPasswordStrength = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter.";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number.";
    }
    // Added special character check regex (common special chars)
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~` ]/.test(password)) {
      return "Password must contain at least one special character (e.g., !@#$%^&*).";
    }
    return null;
  };

  const handleRegister = async (): Promise<void> => {
    // --- Validation Checks using Snackbar ---
    if (!username || !phone || !password) {
      Snackbar.show({
        text: t("All Fields Required!"),
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: "#FFC107", // A warning color
        textColor: "#333",
      });
      return;
    }

    const phoneRegex = /^[0-9]+$/; // Regex to match only digits (0-9)
    if (!phoneRegex.test(phone)) {
      Snackbar.show({
        text: t("Phone number must be digits only"),
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: "#D32F2F", // An error color
        textColor: "#FFFFFF",
      });
      return;
    }

    // --- Password Strength Check ---
    const passwordCheckResult = checkPasswordStrength(password);
    if (passwordCheckResult) {
      Snackbar.show({
        text: t("Weak Password") + ": " + passwordCheckResult,
        duration: Snackbar.LENGTH_INDEFINITE, // Show until dismissed or action
        backgroundColor: "#D32F2F",
        textColor: "#FFFFFF",
        action: {
          text: t("DISMISS"), // Assuming you have a translation for DISMISS
          textColor: "#FFEB3B", // A contrasting color for the action button
          onPress: () => Snackbar.dismiss(),
        },
      });
      return;
    }

    setIsLoading(true);

    try {
      await registerUser(username, `${callingCode}${phone}`, password);
      console.log("Register: Registration successful");
      Snackbar.show({
        text: t("registered") || "Registration successful!",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#4CAF50", // A success color
        textColor: "#FFFFFF",
      });
      router.back();
    } catch (error: any) {
      console.error("Register: Error registering:", error);
      Snackbar.show({
        text: t("failedToRegister") || "Registration failed. Please try again.",
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: "#D32F2F",
        textColor: "#FFFFFF",
        action: {
          text: t("RETRY"), // Assuming you have a translation for RETRY
          textColor: "#FFEB3B",
          onPress: () => handleRegister(), // Allow user to retry
        },
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
        {/* Background Design Elements */}
        <View style={styles.backgroundGradient} />
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
              <Text style={styles.title}>{t("Register New Account")}</Text>
              <Text style={styles.subtitle}>
                Join SyriaSouq community today
              </Text>
            </View>

            {/* Main Card */}
            <View style={styles.card}>
              {/* Username Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("Username")}</Text>
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
                    placeholder={t("Enter Username")}
                    value={username}
                    onChangeText={setUsername}
                    style={styles.textInput}
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
                <Text style={styles.label}>{t("Phone Number")}</Text>
                <View style={styles.phoneInputRow}>
                  <CountryPicker
                    countryCode={countryCode}
                    withFilter
                    withFlag
                    withCallingCode
                    onSelect={handleCountrySelect}
                    containerButtonStyle={[
                      styles.countryPickerButton,
                      focused.phone && styles.countryPickerFocused,
                    ]}
                  />
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
                      placeholder={t("e.g (11223344)")}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      style={styles.textInput}
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
                <Text style={styles.label}>{t("Password")}</Text>
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
                    placeholder={t("Enter Password")}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={styles.textInput}
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
                      <Text style={styles.registerButtonText}>Creating...</Text>
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
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.loginLink}>Sign In</Text>
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
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: "#1a1a1a",
    borderBottomLeftRadius: 10, // Adjust the value to control the curve
    borderBottomRightRadius: 10, // Adjust the value to control the curve
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
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    width: "100%", // Ensure container takes full width
    maxWidth: 400, // Optional: set a max width for larger screens
    paddingHorizontal: 10,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally
  },
  header: {
    alignItems: "center",
    width: "100%", // Ensure header takes full width
    marginBottom: 10, // Reduced margin
    paddingTop: 10,
  },
  logo: {
    width: 200,
    height: 70,
    marginBottom: 10, // Reduced margin
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4, // Reduced margin
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
    width: "100%", // Ensure card takes full width within container
    marginHorizontal: 0, // Remove horizontal margin if container handles centering
  },
  inputGroup: {
    marginBottom: 12, // Reduced margin
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6, // Reduced margin
    marginLeft: 2,
    marginTop: 5,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // Reduced gap
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
    marginTop: 10, // Reduced margin
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
    marginTop: 12, // Reduced margin
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
});
