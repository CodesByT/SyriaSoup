import AsyncStorage from "@react-native-async-storage/async-storage";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface LanguageSwitcherProps {
  onLanguageChange?: (language: string) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  onLanguageChange,
}) => {
  const { i18n, t } = useTranslation();

  const changeLanguage = async (language: string) => {
    try {
      const currentLanguage = i18n.language;
      if (currentLanguage === language) return;

      await i18n.changeLanguage(language);
      await AsyncStorage.setItem("user-language", language);

      // Show success message
      Alert.alert(
        language === "ar" ? "تم تغيير اللغة" : "Language Changed",
        language === "ar"
          ? "تم تغيير اللغة بنجاح"
          : "Language changed successfully",
        [
          {
            text: language === "ar" ? "موافق" : "OK",
            onPress: () => onLanguageChange?.(language),
          },
        ]
      );
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, i18n.language === "ar" && styles.arabicText]}>
        {t("language")}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            i18n.language === "ar" && styles.activeButton,
          ]}
          onPress={() => changeLanguage("ar")}
        >
          <Text
            style={[
              styles.buttonText,
              i18n.language === "ar" && styles.activeButtonText,
              styles.arabicText,
            ]}
          >
            العربية
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.languageButton,
            i18n.language === "en" && styles.activeButton,
          ]}
          onPress={() => changeLanguage("en")}
        >
          <Text
            style={[
              styles.buttonText,
              i18n.language === "en" && styles.activeButtonText,
            ]}
          >
            English
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
    textAlign: "left",
  },
  arabicText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#b80200",
    borderColor: "#b80200",
  },
  buttonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  activeButtonText: {
    color: "#fff",
  },
});
