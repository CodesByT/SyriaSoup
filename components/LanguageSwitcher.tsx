import React from "react";
import { Button, StyleSheet, View } from "react-native";
import i18n from "../i18n";

export default function LanguageSwitcher() {
  return (
    <View style={styles.container}>
      <Button title="English" onPress={() => i18n.changeLanguage("en")} />
      <Button title="العربية" onPress={() => i18n.changeLanguage("ar")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
});
