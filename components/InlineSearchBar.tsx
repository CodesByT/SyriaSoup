"use client";

import { arabicMakes, locations, makes } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useRTL } from "../hooks/useRTL";
import {
  KilometerFilterModal,
  PriceFilterModal,
  YearFilterModal,
} from "./FilterBottomSheet";

interface SearchValue {
  make: string;
  model: string;
  location: string;
  cylinder: string;
  transmission: string;
  fuelType: string;
  exteriorColor: string;
  interiorColor: string;
  priceMin: string;
  priceMax: string;
  yearMin: string;
  yearMax: string;
  kilometerMin: string;
  kilometerMax: string;
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
  const [selectedMakeData, setSelectedMakeData] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Separate modal states
  const [yearFilterVisible, setYearFilterVisible] = useState(false);
  const [priceFilterVisible, setPriceFilterVisible] = useState(false);
  const [kilometerFilterVisible, setKilometerFilterVisible] = useState(false);

  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const { height } = Dimensions.get("window");

  const currentMakesData = i18n.language === "ar" ? arabicMakes : makes;
  const currentLocationsData = locations.map((loc) =>
    i18n.language === "ar"
      ? { ...loc, label: loc.arValue }
      : { ...loc, label: loc.label }
  );

  // Filter options
  const cylinderOptions = [
    t("All"),
    t("1"),
    t("2"),
    t("4"),
    t("6"),
    t("8"),
    t("Other"),
  ];
  const transmissionOptions = [t("All"), t("Automatic"), t("Manual")];
  const fuelTypeOptions = [
    t("All"),
    t("Petrol"),
    t("Diesel"),
    t("Electric"),
    t("Hybrid"),
  ];
  const colorOptions = [
    t("All"),
    t("Black"),
    t("White"),
    t("Red"),
    t("Blue"),
    t("Silver"),
    t("Gray"),
    t("Green"),
    t("Brown"),
    t("Yellow"),
    t("Orange"),
    t("Purple"),
    t("Gold"),
    t("Other"),
  ];

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
    if (bottomSheetVisible) {
      Animated.timing(bottomSheetAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(bottomSheetAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [bottomSheetVisible]);

  const handleSelectMake = (make: string) => {
    const selectedMake = currentMakesData.find(
      (m) => m.label === make || m.value === make
    );
    onChange({
      ...value,
      make: selectedMake ? selectedMake.value : make === t("All") ? "" : make,
      model: "",
    });
    setSelectedMakeData(selectedMake || null);
    closeBottomSheet();
  };

  const handleSelectModel = (model: string) => {
    onChange({
      ...value,
      model: model === t("All") ? "" : model,
    });
    closeBottomSheet();
  };

  const handleSelectLocation = (location: string) => {
    const selectedLocation = currentLocationsData.find(
      (loc) => loc.label === location
    );
    onChange({
      ...value,
      location: selectedLocation
        ? selectedLocation.value
        : location === t("All")
        ? ""
        : location,
    });
    closeBottomSheet();
  };

  const handleSelectCylinder = (cylinder: string) => {
    onChange({
      ...value,
      cylinder: cylinder === t("All") ? "" : cylinder,
    });
    closeBottomSheet();
  };

  const handleSelectTransmission = (transmission: string) => {
    onChange({
      ...value,
      transmission: transmission === t("All") ? "" : transmission,
    });
    closeBottomSheet();
  };

  const handleSelectFuelType = (fuelType: string) => {
    onChange({
      ...value,
      fuelType: fuelType === t("All") ? "" : fuelType,
    });
    closeBottomSheet();
  };

  const handleSelectExteriorColor = (color: string) => {
    onChange({
      ...value,
      exteriorColor: color === t("All") ? "" : color,
    });
    closeBottomSheet();
  };

  const handleSelectInteriorColor = (color: string) => {
    onChange({
      ...value,
      interiorColor: color === t("All") ? "" : color,
    });
    closeBottomSheet();
  };

  // Range filter handlers
  const handleYearFilter = (yearMin: string, yearMax: string) => {
    onChange({
      ...value,
      yearMin,
      yearMax,
    });
  };

  const handlePriceFilter = (priceMin: string, priceMax: string) => {
    onChange({
      ...value,
      priceMin,
      priceMax,
    });
  };

  const handleKilometerFilter = (
    kilometerMin: string,
    kilometerMax: string
  ) => {
    onChange({
      ...value,
      kilometerMin,
      kilometerMax,
    });
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const openBottomSheet = (filter: string) => {
    setActiveFilter(filter);
    setSearchQuery("");
    setBottomSheetVisible(true);
  };

  const closeBottomSheet = () => {
    setBottomSheetVisible(false);
    setActiveFilter(null);
    setSearchQuery("");
  };

  const renderBottomSheetItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.bottomSheetItem}
      onPress={() => {
        switch (activeFilter) {
          case "make":
            handleSelectMake(item);
            break;
          case "model":
            handleSelectModel(item);
            break;
          case "location":
            handleSelectLocation(item);
            break;
          case "cylinder":
            handleSelectCylinder(item);
            break;
          case "transmission":
            handleSelectTransmission(item);
            break;
          case "fuelType":
            handleSelectFuelType(item);
            break;
          case "exteriorColor":
            handleSelectExteriorColor(item);
            break;
          case "interiorColor":
            handleSelectInteriorColor(item);
            break;
          default:
            break;
        }
      }}
      activeOpacity={0.7}
    >
      <Text style={[styles.bottomSheetItemText, rtlStyle]}>{item}</Text>
    </TouchableOpacity>
  );

  const getBottomSheetData = () => {
    switch (activeFilter) {
      case "make":
        const filteredMakes = currentMakesData
          .map((make) => make.label)
          .filter((label) =>
            label.toLowerCase().includes(searchQuery.toLowerCase())
          );
        return [t("All"), ...filteredMakes];
      case "model":
        if (!selectedMakeData) return [t("All")];
        const filteredModels = (selectedMakeData.models || []).filter(
          (model: string) =>
            model.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return [t("All"), ...filteredModels];
      case "location":
        const filteredLocations = currentLocationsData
          .map((loc) => loc.label)
          .filter((label) =>
            label.toLowerCase().includes(searchQuery.toLowerCase())
          );
        return [t("All"), ...filteredLocations];
      case "cylinder":
        return cylinderOptions.filter((option) =>
          option.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "transmission":
        return transmissionOptions.filter((option) =>
          option.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "fuelType":
        return fuelTypeOptions.filter((option) =>
          option.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "exteriorColor":
      case "interiorColor":
        return colorOptions.filter((option) =>
          option.toLowerCase().includes(searchQuery.toLowerCase())
        );
      default:
        return [];
    }
  };

  const getFilterTitle = () => {
    switch (activeFilter) {
      case "make":
        return t("select_make");
      case "model":
        return t("select_model");
      case "location":
        return t("select_location");
      case "cylinder":
        return t("select_cylinders");
      case "transmission":
        return t("select_transmission");
      case "fuelType":
        return t("select_fuel_type");
      case "exteriorColor":
        return t("select_exterior_color");
      case "interiorColor":
        return t("select_interior_color");
      default:
        return "";
    }
  };

  const getFilterValue = (filterName: string) => {
    switch (filterName) {
      case "make":
        return value.make
          ? currentMakesData.find((m) => m.value === value.make)?.label ||
              value.make
          : t("make");
      case "model":
        return value.model || t("model");
      case "location":
        return value.location
          ? currentLocationsData.find((loc) => loc.value === value.location)
              ?.label || value.location
          : t("location");
      case "cylinder":
        return value.cylinder || t("cylinder");
      case "transmission":
        return value.transmission || t("transmission");
      case "fuelType":
        return value.fuelType || t("fuel_type");
      case "exteriorColor":
        return value.exteriorColor || t("exterior_color");
      case "interiorColor":
        return value.interiorColor || t("interior_color");
      default:
        return "";
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (value.make) count++;
    if (value.model) count++;
    if (value.location) count++;
    if (value.cylinder) count++;
    if (value.transmission) count++;
    if (value.fuelType) count++;
    if (value.exteriorColor) count++;
    if (value.interiorColor) count++;
    if (value.yearMin || value.yearMax) count++;
    if (value.priceMin || value.priceMax) count++;
    if (value.kilometerMin || value.kilometerMax) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const bottomSheetHeight = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.5],
  });

  // Format year range for display
  const getYearRangeText = () => {
    if (value.yearMin && value.yearMax) {
      const minYear =
        i18n.language === "ar"
          ? value.yearMin.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
          : value.yearMin;
      const maxYear =
        i18n.language === "ar"
          ? value.yearMax.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
          : value.yearMax;
      return `${minYear} - ${maxYear}`;
    } else if (value.yearMin) {
      const minYear =
        i18n.language === "ar"
          ? value.yearMin.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
          : value.yearMin;
      return `${minYear}+`;
    } else if (value.yearMax) {
      const maxYear =
        i18n.language === "ar"
          ? value.yearMax.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
          : value.yearMax;
      return `≤${maxYear}`;
    }
    return t("year");
  };

  // Format price range for display
  const getPriceRangeText = () => {
    if (value.priceMin && value.priceMax) {
      const minPrice =
        i18n.language === "ar"
          ? Number.parseInt(value.priceMin).toLocaleString("ar-EG")
          : Number.parseInt(value.priceMin).toLocaleString();
      const maxPrice =
        i18n.language === "ar"
          ? Number.parseInt(value.priceMax).toLocaleString("ar-EG")
          : Number.parseInt(value.priceMax).toLocaleString();
      return `$${minPrice} - $${maxPrice}`;
    } else if (value.priceMin) {
      const minPrice =
        i18n.language === "ar"
          ? Number.parseInt(value.priceMin).toLocaleString("ar-EG")
          : Number.parseInt(value.priceMin).toLocaleString();
      return `$${minPrice}+`;
    } else if (value.priceMax) {
      const maxPrice =
        i18n.language === "ar"
          ? Number.parseInt(value.priceMax).toLocaleString("ar-EG")
          : Number.parseInt(value.priceMax).toLocaleString();
      return `≤$${maxPrice}`;
    }
    return t("price");
  };

  // Format kilometer range for display
  const getKilometerRangeText = () => {
    if (value.kilometerMin && value.kilometerMax) {
      const minKm =
        i18n.language === "ar"
          ? Number.parseInt(value.kilometerMin).toLocaleString("ar-EG")
          : Number.parseInt(value.kilometerMin).toLocaleString();
      const maxKm =
        i18n.language === "ar"
          ? Number.parseInt(value.kilometerMax).toLocaleString("ar-EG")
          : Number.parseInt(value.kilometerMax).toLocaleString();
      return `${minKm} - ${maxKm} ${i18n.language === "ar" ? "كم" : "km"}`;
    } else if (value.kilometerMin) {
      const minKm =
        i18n.language === "ar"
          ? Number.parseInt(value.kilometerMin).toLocaleString("ar-EG")
          : Number.parseInt(value.kilometerMin).toLocaleString();
      return `${minKm}+ ${i18n.language === "ar" ? "كم" : "km"}`;
    } else if (value.kilometerMax) {
      const maxKm =
        i18n.language === "ar"
          ? Number.parseInt(value.kilometerMax).toLocaleString("ar-EG")
          : Number.parseInt(value.kilometerMax).toLocaleString();
      return `≤${maxKm} ${i18n.language === "ar" ? "كم" : "km"}`;
    }
    return t("km");
  };

  return (
    <View style={styles.container}>
      {/* Search Bar Row */}
      <View style={[styles.searchRow, rtlViewStyle]}>
        {/* Scrollable Pills Container */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContainer}
          style={styles.pillsScrollView}
        >
          {/* Filters Button - Fixed */}
          <TouchableOpacity
            style={styles.filtersButton}
            onPress={() => {
              /* Can add general filters modal here if needed */
            }}
            activeOpacity={0.7}
          >
            <View style={styles.filterIconContainer}>
              <Ionicons name="options" size={18} color="#B80200" />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.filtersText, rtlStyle]}>{t("filters")}</Text>
          </TouchableOpacity>

          {/* Make Filter */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              value.make ? styles.pillButtonActive : null,
            ]}
            onPress={() => openBottomSheet("make")}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillButtonText, rtlStyle]}>
              {getFilterValue("make")}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#666"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          {/* Model Filter */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              !value.make && styles.pillButtonDisabled,
              value.model ? styles.pillButtonActive : null,
            ]}
            onPress={() => {
              if (value.make) {
                openBottomSheet("model");
              }
            }}
            disabled={!value.make}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pillButtonText,
                rtlStyle,
                !value.make && styles.pillButtonTextDisabled,
              ]}
            >
              {getFilterValue("model")}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={!value.make ? "#ccc" : "#666"}
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          {/* Location Filter */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              value.location ? styles.pillButtonActive : null,
            ]}
            onPress={() => openBottomSheet("location")}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillButtonText, rtlStyle]}>
              {getFilterValue("location")}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#666"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          {/* Year Range Filter */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              value.yearMin || value.yearMax ? styles.pillButtonActive : null,
            ]}
            onPress={() => setYearFilterVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillButtonText, rtlStyle]}>
              {getYearRangeText()}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#666"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          {/* Price Range Filter */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              value.priceMin || value.priceMax ? styles.pillButtonActive : null,
            ]}
            onPress={() => setPriceFilterVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillButtonText, rtlStyle]}>
              {getPriceRangeText()}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#666"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          {/* Kilometer Range Filter */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              value.kilometerMin || value.kilometerMax
                ? styles.pillButtonActive
                : null,
            ]}
            onPress={() => setKilometerFilterVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillButtonText, rtlStyle]}>
              {getKilometerRangeText()}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#666"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          {/* Cylinder Filter */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              value.cylinder ? styles.pillButtonActive : null,
            ]}
            onPress={() => openBottomSheet("cylinder")}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillButtonText, rtlStyle]}>
              {getFilterValue("cylinder")}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#666"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          {/* Transmission Filter */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              value.transmission ? styles.pillButtonActive : null,
            ]}
            onPress={() => openBottomSheet("transmission")}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillButtonText, rtlStyle]}>
              {getFilterValue("transmission")}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#666"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          {/* Fuel Type Filter */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              value.fuelType ? styles.pillButtonActive : null,
            ]}
            onPress={() => openBottomSheet("fuelType")}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillButtonText, rtlStyle]}>
              {getFilterValue("fuelType")}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#666"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          {/* Exterior Color Filter */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              value.exteriorColor ? styles.pillButtonActive : null,
            ]}
            onPress={() => openBottomSheet("exteriorColor")}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillButtonText, rtlStyle]}>
              {getFilterValue("exteriorColor")}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#666"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          {/* Interior Color Filter */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              value.interiorColor ? styles.pillButtonActive : null,
            ]}
            onPress={() => openBottomSheet("interiorColor")}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillButtonText, rtlStyle]}>
              {getFilterValue("interiorColor")}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#666"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom Sheet Modal for individual filters */}
      <Modal
        visible={bottomSheetVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeBottomSheet}
      >
        <TouchableWithoutFeedback onPress={closeBottomSheet}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.bottomSheetContainer,
                  { height: bottomSheetHeight },
                ]}
              >
                <View style={styles.bottomSheetHeader}>
                  <Text style={styles.bottomSheetTitle}>
                    {getFilterTitle()}
                  </Text>
                  <TouchableOpacity onPress={closeBottomSheet}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchInputContainer}>
                  <Ionicons
                    name="search"
                    size={18}
                    color="#B80200"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={[styles.searchInput, rtlStyle]}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    placeholder={t("Search")}
                    placeholderTextColor="#666"
                    autoFocus={true}
                  />
                </View>

                <FlatList
                  data={getBottomSheetData()}
                  keyExtractor={(item, index) => `${activeFilter}-${index}`}
                  renderItem={renderBottomSheetItem}
                  style={styles.bottomSheetList}
                  showsVerticalScrollIndicator={true}
                  ListEmptyComponent={() => (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResults}>
                        {t("noResultsFound")}
                      </Text>
                    </View>
                  )}
                />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Range Filter Modals */}
      <YearFilterModal
        visible={yearFilterVisible}
        onClose={() => setYearFilterVisible(false)}
        yearMin={value.yearMin}
        yearMax={value.yearMax}
        onApply={handleYearFilter}
      />

      <PriceFilterModal
        visible={priceFilterVisible}
        onClose={() => setPriceFilterVisible(false)}
        priceMin={value.priceMin}
        priceMax={value.priceMax}
        onApply={handlePriceFilter}
      />

      <KilometerFilterModal
        visible={kilometerFilterVisible}
        onClose={() => setKilometerFilterVisible(false)}
        kilometerMin={value.kilometerMin}
        kilometerMax={value.kilometerMax}
        onApply={handleKilometerFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    marginHorizontal: 0,
    marginVertical: 0,
    marginStart: 10,
  },
  searchRow: {
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  filtersButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    marginRight: 8,
  },
  filterIconContainer: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#b80200",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  filtersText: {
    fontSize: Math.max(16, 1),
    fontWeight: "500",
    color: "#333",
  },
  pillsScrollView: {
    flex: 1,
  },
  pillsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 16,
  },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    minHeight: 40,
  },
  pillButtonActive: {
    borderColor: "#B80200",
  },
  pillButtonDisabled: {
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f8f8",
  },
  pillButtonText: {
    fontSize: Math.max(13, 1),
    fontWeight: "400",
    color: "#333",
  },
  pillButtonTextDisabled: {
    color: "#aaa",
  },
  chevronIcon: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 16,
    margin: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: Math.max(15, 1),
    fontWeight: "400",
    color: "#333",
  },
  bottomSheetList: {
    flex: 1,
  },
  bottomSheetItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  bottomSheetItemText: {
    fontSize: 16,
    color: "#333",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  noResults: {
    fontSize: Math.max(13, 1),
    color: "#666",
    fontStyle: "italic",
  },
});

// import { arabicMakes, locations, makes } from "@/utils/constants";
// import { Ionicons } from "@expo/vector-icons";
// import { useEffect, useRef, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   Animated,
//   FlatList,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useRTL } from "../hooks/useRTL";

// interface SearchValue {
//   make: string;
//   model: string;
//   location: string;
// }

// interface InlineSearchBarProps {
//   value: SearchValue;
//   onChange: (value: SearchValue) => void;
//   placeholder?: string;
//   onFiltersPress?: () => void;
// }

// export default function InlineSearchBar({
//   value,
//   onChange,
//   placeholder,
//   onFiltersPress,
// }: InlineSearchBarProps) {
//   const { t, i18n } = useTranslation();
//   const { rtlViewStyle, rtlStyle } = useRTL();
//   const [activeDropdown, setActiveDropdown] = useState<
//     "make" | "model" | "location" | null
//   >(null);
//   const [selectedMakeData, setSelectedMakeData] = useState<any | null>(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   const currentMakesData = i18n.language === "ar" ? arabicMakes : makes;
//   const currentLocationsData = locations.map((loc) =>
//     i18n.language === "ar"
//       ? { ...loc, label: loc.arValue }
//       : { ...loc, label: loc.label }
//   );

//   useEffect(() => {
//     if (value.make) {
//       const foundMake = currentMakesData.find(
//         (m) => m.value === value.make || m.label === value.make
//       );
//       setSelectedMakeData(foundMake || null);
//     } else {
//       setSelectedMakeData(null);
//     }
//   }, [value.make, i18n.language]);

//   useEffect(() => {
//     if (activeDropdown) {
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 250,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       Animated.timing(fadeAnim, {
//         toValue: 0,
//         duration: 200,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [activeDropdown]);

//   const handleSelectMake = (make: string) => {
//     const selectedMake = currentMakesData.find(
//       (m) => m.label === make || m.value === make
//     );
//     onChange({
//       ...value,
//       make: selectedMake ? selectedMake.value : make === t("all") ? "" : make,
//       model: "",
//     });
//     setSelectedMakeData(selectedMake || null);
//     setActiveDropdown(null);
//     setSearchQuery("");
//   };

//   const handleSelectModel = (model: string) => {
//     onChange({
//       ...value,
//       model: model === t("all") ? "" : model,
//     });
//     setActiveDropdown(null);
//     setSearchQuery("");
//   };

//   const handleSelectLocation = (location: string) => {
//     const selectedLocation = currentLocationsData.find(
//       (loc) => loc.label === location
//     );
//     onChange({
//       ...value,
//       location: selectedLocation
//         ? selectedLocation.value
//         : location === t("all")
//         ? ""
//         : location,
//     });
//     setActiveDropdown(null);
//     setSearchQuery("");
//   };

//   const handleSearchChange = (text: string) => {
//     setSearchQuery(text);
//   };

//   const renderDropdownItem = ({ item }: { item: string }) => (
//     <TouchableOpacity
//       style={styles.dropdownItem}
//       onPress={() => {
//         if (activeDropdown === "make") {
//           handleSelectMake(item);
//         } else if (activeDropdown === "model") {
//           handleSelectModel(item);
//         } else if (activeDropdown === "location") {
//           handleSelectLocation(item);
//         }
//       }}
//       activeOpacity={0.7}
//     >
//       <Text style={[styles.dropdownItemText, rtlStyle]}>{item}</Text>
//     </TouchableOpacity>
//   );

//   const getDropdownData = () => {
//     if (activeDropdown === "make") {
//       const filteredMakes = currentMakesData
//         .map((make) => make.label)
//         .filter((label) =>
//           label.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//       return [t("all"), ...filteredMakes];
//     } else if (activeDropdown === "model" && selectedMakeData) {
//       const filteredModels = (selectedMakeData.models || []).filter(
//         (model: string) =>
//           model.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//       return [t("all"), ...filteredModels];
//     } else if (activeDropdown === "location") {
//       const filteredLocations = currentLocationsData
//         .map((loc) => loc.label)
//         .filter((label) =>
//           label.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//       return [t("all"), ...filteredLocations];
//     }
//     return [];
//   };

//   return (
//     <View style={styles.container}>
//       {/* Search Bar Row */}
//       <View style={[styles.searchRow, rtlViewStyle]}>
//         {/* Scrollable Pills Container */}
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.pillsContainer}
//           style={styles.pillsScrollView}
//         >
//           {/* Filters Button - Fixed */}
//           <TouchableOpacity
//             style={styles.filtersButton}
//             onPress={onFiltersPress}
//             activeOpacity={0.7}
//           >
//             <View style={styles.filterIconContainer}>
//               <Ionicons name="options" size={18} color="#B80200" />
//             </View>
//             <Text style={[styles.filtersText, rtlStyle]}>{t("filters")}</Text>
//           </TouchableOpacity>
//           {/* Make Dropdown */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               activeDropdown === "make" && styles.pillButtonActive,
//             ]}
//             onPress={() =>
//               setActiveDropdown(activeDropdown === "make" ? null : "make")
//             }
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {value.make
//                 ? currentMakesData.find((m) => m.value === value.make)?.label ||
//                   value.make
//                 : t("make")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Model Dropdown */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               !value.make && styles.pillButtonDisabled,
//             ]}
//             onPress={() => {
//               if (value.make) {
//                 setActiveDropdown(activeDropdown === "model" ? null : "model");
//               }
//             }}
//             disabled={!value.make}
//             activeOpacity={0.8}
//           >
//             <Text
//               style={[
//                 styles.pillButtonText,
//                 rtlStyle,
//                 !value.make && styles.pillButtonTextDisabled,
//               ]}
//             >
//               {value.model || t("model")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color={!value.make ? "#ccc" : "#666"}
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Location Dropdown */}
//           <TouchableOpacity
//             style={[styles.pillButton]}
//             onPress={() =>
//               setActiveDropdown(
//                 activeDropdown === "location" ? null : "location"
//               )
//             }
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {value.location
//                 ? currentLocationsData.find(
//                     (loc) => loc.value === value.location
//                   )?.label || value.location
//                 : t("location")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>
//         </ScrollView>
//       </View>

//       {/* Dropdown List */}
//       {activeDropdown && (
//         <Animated.View
//           style={[styles.dropdownContainer, { opacity: fadeAnim }]}
//         >
//           {(activeDropdown === "make" || activeDropdown === "model") && (
//             <View style={styles.searchInputContainer}>
//               <Ionicons
//                 name="search"
//                 size={18}
//                 color="#B80200"
//                 style={styles.searchIcon}
//               />
//               <TextInput
//                 style={[styles.searchInput, rtlStyle]}
//                 value={searchQuery}
//                 onChangeText={handleSearchChange}
//                 placeholder={
//                   activeDropdown === "make" ? t("searchMake") : t("searchModel")
//                 }
//                 placeholderTextColor="#666"
//               />
//             </View>
//           )}
//           <FlatList
//             data={getDropdownData()}
//             keyExtractor={(item, index) => `${activeDropdown}-${index}`}
//             renderItem={renderDropdownItem}
//             style={styles.dropdown}
//             maxToRenderPerBatch={10}
//             initialNumToRender={10}
//             showsVerticalScrollIndicator={false}
//             ListEmptyComponent={() => (
//               <View style={styles.noResultsContainer}>
//                 <Text style={styles.noResults}>{t("noResultsFound")}</Text>
//               </View>
//             )}
//           />
//         </Animated.View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#ffffff",
//     marginHorizontal: 16,
//     marginVertical: 0,
//   },
//   searchRow: {
//     marginVertical: 10,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 4,
//   },
//   filtersButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 8,
//     paddingVertical: 6,
//     gap: 6,
//     marginRight: 8,
//   },
//   filterIconContainer: {
//     width: 16,
//     height: 16,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   filtersText: {
//     fontSize: Math.max(16, 1),
//     fontWeight: "500",
//     color: "#333",
//   },
//   pillsScrollView: {
//     flex: 1,
//   },
//   pillsContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     paddingRight: 16, // Extra padding at the end for better scrolling
//   },
//   pillButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     backgroundColor: "#ffffff",
//     borderRadius: 25,
//     borderWidth: 1,
//     borderColor: "#d0d0d0",
//     minHeight: 40,
//     // Remove flex: 1 to allow content-based sizing
//   },
//   pillButtonActive: {
//     borderColor: "#B80200",
//   },
//   pillButtonDisabled: {
//     borderColor: "#e0e0e0",
//     backgroundColor: "#f8f8f8",
//   },
//   pillButtonText: {
//     fontSize: Math.max(13, 1),
//     fontWeight: "400",
//     color: "#333",
//     // Remove flex: 1 to prevent text truncation
//   },
//   pillButtonTextDisabled: {
//     color: "#aaa",
//   },
//   chevronIcon: {
//     marginLeft: 8, // Space between text and icon
//   },
//   dropdownContainer: {
//     maxHeight: 250,
//     backgroundColor: "#ffffff",
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//     borderRadius: 8,
//     marginTop: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   dropdown: {
//     backgroundColor: "#ffffff",
//   },
//   dropdownItem: {
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f5f5f5",
//     backgroundColor: "#ffffff",
//   },
//   dropdownItemText: {
//     fontSize: Math.max(14, 1),
//     color: "#333",
//     fontWeight: "400",
//   },
//   searchInputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#ffffff",
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     margin: 12,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   searchIcon: {
//     marginRight: 10,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 10,
//     fontSize: Math.max(15, 1),
//     fontWeight: "400",
//     color: "#333",
//   },
//   noResultsContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 30,
//     backgroundColor: "#ffffff",
//   },
//   noResults: {
//     fontSize: Math.max(13, 1),
//     color: "#666",
//     fontStyle: "italic",
//   },
// });
