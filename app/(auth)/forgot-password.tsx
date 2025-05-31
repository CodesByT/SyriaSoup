import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP & Password
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { forgotPassword, resetPassword } = useAuth();

  const handleRequestOTP = async () => {
    setLoading(true);
    try {
      await forgotPassword(phone);
      Alert.alert(t("success"), t("otpSent"));
      setStep(2);
    } catch (error: any) {
      Alert.alert(t("error"), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      await resetPassword(phone, otp, newPassword);
      Alert.alert(t("success"), t("passwordResetSuccess"));
      router.replace("/login");
    } catch (error: any) {
      Alert.alert(t("error"), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("forgotPassword")}</Text>
      <TextInput
        style={styles.input}
        placeholder={t("phoneNumber")}
        placeholderTextColor="#313332"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={step === 1}
      />
      {step === 2 && (
        <>
          <TextInput
            style={styles.input}
            placeholder={t("otp")}
            placeholderTextColor="#313332"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder={t("newPassword")}
            placeholderTextColor="#313332"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
        </>
      )}
      <TouchableOpacity
        style={styles.button}
        onPress={step === 1 ? handleRequestOTP : handleResetPassword}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? t("loading")
            : step === 1
            ? t("requestOTP")
            : t("resetPassword")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.link}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.linkText}>{t("backToLogin")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#313332",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#313332",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#b80200",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    alignItems: "center",
  },
  linkText: {
    color: "#b80200",
    fontSize: 14,
    fontWeight: "500",
  },
});
