// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import { Alert, Button, StyleSheet, TextInput, View } from "react-native";
// import CountryPicker, {
//   Country,
//   CountryCode,
// } from "react-native-country-picker-modal";
// import { api } from "../utils/api";

// export default function ForgotPassword() {
//   const [phone, setPhone] = useState("");
//   const [countryCode, setCountryCode] = useState<CountryCode>("SY");
//   const { t } = useTranslation();

//   const handleForgotPassword = async () => {
//     console.log(
//       "ForgotPassword: Requesting OTP for phone:",
//       `+${countryCode}${phone}`
//     );
//     try {
//       await api.post("/auth/forgot-password", {
//         phone: `+${countryCode}${phone}`,
//       }); // Your /api/auth/forgot-password
//       console.log("ForgotPassword: OTP request successful");
//       Alert.alert(t("success"), t("otpSent"));
//     } catch (error) {
//       console.error("ForgotPassword: Error requesting OTP:", error);
//       Alert.alert(t("error"), t("failedToRequestOTP"));
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <CountryPicker
//         countryCode={countryCode}
//         withFilter
//         withFlag
//         withCountryNameButton
//         withCallingCode
//         onSelect={(country: Country) => {
//           console.log("ForgotPassword: Selected country code:", country.cca2);
//           setCountryCode(country.cca2 as CountryCode);
//         }}
//       />
//       <TextInput
//         placeholder={t("phoneNumber")}
//         value={phone}
//         onChangeText={setPhone}
//         keyboardType="phone-pad"
//         style={styles.input}
//       />
//       <Button title={t("requestOTP")} onPress={handleForgotPassword} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, justifyContent: "center" },
//   input: { borderWidth: 1, padding: 10, marginVertical: 5, borderRadius: 5 },
// });
