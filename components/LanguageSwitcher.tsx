"use client";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface LanguageSwitcherProps {
  onLanguageChange?: (language: string) => void;
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  onLanguageChange,
  compact = false,
}) => {
  const { i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const changeLanguage = async (language: string) => {
    try {
      const currentLanguage = i18n.language;
      if (currentLanguage === language) {
        setShowDropdown(false);
        return;
      }

      await i18n.changeLanguage(language);
      await AsyncStorage.setItem("user-language", language);
      onLanguageChange?.(language);
      setShowDropdown(false);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  useEffect(() => {
    if (showDropdown) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showDropdown]);

  if (compact) {
    // Compact version for header with dropdown
    const currentLanguageCode = i18n.language === "en" ? "ENG" : "ARA";
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.8}
        >
          <View style={styles.compactButtonContent}>
            <Text style={styles.compactLanguageCode}>
              {currentLanguageCode}
            </Text>
            <View style={styles.flagContainer}>
              <Image
                source={
                  i18n.language === "ar"
                    ? require("../assets/flags/syria-flag.png")
                    : require("../assets/flags/uk-flag.png")
                }
                style={styles.flagImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Dropdown Modal */}
        <Modal
          transparent={true}
          visible={showDropdown}
          animationType="none"
          onRequestClose={() => setShowDropdown(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.dropdown,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }],
                    },
                  ]}
                >
                  {/* English Option */}
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => changeLanguage("en")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownItemContent}>
                      <View style={styles.flagContainer}>
                        <Image
                          source={require("../assets/flags/uk-flag.png")}
                          style={styles.flagImage}
                          resizeMode="cover"
                        />
                      </View>
                      <Text style={styles.dropdownText}>English</Text>
                      {i18n.language === "en" && (
                        <Ionicons name="checkmark" size={18} color="#B80200" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Separator */}
                  <View style={styles.separator} />

                  {/* Arabic Option */}
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => changeLanguage("ar")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownItemContent}>
                      <View style={styles.flagContainer}>
                        <Image
                          source={require("../assets/flags/syria-flag.png")}
                          style={styles.flagImage}
                          resizeMode="cover"
                        />
                      </View>
                      <Text style={[styles.dropdownText, styles.arabicText]}>
                        العربية
                      </Text>
                      {i18n.language === "ar" && (
                        <Ionicons name="checkmark" size={18} color="#B80200" />
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  }

  // Full version for settings/profile
  return (
    <View style={styles.container}>
      <Text style={[styles.title, i18n.language === "ar" && styles.arabicText]}>
        Language / اللغة
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            i18n.language === "ar" && styles.activeButton,
          ]}
          onPress={() => changeLanguage("ar")}
          activeOpacity={0.8}
        >
          <View style={styles.fullFlagContainer}>
            <Image
              source={require("../assets/flags/syria-flag.png")}
              style={styles.fullFlagImage}
              resizeMode="cover"
            />
          </View>
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
          activeOpacity={0.8}
        >
          <View style={styles.fullFlagContainer}>
            <Image
              source={require("../assets/flags/uk-flag.png")}
              style={styles.fullFlagImage}
              resizeMode="cover"
            />
          </View>
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
    fontSize: Math.max(16, 1),
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
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeButton: {
    backgroundColor: "#b80200",
    borderColor: "#b80200",
    shadowColor: "#b80200",
    shadowOpacity: 0.3,
  },
  buttonText: {
    fontSize: Math.max(14, 1),
    color: "#333",
    fontWeight: "600",
  },
  activeButtonText: {
    color: "#fff",
  },
  fullFlagContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  fullFlagImage: {
    width: "100%",
    height: "100%",
  },
  // Compact version styles
  compactContainer: {
    position: "relative",
  },
  compactButton: {
    // Adjusted width to accommodate text
    width: 70, // Increased width to fit 'ENG'/'ARA' + flag
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  compactButtonContent: {
    flexDirection: "row", // Arrange text and flag horizontally
    alignItems: "center",
    gap: 4, // Small gap between text and flag
  },
  compactLanguageCode: {
    fontSize: Math.max(12, 1),
    fontWeight: "bold",
    color: "#333",
  },
  flagContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 0,
    borderColor: "rgba(0,0,0,0.1)",
  },
  flagImage: {
    width: "100%",
    height: "100%",
  },
  // Dropdown styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
  },
  dropdown: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dropdownText: {
    fontSize: Math.max(12, 1),
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 16,
  },
});
