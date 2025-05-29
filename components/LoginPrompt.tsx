import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button, StyleSheet, Text, View } from "react-native";

export default function LoginPrompt() {
  const router = useRouter();
  const { t } = useTranslation();

  console.log("LoginPrompt: Rendering");

  return (
    <View style={styles.container}>
      <Text>{t("loginPrompt")}</Text>
      <Button
        title={t("login")}
        onPress={() => {
          console.log("LoginPrompt: Navigating to /login");
          router.push("/login");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
