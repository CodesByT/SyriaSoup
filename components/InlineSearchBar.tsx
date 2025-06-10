import { arabicMakes, locations, makes } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRTL } from "../hooks/useRTL";

interface SearchValue {
  make: string;
  model: string;
  location: string;
}

interface InlineSearchBarProps {
  value: SearchValue;
  onChange: (value: SearchValue) => void;
  placeholder?: string;
}

export default function InlineSearchBar({
  value,
  onChange,
  placeholder,
}: InlineSearchBarProps) {
  const { t, i18n } = useTranslation();
  const { rtlViewStyle, rtlStyle } = useRTL();
  const [activeDropdown, setActiveDropdown] = useState<
    "make" | "model" | "location" | null
  >(null);
  const [selectedMakeData, setSelectedMakeData] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentMakesData = i18n.language === "ar" ? arabicMakes : makes;
  const currentLocationsData = locations.map((loc) =>
    i18n.language === "ar"
      ? { ...loc, label: loc.arValue }
      : { ...loc, label: loc.label }
  );

  useEffect(() => {
    if (value.make) {
      const foundMake = currentMakesData.find(
        (m) => m.value === value.make || m.label === value.make
      );
      setSelectedMakeData(foundMake || null);
    } else {
      setSelectedMakeData(null);
    }
  }, [value.make, i18n.language]);

  useEffect(() => {
    if (activeDropdown) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [activeDropdown]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handleSelectMake = (make: string) => {
    const selectedMake = currentMakesData.find(
      (m) => m.label === make || m.value === make
    );
    onChange({
      ...value,
      make: selectedMake ? selectedMake.value : make === t("all") ? "" : make,
      model: "",
    });
    setSelectedMakeData(selectedMake || null);
    setActiveDropdown(null);
    setSearchQuery("");
  };

  const handleSelectModel = (model: string) => {
    onChange({
      ...value,
      model: model === t("all") ? "" : model,
    });
    setActiveDropdown(null);
    setSearchQuery("");
  };

  const handleSelectLocation = (location: string) => {
    const selectedLocation = currentLocationsData.find(
      (loc) => loc.label === location
    );
    onChange({
      ...value,
      location: selectedLocation
        ? selectedLocation.value
        : location === t("all")
        ? ""
        : location,
    });
    setActiveDropdown(null);
    setSearchQuery("");
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const renderDropdownItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        if (activeDropdown === "make") {
          handleSelectMake(item);
        } else if (activeDropdown === "model") {
          handleSelectModel(item);
        } else if (activeDropdown === "location") {
          handleSelectLocation(item);
        }
      }}
      activeOpacity={0.7}
    >
      <Text style={[styles.dropdownItemText, rtlStyle]}>{item}</Text>
    </TouchableOpacity>
  );

  const getDropdownData = () => {
    if (activeDropdown === "make") {
      const filteredMakes = currentMakesData
        .map((make) => make.label)
        .filter((label) =>
          label.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return [t("all"), ...filteredMakes];
    } else if (activeDropdown === "model" && selectedMakeData) {
      const filteredModels = (selectedMakeData.models || []).filter(
        (model: string) =>
          model.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return [t("all"), ...filteredModels];
    } else if (activeDropdown === "location") {
      const filteredLocations = currentLocationsData
        .map((loc) => loc.label)
        .filter((label) =>
          label.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return [t("all"), ...filteredLocations];
    }
    return [];
  };

  return (
    <View style={styles.container}>
      {/* Search Fields Row */}
      <View style={[styles.searchRow, rtlViewStyle]}>
        {/* Make Dropdown */}
        <View style={styles.fieldContainer}>
          <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                activeDropdown === "make" && styles.dropdownButtonActive,
              ]}
              onPress={() =>
                setActiveDropdown(activeDropdown === "make" ? null : "make")
              }
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={1}
            >
              <Text
                style={[styles.dropdownButtonText, rtlStyle]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {value.make
                  ? currentMakesData.find((m) => m.value === value.make)
                      ?.label || value.make
                  : t("make")}
              </Text>
              <Ionicons
                name={activeDropdown === "make" ? "chevron-up" : "chevron-down"}
                size={18}
                color="#b80200" // Original icon color
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Model Dropdown */}
        <View style={styles.fieldContainer}>
          <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                activeDropdown === "model" && styles.dropdownButtonActive,
                !value.make && styles.dropdownButtonDisabled,
              ]}
              onPress={() => {
                if (value.make) {
                  setActiveDropdown(
                    activeDropdown === "model" ? null : "model"
                  );
                }
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={!value.make}
              activeOpacity={1}
            >
              <Text
                style={[
                  styles.dropdownButtonText,
                  rtlStyle,
                  !value.make && styles.disabledText,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {value.model || t("model")}
              </Text>
              <Ionicons
                name={
                  activeDropdown === "model" ? "chevron-up" : "chevron-down"
                }
                size={18}
                color={!value.make ? "#ccc" : "#b80200"} // Original icon color, muted when disabled
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Location Dropdown */}
        <View style={styles.fieldContainer}>
          <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                activeDropdown === "location" && styles.dropdownButtonActive,
              ]}
              onPress={() =>
                setActiveDropdown(
                  activeDropdown === "location" ? null : "location"
                )
              }
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={1}
            >
              <Text
                style={[styles.dropdownButtonText, rtlStyle]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {value.location
                  ? currentLocationsData.find(
                      (loc) => loc.value === value.location
                    )?.label || value.location
                  : t("location")}
              </Text>
              <Ionicons
                name={
                  activeDropdown === "location" ? "chevron-up" : "chevron-down"
                }
                size={18}
                color="#b80200" // Original icon color
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Dropdown List */}
      {activeDropdown && (
        <Animated.View
          style={[styles.dropdownContainer, { opacity: fadeAnim }]}
        >
          {(activeDropdown === "make" || activeDropdown === "model") && (
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search"
                size={18}
                color="#b80200" // Original icon color
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, rtlStyle]}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder={
                  activeDropdown === "make" ? t("searchMake") : t("searchModel")
                }
                placeholderTextColor="#666" // Original placeholder color
              />
            </View>
          )}
          <FlatList
            data={getDropdownData()}
            keyExtractor={(item, index) => `${activeDropdown}-${index}`}
            renderItem={renderDropdownItem}
            style={styles.dropdown}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResults}>{t("noResultsFound")}</Text>
              </View>
            )}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff", // Reverted to white
    marginHorizontal: 10,
    marginVertical: 12,
    borderRadius: 16,
    // Original shadow values for light theme
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#b80200",
    // Keep overflow: hidden here to ensure no child leaks
    overflow: "hidden", // IMPORTANT for containing rounded corners
  },
  searchRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#f8f9fa", // Reverted to light grey
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden", // IMPORTANT for top corners
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0", // Reverted to light separator
  },
  fieldContainer: {
    flex: 1,
  },
  dropdownButton: {
    backgroundColor: "#ffffff", // Reverted to white
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#e9ecef", // Reverted to light neutral border
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 38,
    // Original button shadow values
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownButtonActive: {
    borderColor: "#b80200",
    backgroundColor: "#fff0f0", // Reverted to light red tint
    shadowColor: "#b80200",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  dropdownButtonDisabled: {
    backgroundColor: "#f0f0f0", // Reverted to light disabled background
    borderColor: "#ddd", // Reverted to light disabled border
    opacity: 0.6,
  },
  dropdownButtonText: {
    color: "#314352", // Reverted to original dark text
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  disabledText: {
    color: "#ccc", // Reverted to original muted text
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff", // Reverted to white
    borderRadius: 12,
    paddingHorizontal: 16,
    margin: 12,
    borderWidth: 2,
    borderColor: "#e9ecef", // Reverted to light neutral border
    // Original search input shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "500",
    color: "#314352", // Reverted to original dark text
  },
  dropdownContainer: {
    maxHeight: 250,
    backgroundColor: "#ffffff", // Reverted to white
    borderBottomLeftRadius: 16, // IMPORTANT for bottom corners
    borderBottomRightRadius: 16, // IMPORTANT for bottom corners
    overflow: "hidden", // IMPORTANT for clipping content
  },
  dropdown: {
    backgroundColor: "#ffffff", // Reverted to white
  },
  dropdownItem: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5", // Reverted to light separator
    backgroundColor: "#ffffff", // Reverted to white
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#314352", // Reverted to original dark text
    fontWeight: "500",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#ffffff", // Reverted to white to match dropdown
  },
  noResults: {
    fontSize: 13,
    color: "#6c757d", // Reverted to original soft grey
    fontStyle: "italic",
  },
});
