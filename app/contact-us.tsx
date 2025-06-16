"use client";

import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  LayoutAnimation,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRTL } from "../hooks/useRTL";

// Enable LayoutAnimation for Android
// if (
//   Platform.OS === "android" &&
//   UIManager.setLayoutAnimationEnabledExperimental
// ) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

const { width } = Dimensions.get("window");

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface FocusState {
  name: boolean;
  email: boolean;
  phone: boolean;
  message: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function ContactUs() {
  const { t } = useTranslation();
  const { isRTL, rtlStyle, getFlexDirection } = useRTL();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [focused, setFocused] = useState<FocusState>({
    name: false,
    email: false,
    phone: false,
    message: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null); // State to manage which FAQ is open
  // 1. Create a ref for your ScrollView
  const scrollViewRef = useRef<ScrollView>(null);

  // ... (existing functions)

  // 2. Add a new function to scroll to the top
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };
  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setStatusMessage(""); // Clear status on input change
  };

  const handleFocus = (field: keyof FocusState) => {
    // Simplified - no complex state management
  };

  const handleBlur = (field: keyof FocusState) => {
    // Simplified - no complex state management
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setStatusMessage(t("nameRequired"));
      return false;
    }
    if (!form.email.trim()) {
      setStatusMessage(t("emailRequired"));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setStatusMessage(t("invalidEmail"));
      return false;
    }
    if (!form.message.trim()) {
      setStatusMessage(t("messageRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setStatusMessage("");
    try {
      // You should replace "http://localhost:5001" with the actual IP address or domain
      // of your backend server if you are running on a physical device or different network.
      // For emulator/simulator, localhost might work if the backend is on your dev machine.
      await axios.post("http://localhost:5001/api/contact/send", form);
      setStatusMessage(t("messageSentSuccess"));
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      // Log the error to console for debugging purposes
      // console.error("Error submitting contact form:", error);
      // Check if error has a response and data for more specific messages
      if (axios.isAxiosError(error) && error.response) {
        // If the server sends back a specific error message, use it
        setStatusMessage(error.response.data.message || t("messageSendError"));
      } else {
        setStatusMessage(t("messageSendError"));
      }
    } finally {
      // This ensures isSubmitting is set back to false in all cases
      setIsSubmitting(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch((e) => {
      console.error("Failed to make call:", e);
      setStatusMessage(t("cannotMakeCall"));
    });
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch((e) => {
      console.error("Failed to open email:", e);
      setStatusMessage(t("cannotOpenEmail"));
    });
  };

  const handleWhatsApp = (phone: string) => {
    Linking.openURL(`whatsapp://send?phone=${phone}`).catch((e) => {
      console.error("Failed to open WhatsApp:", e);
      setStatusMessage(t("whatsappNotInstalled"));
    });
  };

  const toggleFAQ = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: t("faqQuestion1"),
      answer: t("faqAnswer1"),
    },
    {
      question: t("faqQuestion2"),
      answer: t("faqAnswer2"),
    },
    {
      question: t("faqQuestion3"),
      answer: t("faqAnswer3"),
    },
    {
      question: t("faqQuestion4"),
      answer: t("faqAnswer4"),
    },
    {
      question: t("faqQuestion5"),
      answer: t("faqAnswer5"),
    },
  ];

  const renderContactInfo = () => (
    <View style={styles.contactInfoSection}>
      <Text style={[styles.sectionTitle, rtlStyle]}>
        {t("cant_find_looking")}
      </Text>
      <TouchableOpacity onPress={scrollToTop} activeOpacity={0.7}>
        <Text style={[styles.sectionDescription2, rtlStyle]}>
          {t("contact_support")}
        </Text>
      </TouchableOpacity>

      {/* <TouchableOpacity
        style={[styles.contactItem, { flexDirection: getFlexDirection() }]}
        onPress={() => handleEmail("syriasouq@outlook.com")}
        activeOpacity={0.7}
      >
        <View style={styles.contactIcon}>
          <Ionicons name="mail" size={20} color="#B80200" />
        </View>
        <View
          style={[
            styles.contactDetails,
            { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 },
          ]}
        >
          <Text style={[styles.contactLabel, rtlStyle]}>{t("email")}</Text>
          <Text style={[styles.contactValue, rtlStyle]}>
            syriasouq@outlook.com
          </Text>
        </View>
        <Ionicons
          name={isRTL ? "chevron-back" : "chevron-forward"}
          size={20}
          color="#666"
        />
      </TouchableOpacity> */}

      {/* <View style={[styles.contactItem, { flexDirection: getFlexDirection() }]}>
        <View style={styles.contactIcon}>
          <Ionicons name="location" size={20} color="#B80200" />
        </View>
        <View
          style={[
            styles.contactDetails,
            { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 },
          ]}
        >
          <Text style={[styles.contactLabel, rtlStyle]}>{t("address")}</Text>
          <Text style={[styles.contactValue, rtlStyle]}>
            {t("companyAddress")}
          </Text>
        </View>
      </View> */}
    </View>
  );

  const renderContactForm = () => (
    <SafeAreaView style={styles.formSection}>
      <Text style={[styles.sectionTitle, rtlStyle]}>{t("sendMessage")}</Text>
      {/* <Text style={[styles.sectionDescription, rtlStyle]}>
        {t("formDescription")}
      </Text> */}

      {/* Name Input */}
      <KeyboardAvoidingView>
        <View style={styles.inputGroup}>
          {/* <Text style={[styles.inputLabel, rtlStyle]}>
            {t("fullName")} <Text style={styles.required}>*</Text>
          </Text> */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#666"
              style={[styles.inputIcon, isRTL && { right: 16, left: "auto" }]}
            />
            <TextInput
              style={[
                styles.textInputSimple,
                rtlStyle,
                { paddingLeft: isRTL ? 16 : 50, paddingRight: isRTL ? 50 : 16 },
              ]}
              value={form.name}
              onChangeText={(text) => handleInputChange("name", text)}
              placeholder={t("fullName")}
              placeholderTextColor="#999"
              editable={!isSubmitting}
            />
          </View>
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          {/* <Text style={[styles.inputLabel, rtlStyle]}>
            {t("email")} <Text style={styles.required}>*</Text>
          </Text> */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#666"
              style={[styles.inputIcon, isRTL && { right: 16, left: "auto" }]}
            />
            <TextInput
              style={[
                styles.textInputSimple,
                rtlStyle,
                { paddingLeft: isRTL ? 16 : 50, paddingRight: isRTL ? 50 : 16 },
              ]}
              value={form.email}
              onChangeText={(text) => handleInputChange("email", text)}
              placeholder={t("enterEmail")}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>
        </View>

        {/* Phone Input */}
        <View style={styles.inputGroup}>
          {/* <Text style={[styles.inputLabel, rtlStyle]}>{t("phoneNumber")}</Text> */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#666"
              style={[styles.inputIcon, isRTL && { right: 16, left: "auto" }]}
            />
            <TextInput
              style={[
                styles.textInputSimple,
                rtlStyle,
                { paddingLeft: isRTL ? 16 : 50, paddingRight: isRTL ? 50 : 16 },
              ]}
              value={form.phone}
              onChangeText={(text) => handleInputChange("phone", text)}
              placeholder={t("enterPhoneNumber")}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
          </View>
        </View>

        {/* Message Input */}
        <View style={styles.inputGroup}>
          {/* <Text style={[styles.inputLabel, rtlStyle]}>
            {t("message")} <Text style={styles.required}>*</Text>
          </Text> */}
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={[styles.textAreaSimple, rtlStyle]}
              value={form.message}
              onChangeText={(text) => handleInputChange("message", text)}
              placeholder={t("enterMessage")}
              placeholderTextColor="#999"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>
        </View>

        {statusMessage ? (
          <Text
            style={[
              styles.statusMessage,
              {
                color: statusMessage.includes("success") ? "green" : "#B80200",
              },
            ]}
          >
            {statusMessage}
          </Text>
        ) : null}
      </KeyboardAvoidingView>
      <TouchableOpacity
        style={[
          styles.submitButton,
          { flexDirection: getFlexDirection() },
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#FFFFFF" />
            <Text
              style={[
                styles.submitButtonText,
                rtlStyle,
                { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
              ]}
            >
              {t("sendMessage")}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
  const renderFAQSection = () => (
    <View style={styles.faqSection}>
      <Text style={[styles.sectionTitle, rtlStyle]}>
        {t("frequentlyAskedQuestionsTitle") || "FAQs"} {/* Added fallback */}
      </Text>
      <Text style={[styles.sectionSubTitle, rtlStyle]}>
        {t("frequentlyAskedQuestionssubTitle") || "FAQs"} {/* Added fallback */}
      </Text>
      {faqs.map((faq, index) => (
        <View key={index} style={styles.faqItem}>
          <TouchableOpacity
            onPress={() => toggleFAQ(index)}
            style={[
              styles.faqQuestionContainer,
              { flexDirection: getFlexDirection() },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.faqQuestionText, rtlStyle]}>
              {faq.question || `Missing Question ${index + 1}`}
            </Text>
            <Ionicons
              name={openFAQIndex === index ? "chevron-up" : "chevron-down"}
              size={20}
              color="#B80200"
            />
          </TouchableOpacity>
          {openFAQIndex === index && (
            <Text style={[styles.faqAnswerText, rtlStyle]}>
              {faq.answer || `Missing Answer ${index + 1}`}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtlStyle]}>{t("contactUs")}</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContactForm()}
        {renderFAQSection()}
        {renderContactInfo()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#323332",
  },
  header: {
    backgroundColor: "#323332",
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 40,
  },
  contactInfoSection: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formSection: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20, // Add margin to separate from FAQ
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 20,
    textAlign: "center", // <--- Add this
  },
  sectionSubTitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center", // <--- Add this
  },
  sectionDescription2: {
    fontSize: 14,
    color: "#B80200",
    lineHeight: 20,
    marginBottom: 0,
    textAlign: "center", // <--- Add this
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 0,
    textAlign: "center", // <--- Add this
  },
  contactItem: {
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: "#666",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  required: {
    color: "#B80200",
  },
  statusMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: "#B80200",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#B80200",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  inputWrapper: {
    position: "relative",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    height: 50,
  },
  textInputSimple: {
    height: 50,
    fontSize: Math.max(15, 1),
    color: "#1a1a1a",
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  textAreaWrapper: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    minHeight: 120,
    padding: 16,
  },
  textAreaSimple: {
    fontSize: Math.max(15, 1),
    color: "#1a1a1a",
    fontWeight: "500",
    textAlignVertical: "top",
    minHeight: 80,
    backgroundColor: "transparent",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    top: 15,
    zIndex: 1,
  },
  // --- FAQ Styles ---
  faqSection: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // marginTop: 20, // Add margin to separate from contact form
  },
  faqItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 10,
  },
  faqQuestionContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1, // Allow text to take up available space
    paddingRight: 10, // Add some padding to the right of the text
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    paddingLeft: 5, // Indent answer slightly
    paddingRight: 5,
    lineHeight: 20,
  },
});
// "use client";

// import { Ionicons } from "@expo/vector-icons";
// import axios from "axios";
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   Dimensions,
//   KeyboardAvoidingView,
//   Linking,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import {
//   SafeAreaView,
//   useSafeAreaInsets,
// } from "react-native-safe-area-context";
// import { useRTL } from "../hooks/useRTL";

// const { width } = Dimensions.get("window");

// interface ContactForm {
//   name: string;
//   email: string;
//   phone: string;
//   message: string;
// }

// interface FocusState {
//   name: boolean;
//   email: boolean;
//   phone: boolean;
//   message: boolean;
// }

// export default function ContactUs() {
//   const { t } = useTranslation();
//   const { isRTL, rtlStyle, getFlexDirection } = useRTL();
//   const router = useRouter();
//   const insets = useSafeAreaInsets();

//   const [form, setForm] = useState<ContactForm>({
//     name: "",
//     email: "",
//     phone: "",
//     message: "",
//   });

//   const [focused, setFocused] = useState<FocusState>({
//     name: false,
//     email: false,
//     phone: false,
//     message: false,
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [statusMessage, setStatusMessage] = useState("");

//   const handleInputChange = (field: keyof ContactForm, value: string) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//     setStatusMessage(""); // Clear status on input change
//   };

//   const handleFocus = (field: keyof FocusState) => {
//     // Simplified - no complex state management
//   };

//   const handleBlur = (field: keyof FocusState) => {
//     // Simplified - no complex state management
//   };

//   const validateForm = (): boolean => {
//     if (!form.name.trim()) {
//       setStatusMessage(t("nameRequired"));
//       return false;
//     }
//     if (!form.email.trim()) {
//       setStatusMessage(t("emailRequired"));
//       return false;
//     }
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(form.email)) {
//       setStatusMessage(t("invalidEmail"));
//       return false;
//     }
//     if (!form.message.trim()) {
//       setStatusMessage(t("messageRequired"));
//       return false;
//     }
//     return true;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) return;
//     setIsSubmitting(true);
//     setStatusMessage("");
//     try {
//       // You should replace "http://localhost:5001" with the actual IP address or domain
//       // of your backend server if you are running on a physical device or different network.
//       // For emulator/simulator, localhost might work if the backend is on your dev machine.
//       await axios.post("http://localhost:5001/api/contact/send", form);
//       setStatusMessage(t("messageSentSuccess"));
//       setForm({ name: "", email: "", phone: "", message: "" });
//     } catch (error) {
//       // Log the error to console for debugging purposes
//       // console.error("Error submitting contact form:", error);
//       // Check if error has a response and data for more specific messages
//       if (axios.isAxiosError(error) && error.response) {
//         // If the server sends back a specific error message, use it
//         setStatusMessage(error.response.data.message || t("messageSendError"));
//       } else {
//         setStatusMessage(t("messageSendError"));
//       }
//     } finally {
//       // This ensures isSubmitting is set back to false in all cases
//       setIsSubmitting(false);
//     }
//   };

//   const handleCall = (phone: string) => {
//     Linking.openURL(`tel:${phone}`).catch((e) => {
//       console.error("Failed to make call:", e);
//       setStatusMessage(t("cannotMakeCall"));
//     });
//   };

//   const handleEmail = (email: string) => {
//     Linking.openURL(`mailto:${email}`).catch((e) => {
//       console.error("Failed to open email:", e);
//       setStatusMessage(t("cannotOpenEmail"));
//     });
//   };

//   const handleWhatsApp = (phone: string) => {
//     Linking.openURL(`whatsapp://send?phone=${phone}`).catch((e) => {
//       console.error("Failed to open WhatsApp:", e);
//       setStatusMessage(t("whatsappNotInstalled"));
//     });
//   };

//   const renderContactInfo = () => (
//     <View style={styles.contactInfoSection}>
//       <Text style={[styles.sectionTitle, rtlStyle]}>{t("getInTouch")}</Text>
//       <Text style={[styles.sectionDescription, rtlStyle]}>
//         {t("contactDescription")}
//       </Text>

//       <TouchableOpacity
//         style={[styles.contactItem, { flexDirection: getFlexDirection() }]}
//         onPress={() => handleEmail("syriasouq@outlook.com")}
//         activeOpacity={0.7}
//       >
//         <View style={styles.contactIcon}>
//           <Ionicons name="mail" size={20} color="#B80200" />
//         </View>
//         <View
//           style={[
//             styles.contactDetails,
//             { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 },
//           ]}
//         >
//           <Text style={[styles.contactLabel, rtlStyle]}>{t("email")}</Text>
//           <Text style={[styles.contactValue, rtlStyle]}>
//             syriasouq@outlook.com
//           </Text>
//         </View>
//         <Ionicons
//           name={isRTL ? "chevron-back" : "chevron-forward"}
//           size={20}
//           color="#666"
//         />
//       </TouchableOpacity>

//       <View style={[styles.contactItem, { flexDirection: getFlexDirection() }]}>
//         <View style={styles.contactIcon}>
//           <Ionicons name="location" size={20} color="#B80200" />
//         </View>
//         <View
//           style={[
//             styles.contactDetails,
//             { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 },
//           ]}
//         >
//           <Text style={[styles.contactLabel, rtlStyle]}>{t("address")}</Text>
//           <Text style={[styles.contactValue, rtlStyle]}>
//             {t("companyAddress")}
//           </Text>
//         </View>
//       </View>
//     </View>
//   );

//   const renderContactForm = () => (
//     <SafeAreaView style={styles.formSection}>
//       <Text style={[styles.sectionTitle, rtlStyle]}>{t("sendMessage")}</Text>
//       <Text style={[styles.sectionDescription, rtlStyle]}>
//         {t("formDescription")}
//       </Text>

//       {/* Name Input */}
//       <KeyboardAvoidingView>
//         <View style={styles.inputGroup}>
//           <Text style={[styles.inputLabel, rtlStyle]}>
//             {t("fullName")} <Text style={styles.required}>*</Text>
//           </Text>
//           <View style={styles.inputWrapper}>
//             <Ionicons
//               name="person-outline"
//               size={20}
//               color="#666"
//               style={[styles.inputIcon, isRTL && { right: 16, left: "auto" }]}
//             />
//             <TextInput
//               style={[
//                 styles.textInputSimple,
//                 rtlStyle,
//                 { paddingLeft: isRTL ? 16 : 50, paddingRight: isRTL ? 50 : 16 },
//               ]}
//               value={form.name}
//               onChangeText={(text) => handleInputChange("name", text)}
//               placeholder={t("enterFullName")}
//               placeholderTextColor="#999"
//               editable={!isSubmitting}
//             />
//           </View>
//         </View>

//         {/* Email Input */}
//         <View style={styles.inputGroup}>
//           <Text style={[styles.inputLabel, rtlStyle]}>
//             {t("email")} <Text style={styles.required}>*</Text>
//           </Text>
//           <View style={styles.inputWrapper}>
//             <Ionicons
//               name="mail-outline"
//               size={20}
//               color="#666"
//               style={[styles.inputIcon, isRTL && { right: 16, left: "auto" }]}
//             />
//             <TextInput
//               style={[
//                 styles.textInputSimple,
//                 rtlStyle,
//                 { paddingLeft: isRTL ? 16 : 50, paddingRight: isRTL ? 50 : 16 },
//               ]}
//               value={form.email}
//               onChangeText={(text) => handleInputChange("email", text)}
//               placeholder={t("enterEmail")}
//               placeholderTextColor="#999"
//               keyboardType="email-address"
//               autoCapitalize="none"
//               editable={!isSubmitting}
//             />
//           </View>
//         </View>

//         {/* Phone Input */}
//         <View style={styles.inputGroup}>
//           <Text style={[styles.inputLabel, rtlStyle]}>{t("phoneNumber")}</Text>
//           <View style={styles.inputWrapper}>
//             <Ionicons
//               name="call-outline"
//               size={20}
//               color="#666"
//               style={[styles.inputIcon, isRTL && { right: 16, left: "auto" }]}
//             />
//             <TextInput
//               style={[
//                 styles.textInputSimple,
//                 rtlStyle,
//                 { paddingLeft: isRTL ? 16 : 50, paddingRight: isRTL ? 50 : 16 },
//               ]}
//               value={form.phone}
//               onChangeText={(text) => handleInputChange("phone", text)}
//               placeholder={t("enterPhoneNumber")}
//               placeholderTextColor="#999"
//               keyboardType="phone-pad"
//               editable={!isSubmitting}
//             />
//           </View>
//         </View>

//         {/* Message Input */}
//         <View style={styles.inputGroup}>
//           <Text style={[styles.inputLabel, rtlStyle]}>
//             {t("message")} <Text style={styles.required}>*</Text>
//           </Text>
//           <View style={styles.textAreaWrapper}>
//             <TextInput
//               style={[styles.textAreaSimple, rtlStyle]}
//               value={form.message}
//               onChangeText={(text) => handleInputChange("message", text)}
//               placeholder={t("enterMessage")}
//               placeholderTextColor="#999"
//               multiline
//               numberOfLines={5}
//               textAlignVertical="top"
//               editable={!isSubmitting}
//             />
//           </View>
//         </View>

//         {statusMessage ? (
//           <Text
//             style={[
//               styles.statusMessage,
//               {
//                 color: statusMessage.includes("success") ? "green" : "#B80200",
//               },
//             ]}
//           >
//             {statusMessage}
//           </Text>
//         ) : null}
//       </KeyboardAvoidingView>
//       <TouchableOpacity
//         style={[
//           styles.submitButton,
//           { flexDirection: getFlexDirection() },
//           isSubmitting && styles.submitButtonDisabled,
//         ]}
//         onPress={handleSubmit}
//         disabled={isSubmitting}
//         activeOpacity={0.8}
//       >
//         {isSubmitting ? (
//           <ActivityIndicator size="small" color="#FFFFFF" />
//         ) : (
//           <>
//             <Ionicons name="send" size={20} color="#FFFFFF" />
//             <Text
//               style={[
//                 styles.submitButtonText,
//                 rtlStyle,
//                 { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
//               ]}
//             >
//               {t("sendMessage")}
//             </Text>
//           </>
//         )}
//       </TouchableOpacity>
//     </SafeAreaView>
//   );

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={styles.backButton}
//         >
//           <Ionicons
//             name={isRTL ? "arrow-forward" : "arrow-back"}
//             size={24}
//             color="#ffffff"
//           />
//         </TouchableOpacity>
//         <Text style={[styles.headerTitle, rtlStyle]}>{t("contactUs")}</Text>
//         <View style={styles.placeholder} />
//       </View>
//       <ScrollView
//         style={styles.scrollContainer}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {renderContactInfo()}
//         {renderContactForm()}
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#323332",
//   },
//   header: {
//     backgroundColor: "#323332",
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     alignItems: "center",
//     justifyContent: "space-between",
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#ffffff",
//     textAlign: "center",
//   },
//   placeholder: {
//     width: 40,
//   },
//   scrollContainer: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//   },
//   scrollContent: {
//     padding: 20,
//     paddingBottom: 40,
//   },
//   contactInfoSection: {
//     backgroundColor: "#ffffff",
//     borderRadius: 15,
//     padding: 20,
//     marginBottom: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   formSection: {
//     backgroundColor: "#ffffff",
//     borderRadius: 15,
//     padding: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#1a1a1a",
//     marginBottom: 8,
//   },
//   sectionDescription: {
//     fontSize: 14,
//     color: "#666",
//     lineHeight: 20,
//     marginBottom: 20,
//   },
//   contactItem: {
//     alignItems: "center",
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   contactIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#f8f9fa",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   contactDetails: {
//     flex: 1,
//   },
//   contactLabel: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#1a1a1a",
//     marginBottom: 2,
//   },
//   contactValue: {
//     fontSize: 14,
//     color: "#666",
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   inputLabel: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#1a1a1a",
//     marginBottom: 8,
//   },
//   required: {
//     color: "#B80200",
//   },
//   statusMessage: {
//     fontSize: 14,
//     textAlign: "center",
//     marginBottom: 10,
//   },
//   submitButton: {
//     backgroundColor: "#B80200",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 16,
//     borderRadius: 12,
//     shadowColor: "#B80200",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//     gap: 8,
//     marginTop: 10,
//   },
//   submitButtonDisabled: {
//     backgroundColor: "#ccc",
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   submitButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   inputWrapper: {
//     position: "relative",
//     backgroundColor: "#f8f9fa",
//     borderRadius: 12,
//     borderWidth: 1.5,
//     borderColor: "#e9ecef",
//     height: 50,
//   },
//   textInputSimple: {
//     height: 50,
//     fontSize: Math.max(15, 1),
//     color: "#1a1a1a",
//     fontWeight: "500",
//     backgroundColor: "transparent",
//   },
//   textAreaWrapper: {
//     backgroundColor: "#f8f9fa",
//     borderRadius: 12,
//     borderWidth: 1.5,
//     borderColor: "#e9ecef",
//     minHeight: 120,
//     padding: 16,
//   },
//   textAreaSimple: {
//     fontSize: Math.max(15, 1),
//     color: "#1a1a1a",
//     fontWeight: "500",
//     textAlignVertical: "top",
//     minHeight: 80,
//     backgroundColor: "transparent",
//   },
//   inputIcon: {
//     position: "absolute",
//     left: 16,
//     top: 15,
//     zIndex: 1,
//   },
// });
