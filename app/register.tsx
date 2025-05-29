import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, StyleSheet, TextInput, View } from "react-native";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import { AuthContext } from "../contexts/AuthContext";

export default function Register() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("SY");
  const { register } = useContext(AuthContext);
  const router = useRouter();
  const { t } = useTranslation();

  const handleRegister = async () => {
    console.log(
      "Register: Attempting registration with phone:",
      `+${countryCode}${phone}`
    );
    try {
      await register(username, `+${countryCode}${phone}`, password);
      console.log("Register: Registration successful");
      Alert.alert(t("success"), t("registered"));
      router.back();
    } catch (error) {
      console.error("Register: Error registering:", error);
      Alert.alert(t("error"), t("failedToRegister"));
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={t("username")}
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <CountryPicker
        countryCode={countryCode}
        withFilter
        withFlag
        withCountryNameButton
        withCallingCode
        onSelect={(country: Country) => {
          console.log("Register: Selected country code:", country.cca2);
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
      <Button title={t("register")} onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  input: { borderWidth: 1, padding: 10, marginVertical: 5, borderRadius: 5 },
});
