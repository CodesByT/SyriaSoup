"use client"

import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Snackbar from "react-native-snackbar"
import { useRTL } from "../hooks/useRTL"

const { width } = Dimensions.get("window")

interface ContactForm {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

interface FocusState {
  name: boolean
  email: boolean
  phone: boolean
  subject: boolean
  message: boolean
}

export default function ContactUs() {
  const { t } = useTranslation()
  const { isRTL, rtlStyle, getFlexDirection } = useRTL()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const [focused, setFocused] = useState<FocusState>({
    name: false,
    email: false,
    phone: false,
    subject: false,
    message: false,
  })

  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleFocus = (field: keyof FocusState) => {
    setFocused((prev) => ({ ...prev, [field]: true }))
  }

  const handleBlur = (field: keyof FocusState) => {
    setFocused((prev) => ({ ...prev, [field]: false }))
  }

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      Snackbar.show({
        text: t("nameRequired"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      })
      return false
    }

    if (!form.email.trim()) {
      Snackbar.show({
        text: t("emailRequired"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      })
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      Snackbar.show({
        text: t("invalidEmail"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      })
      return false
    }

    if (!form.subject.trim()) {
      Snackbar.show({
        text: t("subjectRequired"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      })
      return false
    }

    if (!form.message.trim()) {
      Snackbar.show({
        text: t("messageRequired"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise((resolve) => setTimeout(resolve, 2000))

      Snackbar.show({
        text: t("messageSentSuccess"),
        duration: 3000,
        backgroundColor: "green",
        textColor: "#FFFFFF",
      })

      // Reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      })
    } catch (error) {
      Snackbar.show({
        text: t("messageSendError"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Snackbar.show({
        text: t("cannotMakeCall"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      })
    })
  }

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Snackbar.show({
        text: t("cannotOpenEmail"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      })
    })
  }

  const handleWhatsApp = (phone: string) => {
    Linking.openURL(`whatsapp://send?phone=${phone}`).catch(() => {
      Snackbar.show({
        text: t("whatsappNotInstalled"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      })
    })
  }

  const renderContactInfo = () => (
    <View style={styles.contactInfoSection}>
      <Text style={[styles.sectionTitle, rtlStyle]}>{t("getInTouch")}</Text>
      <Text style={[styles.sectionDescription, rtlStyle]}>{t("contactDescription")}</Text>

      {/* Phone */}
      <TouchableOpacity
        style={[styles.contactItem, { flexDirection: getFlexDirection() }]}
        onPress={() => handleCall("+963968888721")}
        activeOpacity={0.7}
      >
        <View style={styles.contactIcon}>
          <Ionicons name="call" size={20} color="#B80200" />
        </View>
        <View style={[styles.contactDetails, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
          <Text style={[styles.contactLabel, rtlStyle]}>{t("phone")}</Text>
          <Text style={[styles.contactValue, rtlStyle]}>+963 96 888 8721</Text>
        </View>
        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color="#666" />
      </TouchableOpacity>

      {/* Email */}
      <TouchableOpacity
        style={[styles.contactItem, { flexDirection: getFlexDirection() }]}
        onPress={() => handleEmail("info@syriasouq.com")}
        activeOpacity={0.7}
      >
        <View style={styles.contactIcon}>
          <Ionicons name="mail" size={20} color="#B80200" />
        </View>
        <View style={[styles.contactDetails, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
          <Text style={[styles.contactLabel, rtlStyle]}>{t("email")}</Text>
          <Text style={[styles.contactValue, rtlStyle]}>info@syriasouq.com</Text>
        </View>
        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color="#666" />
      </TouchableOpacity>

      {/* WhatsApp */}
      <TouchableOpacity
        style={[styles.contactItem, { flexDirection: getFlexDirection() }]}
        onPress={() => handleWhatsApp("+963968888721")}
        activeOpacity={0.7}
      >
        <View style={styles.contactIcon}>
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
        </View>
        <View style={[styles.contactDetails, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
          <Text style={[styles.contactLabel, rtlStyle]}>{t("whatsapp")}</Text>
          <Text style={[styles.contactValue, rtlStyle]}>+963 96 888 8721</Text>
        </View>
        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color="#666" />
      </TouchableOpacity>

      {/* Address */}
      <View style={[styles.contactItem, { flexDirection: getFlexDirection() }]}>
        <View style={styles.contactIcon}>
          <Ionicons name="location" size={20} color="#B80200" />
        </View>
        <View style={[styles.contactDetails, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
          <Text style={[styles.contactLabel, rtlStyle]}>{t("address")}</Text>
          <Text style={[styles.contactValue, rtlStyle]}>{t("companyAddress")}</Text>
        </View>
      </View>
    </View>
  )

  const renderContactForm = () => (
    <View style={styles.formSection}>
      <Text style={[styles.sectionTitle, rtlStyle]}>{t("sendMessage")}</Text>
      <Text style={[styles.sectionDescription, rtlStyle]}>{t("formDescription")}</Text>

      {/* Name Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, rtlStyle]}>
          {t("fullName")} <Text style={styles.required}>*</Text>
        </Text>
        <View
          style={[styles.inputContainer, { flexDirection: getFlexDirection() }, focused.name && styles.inputFocused]}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={focused.name ? "#B80200" : "#666"}
            style={[styles.inputIcon, isRTL && { marginRight: 0, marginLeft: 12 }]}
          />
          <TextInput
            style={[styles.textInput, rtlStyle]}
            value={form.name}
            onChangeText={(text) => handleInputChange("name", text)}
            placeholder={t("enterFullName")}
            placeholderTextColor="#999"
            onFocus={() => handleFocus("name")}
            onBlur={() => handleBlur("name")}
          />
        </View>
      </View>

      {/* Email Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, rtlStyle]}>
          {t("email")} <Text style={styles.required}>*</Text>
        </Text>
        <View
          style={[styles.inputContainer, { flexDirection: getFlexDirection() }, focused.email && styles.inputFocused]}
        >
          <Ionicons
            name="mail-outline"
            size={20}
            color={focused.email ? "#B80200" : "#666"}
            style={[styles.inputIcon, isRTL && { marginRight: 0, marginLeft: 12 }]}
          />
          <TextInput
            style={[styles.textInput, rtlStyle]}
            value={form.email}
            onChangeText={(text) => handleInputChange("email", text)}
            placeholder={t("enterEmail")}
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => handleFocus("email")}
            onBlur={() => handleBlur("email")}
          />
        </View>
      </View>

      {/* Phone Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, rtlStyle]}>{t("phoneNumber")}</Text>
        <View
          style={[styles.inputContainer, { flexDirection: getFlexDirection() }, focused.phone && styles.inputFocused]}
        >
          <Ionicons
            name="call-outline"
            size={20}
            color={focused.phone ? "#B80200" : "#666"}
            style={[styles.inputIcon, isRTL && { marginRight: 0, marginLeft: 12 }]}
          />
          <TextInput
            style={[styles.textInput, rtlStyle]}
            value={form.phone}
            onChangeText={(text) => handleInputChange("phone", text)}
            placeholder={t("enterPhoneNumber")}
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            onFocus={() => handleFocus("phone")}
            onBlur={() => handleBlur("phone")}
          />
        </View>
      </View>

      {/* Subject Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, rtlStyle]}>
          {t("subject")} <Text style={styles.required}>*</Text>
        </Text>
        <View
          style={[styles.inputContainer, { flexDirection: getFlexDirection() }, focused.subject && styles.inputFocused]}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={focused.subject ? "#B80200" : "#666"}
            style={[styles.inputIcon, isRTL && { marginRight: 0, marginLeft: 12 }]}
          />
          <TextInput
            style={[styles.textInput, rtlStyle]}
            value={form.subject}
            onChangeText={(text) => handleInputChange("subject", text)}
            placeholder={t("enterSubject")}
            placeholderTextColor="#999"
            onFocus={() => handleFocus("subject")}
            onBlur={() => handleBlur("subject")}
          />
        </View>
      </View>

      {/* Message Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, rtlStyle]}>
          {t("message")} <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.textAreaContainer, focused.message && styles.inputFocused]}>
          <TextInput
            style={[styles.textArea, rtlStyle]}
            value={form.message}
            onChangeText={(text) => handleInputChange("message", text)}
            placeholder={t("enterMessage")}
            placeholderTextColor="#999"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            onFocus={() => handleFocus("message")}
            onBlur={() => handleBlur("message")}
          />
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, { flexDirection: getFlexDirection() }, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#FFFFFF" />
            <Text
              style={[
                styles.submitButtonText,
                rtlStyle,
                {
                  marginLeft: isRTL ? 0 : 8,
                  marginRight: isRTL ? 8 : 0,
                },
              ]}
            >
              {t("sendMessage")}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtlStyle]}>{t("contactUs")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContactInfo()}
        {renderContactForm()}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    backgroundColor: "#1a1a1a",
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
    padding: 20,
    paddingBottom: 40,
  },
  contactInfoSection: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
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
  inputContainer: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
  },
  inputFocused: {
    borderColor: "#B80200",
    backgroundColor: "#ffffff",
    shadowColor: "#B80200",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  textAreaContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    minHeight: 120,
  },
  textArea: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
    textAlignVertical: "top",
    minHeight: 80,
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
})
