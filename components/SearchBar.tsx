import { arabicMakes, makes } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SearchBarProps } from "./utils/SearchBarProps";
// Assuming 'makes' and 'arabicMakes' are in a separate file like 'data.ts' or 'options.ts'
// For this example, I'll include them here directly.

type ModalScreen = "make" | "model" | "location" | null;

export default function SearchBar({
  value,
  onChange,
  placeholder,
}: SearchBarProps) {
  const { t, i18n } = useTranslation();
  const [isFocused, setIsFocused] = useState(false); // For the main search bar touchable
  const [modalVisible, setModalVisible] = useState(false);
  const [currentModalScreen, setCurrentModalScreen] =
    useState<ModalScreen>(null);
  const [selectedMakeData, setSelectedMakeData] = useState<any | null>(null);

  // Determine which make/model data to use based on current language
  const currentMakesData = i18n.language === "ar" ? arabicMakes : makes;

  useEffect(() => {
    if (value.make) {
      const foundMake = currentMakesData.find(
        (m) => m.value === value.make || m.label === value.make // Check both value and label
      );
      setSelectedMakeData(foundMake || null);
    } else {
      setSelectedMakeData(null);
    }
  }, [value.make, i18n.language]); // Re-run if language changes

  const getDisplayText = () => {
    const parts = [];
    if (value.make) parts.push(value.make);
    if (value.model) parts.push(value.model);
    if (value.location) parts.push(value.location);

    if (parts.length > 0) {
      return parts.join(" ").trim();
    }
    return placeholder || t("search.placeholder");
  };

  const handleSelectMake = (make: string) => {
    onChange({ ...value, make: make, model: "" }); // Reset model when make changes
    const foundMake = currentMakesData.find(
      (m) => m.value === make || m.label === make
    );
    setSelectedMakeData(foundMake);
    setCurrentModalScreen("model"); // Go to model selection
  };

  const handleSelectModel = (model: string) => {
    onChange({ ...value, model: model });
    setModalVisible(false);
    setIsFocused(false); // Remove focus from main search bar
    setCurrentModalScreen(null); // Reset modal screen
  };

  const handleApplyLocation = () => {
    setModalVisible(false);
    setIsFocused(false);
    setCurrentModalScreen(null);
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsFocused(false);
    setCurrentModalScreen(null);
  };

  const renderModalContent = () => {
    switch (currentModalScreen) {
      case "make":
        return (
          <>
            <Text style={modalStyles.modalTitle}>{t("select_make")}</Text>
            <ScrollView style={modalStyles.optionsScrollView}>
              {currentMakesData.map((makeOption) => (
                <TouchableOpacity
                  key={makeOption.value}
                  style={[
                    modalStyles.optionButton,
                    value.make === makeOption.value &&
                      modalStyles.optionButtonSelected,
                  ]}
                  onPress={() => handleSelectMake(makeOption.value)}
                >
                  <Text
                    style={[
                      modalStyles.optionText,
                      value.make === makeOption.value &&
                        modalStyles.optionTextSelected,
                    ]}
                  >
                    {makeOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={closeModal}
            >
              <Text style={modalStyles.closeButtonText}>{t("close")}</Text>
            </TouchableOpacity>
          </>
        );
      case "model":
        const models = selectedMakeData?.models || [];
        return (
          <>
            <Text style={modalStyles.modalTitle}>
              {t("select_model_for", {
                make: selectedMakeData?.label || value.make,
              })}
            </Text>
            <ScrollView style={modalStyles.optionsScrollView}>
              {models.length > 0 ? (
                models.map((modelOption: string) => (
                  <TouchableOpacity
                    key={modelOption}
                    style={[
                      modalStyles.optionButton,
                      value.model === modelOption &&
                        modalStyles.optionButtonSelected,
                    ]}
                    onPress={() => handleSelectModel(modelOption)}
                  >
                    <Text
                      style={[
                        modalStyles.optionText,
                        value.model === modelOption &&
                          modalStyles.optionTextSelected,
                      ]}
                    >
                      {modelOption}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={modalStyles.noOptionsText}>
                  {t("no_models_available")}
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={modalStyles.backButton}
              onPress={() => setCurrentModalScreen("make")}
            >
              <Text style={modalStyles.closeButtonText}>{t("back")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={closeModal}
            >
              <Text style={modalStyles.closeButtonText}>{t("close")}</Text>
            </TouchableOpacity>
          </>
        );
      case "location":
        return (
          <>
            <Text style={modalStyles.modalTitle}>{t("enter_location")}</Text>
            <TextInput
              style={modalStyles.modalTextInput} // Apply text input specific style
              value={value.location}
              onChangeText={(text) => onChange({ ...value, location: text })}
              placeholder={t("location")}
              placeholderTextColor="#999999"
            />
            <TouchableOpacity
              style={modalStyles.applyButton}
              onPress={handleApplyLocation}
            >
              <Text style={modalStyles.closeButtonText}>{t("apply")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={closeModal}
            >
              <Text style={modalStyles.closeButtonText}>{t("close")}</Text>
            </TouchableOpacity>
          </>
        );
      default:
        // Main modal screen with three options (Make, Model, Location)
        return (
          <>
            <Text style={modalStyles.modalTitle}>{t("search_by")}</Text>
            <TouchableOpacity
              style={modalStyles.mainOptionButton}
              onPress={() => setCurrentModalScreen("make")}
            >
              <Text style={modalStyles.mainOptionText}>{t("make")}</Text>
              {value.make ? (
                <Text style={modalStyles.currentSelectionText}>
                  {value.make}
                </Text>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.mainOptionButton}
              onPress={() => setCurrentModalScreen("model")}
              disabled={!value.make} // Disable model selection if no make is chosen
            >
              <Text style={modalStyles.mainOptionText}>{t("model")}</Text>
              {value.model ? (
                <Text style={modalStyles.currentSelectionText}>
                  {value.model}
                </Text>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.mainOptionButton}
              onPress={() => setCurrentModalScreen("location")}
            >
              <Text style={modalStyles.mainOptionText}>{t("location")}</Text>
              {value.location ? (
                <Text style={modalStyles.currentSelectionText}>
                  {value.location}
                </Text>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={closeModal}
            >
              <Text style={modalStyles.closeButtonText}>{t("close")}</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, isFocused && styles.containerFocused]}
        onPress={() => {
          setModalVisible(true);
          setIsFocused(true); // Keep main search bar focused while modal is open
          setCurrentModalScreen(null); // Go to the main selection screen first
        }}
      >
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? "#b80200" : "#313332"}
          style={styles.icon}
        />
        <Text
          style={[
            styles.input,
            value.make || value.model || value.location
              ? null
              : styles.placeholderText,
          ]}
        >
          {getDisplayText()}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="fade" // Fades in and out
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={modalStyles.modalOverlay}>
            <TouchableWithoutFeedback>
              {/* Modal Content */}
              <View style={modalStyles.modalContent}>
                {renderModalContent()}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#313332",
    zIndex: 1,
  },
  containerFocused: {
    borderColor: "#b80200",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 36,
    color: "#313332",
    fontSize: 16,
    fontWeight: "500",
    paddingTop: 0,
    paddingBottom: 0,
  },
  placeholderText: {
    color: "#a0a0a0", // A lighter grey for the placeholder text itself
  },
});

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Darker, more transparent overlay
    justifyContent: "center", // Center the modal vertically
    alignItems: "center", // Center the modal horizontally
  },
  modalContent: {
    backgroundColor: "#1a1a1a", // Dark background matching app theme
    borderRadius: 15, // Slightly more rounded for elegance
    padding: 25,
    width: "85%", // Adjusted width to be more central
    maxHeight: "70%", // Limit height for scrollable content
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff", // White text
    marginBottom: 20,
    textAlign: "center",
  },
  optionsScrollView: {
    width: "100%",
    maxHeight: 300, // Limit height of scroll view for better UX
    marginBottom: 15,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 5,
    backgroundColor: "#2a2a2a", // Darker option background
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  optionButtonSelected: {
    backgroundColor: "#b80200", // Red for selected option
    borderColor: "#b80200",
  },
  optionText: {
    color: "#ffffff", // White text for options
    fontSize: 16,
    fontWeight: "500",
  },
  optionTextSelected: {
    fontWeight: "700",
  },
  modalTextInput: {
    width: "100%",
    height: 50,
    backgroundColor: "#2a2a2a", // Lighter dark for input background
    borderColor: "#b80200", // Border color for active input
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    color: "#ffffff", // White text input
    fontSize: 17,
  },
  closeButton: {
    backgroundColor: "#b80200", // Your primary red
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    width: "100%", // Full width button
    alignItems: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  backButton: {
    backgroundColor: "#313332", // A darker grey for back button
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  applyButton: {
    backgroundColor: "#b80200", // Your primary red
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  mainOptionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  mainOptionText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  currentSelectionText: {
    color: "#b80200", // Red color for selected value
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  noOptionsText: {
    color: "#999999",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
});
// import { Ionicons } from "@expo/vector-icons";
// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import { StyleSheet, TextInput, View } from "react-native";

// interface SearchBarProps {
//   value: string;
//   onChange: (text: string) => void;
//   placeholder?: string;
// }

// export default function SearchBar({
//   value,
//   onChange,
//   placeholder,
// }: SearchBarProps) {
//   const { t } = useTranslation();
//   const [isFocused, setIsFocused] = useState(false);
//   console.log("SearchBar: Rendering with value:", value);

//   return (
//     <View style={[styles.container, isFocused && styles.containerFocused]}>
//       <Ionicons
//         name="search"
//         size={20}
//         color={isFocused ? "#b80200" : "#313332"}
//         style={styles.icon}
//       />
//       <TextInput
//         style={styles.input}
//         value={value}
//         onChangeText={onChange}
//         placeholder={placeholder || t("search.placeholder")}
//         placeholderTextColor={isFocused ? "#b80200" : "#313332"}
//         onFocus={() => setIsFocused(true)}
//         onBlur={() => setIsFocused(false)}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#ffffff",
//     borderRadius: 12,
//     marginHorizontal: 16,
//     marginVertical: 8, // Reduced vertical margin
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: "#313332",
//     zIndex: 1, // Ensure no overlap with header
//   },
//   containerFocused: {
//     borderColor: "#b80200",
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//   },
//   icon: {
//     marginRight: 10,
//   },
//   input: {
//     flex: 1,
//     height: 36,
//     color: "#313332",
//     fontSize: 16,
//     fontWeight: "500",
//     paddingTop: 0, // Adjust this value
//     paddingBottom: 0, // Adjust this value as well
//   },
// });
