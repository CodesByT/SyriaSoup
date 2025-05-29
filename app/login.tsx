import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, StyleSheet, TextInput, View } from "react-native";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import { AuthContext } from "../contexts/AuthContext";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("SY");
  const { login } = useContext(AuthContext);
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogin = async () => {
    console.log(
      "Login: Attempting login with phone:",
      `+${countryCode}${phone}`
    );
    try {
      await login(`+${countryCode}${phone}`, password);
      console.log("Login: Login successful");
      Alert.alert(t("success"), t("loggedIn"));
      router.back();
    } catch (error) {
      console.error("Login: Error logging in:", error);
      Alert.alert(t("error"), t("failedToLogin"));
    }
  };

  const navigateToForgotPassword = () => {
    console.log("Login: Navigating to forgot-password");
    router.push("/forgot-password");
  };

  const navigateToRegister = () => {
    console.log("Login: Navigating to register");
    router.push("/register");
  };

  return (
    <View style={styles.container}>
      <CountryPicker
        countryCode={countryCode}
        withFilter
        withFlag
        withCountryNameButton
        withCallingCode
        onSelect={(country: Country) => {
          console.log("Login: Selected country code:", country.cca2);
          setCountryCode(country.cca2 as CountryCode);
        }}
      />
      <TextInput
        placeholder={t("phoneNumber")}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        placeholder={t("password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title={t("login")} onPress={handleLogin} />
      <Button title={t("forgotPassword")} onPress={navigateToForgotPassword} />
      <Button title={t("register")} onPress={navigateToRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  input: { borderWidth: 1, padding: 10, marginVertical: 5, borderRadius: 5 },
});
