import { Link, Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  const { t } = useTranslation();

  console.log("NotFoundScreen: Rendering");

  return (
    <>
      <Stack.Screen options={{ title: t("notFoundTitle") }} />
      <View style={styles.container}>
        <Text style={styles.title}>{t("notFound")}</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t("goToHome")}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    color: "#007bff",
  },
});
