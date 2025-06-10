import AsyncStorage from "@react-native-async-storage/async-storage";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface LanguageSwitcherProps {
  onLanguageChange?: (language: string) => void;
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  onLanguageChange,
  compact = false,
}) => {
  const { i18n } = useTranslation();

  const changeLanguage = async (language: string) => {
    try {
      const currentLanguage = i18n.language;
      if (currentLanguage === language) return;

      await i18n.changeLanguage(language);
      await AsyncStorage.setItem("user-language", language);
      onLanguageChange?.(language);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  if (compact) {
    // Compact version for header - optimized for mobile
    return (
      <TouchableOpacity
        style={styles.compactButton}
        onPress={() => changeLanguage(i18n.language === "ar" ? "en" : "ar")}
        activeOpacity={0.8}
      >
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
      </TouchableOpacity>
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
    fontSize: 14,
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
  // Compact version styles - optimized for mobile header
  compactButton: {
    width: 36,
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
});

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import type React from "react";
// import { useTranslation } from "react-i18next";
// import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// interface LanguageSwitcherProps {
//   onLanguageChange?: (language: string) => void;
// }

// export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
//   onLanguageChange,
// }) => {
//   const { i18n, t } = useTranslation();

//   const changeLanguage = async (language: string) => {
//     try {
//       const currentLanguage = i18n.language;
//       if (currentLanguage === language) return;

//       await i18n.changeLanguage(language);
//       await AsyncStorage.setItem("user-language", language);

//       // Show success message
//       Alert.alert(
//         language === "ar" ? "تم تغيير اللغة" : "Language Changed",
//         language === "ar"
//           ? "تم تغيير اللغة بنجاح"
//           : "Language changed successfully",
//         [
//           {
//             text: language === "ar" ? "موافق" : "OK",
//             onPress: () => onLanguageChange?.(language),
//           },
//         ]
//       );
//     } catch (error) {
//       console.error("Error changing language:", error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={[styles.title, i18n.language === "ar" && styles.arabicText]}>
//         {t("language")}
//       </Text>
//       <View style={styles.buttonContainer}>
//         <TouchableOpacity
//           style={[
//             styles.languageButton,
//             i18n.language === "ar" && styles.activeButton,
//           ]}
//           onPress={() => changeLanguage("ar")}
//         >
//           <Text
//             style={[
//               styles.buttonText,
//               i18n.language === "ar" && styles.activeButtonText,
//               styles.arabicText,
//             ]}
//           >
//             العربية
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[
//             styles.languageButton,
//             i18n.language === "en" && styles.activeButton,
//           ]}
//           onPress={() => changeLanguage("en")}
//         >
//           <Text
//             style={[
//               styles.buttonText,
//               i18n.language === "en" && styles.activeButtonText,
//             ]}
//           >
//             English
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 16,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 12,
//     color: "#333",
//     textAlign: "left",
//   },
//   arabicText: {
//     textAlign: "right",
//     writingDirection: "rtl",
//   },
//   buttonContainer: {
//     flexDirection: "row",
//     gap: 12,
//   },
//   languageButton: {
//     flex: 1,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     backgroundColor: "#f8f9fa",
//     alignItems: "center",
//   },
//   activeButton: {
//     backgroundColor: "#b80200",
//     borderColor: "#b80200",
//   },
//   buttonText: {
//     fontSize: 14,
//     color: "#333",
//     fontWeight: "500",
//   },
//   activeButtonText: {
//     color: "#fff",
//   },
// });
