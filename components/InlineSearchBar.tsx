"use client";

import { arabicMakes, locations, makes } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import ComprehensiveFilterModal from "./ComprehensiveFilterModal";
import {
  KilometerFilterModal,
  PriceFilterModal,
  YearFilterModal,
} from "./FilterBottomSheet";

interface SearchValue {
  make: string;
  model: string;
  location: string[]; // CHANGED: From 'string' to 'string[]'
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

  // Comprehensive filter modal state
  const [comprehensiveFilterVisible, setComprehensiveFilterVisible] =
    useState(false);

  // Separate modal states for individual filters
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

  // Filter options - MODIFIED to use objects with id and label
  const cylinderOptions = useMemo(
    () => [
      // { id: "", label: t("All") },
      { id: "3", label: t("3") },
      { id: "4", label: t("4") },
      { id: "5", label: t("5") },
      { id: "6", label: t("6") },
      { id: "8", label: t("8") },
      { id: "Other", label: t("Other") },
      // { id: "Unknown", label: t("Unknown") },
    ],
    [i18n.language, t]
  );

  const transmissionOptions = useMemo(
    () => [
      // { id: "", label: t("All") },
      { id: "Automatic", label: t("Automatic") },
      { id: "Manual", label: t("Manual") },
    ],
    [i18n.language, t]
  );

  const fuelTypeOptions = useMemo(
    () => [
      // { id: "", label: t("All") },
      { id: "Petrol", label: t("Petrol") },
      { id: "Diesel", label: t("Diesel") },
      { id: "Electric", label: t("Electric") },
      { id: "Hybrid", label: t("Hybrid") },
    ],
    [i18n.language, t]
  );

  const colorOptions = useMemo(
    () => [
      // { id: "", label: t("All") },
      { id: "Black", label: t("Black") },
      { id: "Blue", label: t("Blue") },
      { id: "Brown", label: t("Brown") },
      { id: "Gold", label: t("Gold") },
      { id: "Green", label: t("Green") },
      { id: "Red", label: t("Red") },

      { id: "Pink", label: t("Pink") },
      { id: "Purple", label: t("Purple") },
      { id: "Silver", label: t("Silver") },
      { id: "White", label: t("White") },
      { id: "Other", label: t("Other") },
    ],
    [i18n.language, t]
  );
  const interiorColorOptions = useMemo(
    () => [
      // { id: "", label: t("All") },
      { id: "Beige", label: t("Beige") },
      { id: "Black", label: t("Black") },
      { id: "Blue", label: t("Blue") },
      { id: "Brown", label: t("Brown") },
      { id: "Red", label: t("Red") },
      { id: "White", label: t("White") },
      { id: "Other", label: t("Other") },
    ],
    [i18n.language, t]
  );

  useEffect(() => {
    if (value.make) {
      const foundMake = currentMakesData.find((m) => m.value === value.make);
      setSelectedMakeData(foundMake || null);
    } else {
      setSelectedMakeData(null);
    }
  }, [value.make, i18n.language, currentMakesData]);

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
  }, [bottomSheetVisible, bottomSheetAnim, height]); // Added height to dependency array

  const handleSelectMake = (makeId: string) => {
    const selectedMake = currentMakesData.find((m) => m.value === makeId);
    onChange({
      ...value,
      make: selectedMake ? selectedMake.value : "",
      model: "",
    });
    setSelectedMakeData(selectedMake || null);
    closeBottomSheet();
  };

  const handleSelectModel = (modelId: string) => {
    onChange({
      ...value,
      model: modelId,
    });
    closeBottomSheet();
  };

  // MODIFIED: handleSelectLocation to return an array for 'location'
  const handleSelectLocation = (locationId: string) => {
    const selectedLocation = currentLocationsData.find(
      (loc) => loc.value === locationId
    );
    onChange({
      ...value,
      location:
        locationId === ""
          ? []
          : selectedLocation
          ? [selectedLocation.value]
          : [locationId],
    });
    closeBottomSheet();
  };

  const handleSelectCylinder = (cylinderId: string) => {
    onChange({
      ...value,
      cylinder: cylinderId,
    });
    closeBottomSheet();
  };

  const handleSelectTransmission = (transmissionId: string) => {
    onChange({
      ...value,
      transmission: transmissionId,
    });
    closeBottomSheet();
  };

  const handleSelectFuelType = (fuelTypeId: string) => {
    onChange({
      ...value,
      fuelType: fuelTypeId,
    });
    closeBottomSheet();
  };

  const handleSelectExteriorColor = (colorId: string) => {
    onChange({
      ...value,
      exteriorColor: colorId,
    });
    closeBottomSheet();
  };

  const handleSelectInteriorColor = (colorId: string) => {
    onChange({
      ...value,
      interiorColor: colorId,
    });
    closeBottomSheet();
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

  const renderBottomSheetItem = ({
    item,
  }: {
    item: { id: string; label: string };
  }) => (
    <TouchableOpacity
      style={styles.bottomSheetItem}
      onPress={() => {
        switch (activeFilter) {
          case "make":
            handleSelectMake(item.id);
            break;
          case "model":
            handleSelectModel(item.id);
            break;
          case "location":
            handleSelectLocation(item.id);
            break;
          case "cylinder":
            handleSelectCylinder(item.id);
            break;
          case "transmission":
            handleSelectTransmission(item.id);
            break;
          case "fuelType":
            handleSelectFuelType(item.id);
            break;
          case "exteriorColor":
            handleSelectExteriorColor(item.id);
            break;
          case "interiorColor":
            handleSelectInteriorColor(item.id);
            break;
          default:
            break;
        }
      }}
      activeOpacity={0.7}
    >
      <Text style={[styles.bottomSheetItemText, rtlStyle]}>{item.label}</Text>
    </TouchableOpacity>
  );

  const getBottomSheetData = () => {
    switch (activeFilter) {
      case "make":
        const filteredMakes = currentMakesData
          .map((make) => ({ id: make.value, label: make.label }))
          .filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
          );
        return [{ id: "", label: t("All") }, ...filteredMakes];
      case "model":
        if (!selectedMakeData) return [{ id: "", label: t("All") }];
        const filteredModels = (selectedMakeData.models || [])
          .map((model: string) => ({ id: model, label: model }))
          .filter((option: { id: string; label: string }) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
          );
        return [{ id: "", label: t("All") }, ...filteredModels];
      case "location":
        const filteredLocations = currentLocationsData
          .map((loc) => ({ id: loc.value, label: loc.label }))
          .filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
          );
        return [{ id: "", label: t("All") }, ...filteredLocations];
      case "cylinder":
        return cylinderOptions.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "transmission":
        return transmissionOptions.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "fuelType":
        return fuelTypeOptions.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "exteriorColor":
        return colorOptions.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "interiorColor":
        return interiorColorOptions.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
      default:
        return [];
    }
  };

  const getFilterTitle = () => {
    switch (activeFilter) {
      case "make":
        return t("Make");
      case "model":
        return t("model");
      case "location":
        return t("location");
      case "cylinder":
        return t("cylinder");
      case "transmission":
        return t("transmission");
      case "fuelType":
        return t("fuel_type");
      case "exteriorColor":
        return t("exterior_color");
      case "interiorColor":
        return t("interior_color");
      default:
        return "";
    }
  };
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
  // MODIFIED: getFilterValue for all canonical filters
  const getFilterValue = (filterName: string) => {
    switch (filterName) {
      case "make":
        return value.make
          ? currentMakesData.find((m) => m.value === value.make)?.label ||
              value.make
          : t("Make");
      case "model":
        return value.model || t("model");
      case "location":
        if (Array.isArray(value.location) && value.location.length > 0) {
          if (value.location.length === 1) {
            return (
              currentLocationsData.find(
                (loc) => loc.value === value.location[0]
              )?.label || value.location[0]
            );
          } else {
            return `${value.location.length} ${t("location")}`;
          }
        }
        return t("location");
      case "cylinder":
        return value.cylinder
          ? cylinderOptions.find((opt) => opt.id === value.cylinder)?.label ||
              value.cylinder
          : t("cylinder");
      case "transmission":
        return value.transmission
          ? transmissionOptions.find((opt) => opt.id === value.transmission)
              ?.label || value.transmission
          : t("transmission");
      case "fuelType":
        return value.fuelType
          ? fuelTypeOptions.find((opt) => opt.id === value.fuelType)?.label ||
              value.fuelType
          : t("fuel_type");
      case "exteriorColor":
        return value.exteriorColor
          ? colorOptions.find((opt) => opt.id === value.exteriorColor)?.label ||
              value.exteriorColor
          : t("exterior_color");
      case "interiorColor":
        return value.interiorColor
          ? interiorColorOptions.find((opt) => opt.id === value.interiorColor)
              ?.label || value.interiorColor
          : t("interior_color");
      default:
        return "";
    }
  };

  // MODIFIED: getActiveFilterCount to handle 'location' as an array
  const getActiveFilterCount = () => {
    let count = 0;
    if (value.make) count++;
    if (value.model) count++;
    if (Array.isArray(value.location) && value.location.length > 0) count++;
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
    outputRange: [0, height * 0.7],
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
    return t("kilometer");
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
          {/* Filters Button - Opens Comprehensive Modal */}
          <TouchableOpacity
            style={styles.filtersButton}
            onPress={() => setComprehensiveFilterVisible(true)}
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
              Array.isArray(value.location) && value.location.length > 0
                ? styles.pillButtonActive
                : null,
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

      {/* Comprehensive Filter Modal */}
      <ComprehensiveFilterModal
        visible={comprehensiveFilterVisible}
        onClose={() => setComprehensiveFilterVisible(false)}
        value={value}
        onChange={onChange}
      />

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
                  keyExtractor={(item, index) =>
                    `${activeFilter}-${item.id || index}`
                  }
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
        onApply={handleYearFilter}
        yearMin={value.yearMin}
        yearMax={value.yearMax}
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
    marginHorizontal: 16,
    marginVertical: 0,
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
// "use client";

// import { arabicMakes, locations, makes } from "@/utils/constants";
// import { Ionicons } from "@expo/vector-icons";
// import { useEffect, useRef, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   Animated,
//   Dimensions,
//   FlatList,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   View,
// } from "react-native";
// import { useRTL } from "../hooks/useRTL";
// import ComprehensiveFilterModal from "./ComprehensiveFilterModal";
// import {
//   KilometerFilterModal,
//   PriceFilterModal,
//   YearFilterModal,
// } from "./FilterBottomSheet";

// interface SearchValue {
//   make: string;
//   model: string;
//   location: string[]; // CHANGED: From 'string' to 'string[]'
//   cylinder: string;
//   transmission: string;
//   fuelType: string;
//   exteriorColor: string;
//   interiorColor: string;
//   priceMin: string;
//   priceMax: string;
//   yearMin: string;
//   yearMax: string;
//   kilometerMin: string;
//   kilometerMax: string;
// }

// interface InlineSearchBarProps {
//   value: SearchValue;
//   onChange: (value: SearchValue) => void;
//   placeholder?: string;
// }

// export default function InlineSearchBar({
//   value,
//   onChange,
//   placeholder,
// }: InlineSearchBarProps) {
//   const { t, i18n } = useTranslation();
//   const { rtlViewStyle, rtlStyle } = useRTL();
//   const [selectedMakeData, setSelectedMakeData] = useState<any | null>(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
//   const [activeFilter, setActiveFilter] = useState<string | null>(null);

//   // Comprehensive filter modal state
//   const [comprehensiveFilterVisible, setComprehensiveFilterVisible] =
//     useState(false);

//   // Separate modal states for individual filters
//   const [yearFilterVisible, setYearFilterVisible] = useState(false);
//   const [priceFilterVisible, setPriceFilterVisible] = useState(false);
//   const [kilometerFilterVisible, setKilometerFilterVisible] = useState(false);

//   const bottomSheetAnim = useRef(new Animated.Value(0)).current;
//   const { height } = Dimensions.get("window");

//   const currentMakesData = i18n.language === "ar" ? arabicMakes : makes;
//   const currentLocationsData = locations.map((loc) =>
//     i18n.language === "ar"
//       ? { ...loc, label: loc.arValue }
//       : { ...loc, label: loc.label }
//   );

//   // Filter options
//   const cylinderOptions = [
//     t("All"),
//     t("3"),
//     t("4"),
//     t("5"),
//     t("6"),
//     t("8"),
//     t("Other"),
//     t("Unknown"),
//   ];
//   const transmissionOptions = [t("All"), t("Automatic"), t("Manual")];
//   const fuelTypeOptions = [
//     t("All"),
//     t("Petrol"),
//     t("Diesel"),
//     t("Electric"),
//     t("Hybrid"),
//   ];
//   const colorOptions = [
//     t("All"),
//     t("Black"),
//     t("White"),
//     t("Red"),
//     t("Blue"),
//     t("Silver"),
//     t("Gray"),
//     t("Green"),
//     t("Brown"),
//     t("Yellow"),
//     t("Orange"),
//     t("Purple"),
//     t("Gold"),
//     t("Other"),
//   ];

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
//     if (bottomSheetVisible) {
//       Animated.timing(bottomSheetAnim, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: false,
//       }).start();
//     } else {
//       Animated.timing(bottomSheetAnim, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: false,
//       }).start();
//     }
//   }, [bottomSheetVisible]);

//   const handleSelectMake = (make: string) => {
//     const selectedMake = currentMakesData.find(
//       (m) => m.value === make || m.label === make
//     );
//     onChange({
//       ...value,
//       make: selectedMake ? selectedMake.value : make === t("All") ? "" : make,
//       model: "",
//     });
//     setSelectedMakeData(selectedMake || null);
//     closeBottomSheet();
//   };

//   const handleSelectModel = (model: string) => {
//     onChange({
//       ...value,
//       model: model === t("All") ? "" : model,
//     });
//     closeBottomSheet();
//   };

//   // MODIFIED: handleSelectLocation to return an array for 'location'
//   const handleSelectLocation = (location: string) => {
//     const selectedLocation = currentLocationsData.find(
//       (loc) => loc.label === location
//     );
//     onChange({
//       ...value,
//       location:
//         location === t("All")
//           ? [] // If "All" is selected, set location to an empty array
//           : selectedLocation
//           ? [selectedLocation.value] // If a specific location is selected, wrap it in an array
//           : [location], // Fallback to wrapping the original string in an array
//     });
//     closeBottomSheet();
//   };

//   const handleSelectCylinder = (cylinder: string) => {
//     onChange({
//       ...value,
//       cylinder: cylinder === t("All") ? "" : cylinder,
//     });
//     closeBottomSheet();
//   };

//   const handleSelectTransmission = (transmission: string) => {
//     onChange({
//       ...value,
//       transmission: transmission === t("All") ? "" : transmission,
//     });
//     closeBottomSheet();
//   };

//   const handleSelectFuelType = (fuelType: string) => {
//     onChange({
//       ...value,
//       fuelType: fuelType === t("All") ? "" : fuelType,
//     });
//     closeBottomSheet();
//   };

//   const handleSelectExteriorColor = (color: string) => {
//     onChange({
//       ...value,
//       exteriorColor: color === t("All") ? "" : color,
//     });
//     closeBottomSheet();
//   };

//   const handleSelectInteriorColor = (color: string) => {
//     onChange({
//       ...value,
//       interiorColor: color === t("All") ? "" : color,
//     });
//     closeBottomSheet();
//   };

//   // Range filter handlers

//   const handleSearchChange = (text: string) => {
//     setSearchQuery(text);
//   };

//   const openBottomSheet = (filter: string) => {
//     setActiveFilter(filter);
//     setSearchQuery("");
//     setBottomSheetVisible(true);
//   };

//   const closeBottomSheet = () => {
//     setBottomSheetVisible(false);
//     setActiveFilter(null);
//     setSearchQuery("");
//   };

//   const renderBottomSheetItem = ({ item }: { item: string }) => (
//     <TouchableOpacity
//       style={styles.bottomSheetItem}
//       onPress={() => {
//         switch (activeFilter) {
//           case "make":
//             handleSelectMake(item);
//             break;
//           case "model":
//             handleSelectModel(item);
//             break;
//           case "location":
//             handleSelectLocation(item); // This will now handle converting to array
//             break;
//           case "cylinder":
//             handleSelectCylinder(item);
//             break;
//           case "transmission":
//             handleSelectTransmission(item);
//             break;
//           case "fuelType":
//             handleSelectFuelType(item);
//             break;
//           case "exteriorColor":
//             handleSelectExteriorColor(item);
//             break;
//           case "interiorColor":
//             handleSelectInteriorColor(item);
//             break;
//           default:
//             break;
//         }
//       }}
//       activeOpacity={0.7}
//     >
//       <Text style={[styles.bottomSheetItemText, rtlStyle]}>{item}</Text>
//     </TouchableOpacity>
//   );

//   const getBottomSheetData = () => {
//     switch (activeFilter) {
//       case "make":
//         const filteredMakes = currentMakesData
//           .map((make) => make.label)
//           .filter((label) =>
//             label.toLowerCase().includes(searchQuery.toLowerCase())
//           );
//         return [t("All"), ...filteredMakes];
//       case "model":
//         if (!selectedMakeData) return [t("All")];
//         const filteredModels = (selectedMakeData.models || []).filter(
//           (model: string) =>
//             model.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//         return [t("All"), ...filteredModels];
//       case "location":
//         const filteredLocations = currentLocationsData
//           .map((loc) => loc.label)
//           .filter((label) =>
//             label.toLowerCase().includes(searchQuery.toLowerCase())
//           );
//         return [t("All"), ...filteredLocations];
//       case "cylinder":
//         return cylinderOptions.filter((option) =>
//           option.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//       case "transmission":
//         return transmissionOptions.filter((option) =>
//           option.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//       case "fuelType":
//         return fuelTypeOptions.filter((option) =>
//           option.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//       case "exteriorColor":
//       case "interiorColor":
//         return colorOptions.filter((option) =>
//           option.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//       default:
//         return [];
//     }
//   };

//   const getFilterTitle = () => {
//     switch (activeFilter) {
//       case "make":
//         return t("Make");
//       case "model":
//         return t("model");
//       case "location":
//         return t("location");
//       case "cylinder":
//         return t("cylinder");
//       case "transmission":
//         return t("transmission");
//       case "fuelType":
//         return t("fuel_type");
//       case "exteriorColor":
//         return t("exterior_color");
//       case "interiorColor":
//         return t("interior_color");
//       default:
//         return "";
//     }
//   };

//   // MODIFIED: getFilterValue for 'location' to handle arrays
//   const getFilterValue = (filterName: string) => {
//     switch (filterName) {
//       case "make":
//         return value.make
//           ? currentMakesData.find((m) => m.value === value.make)?.label ||
//               value.make
//           : t("Make");
//       case "model":
//         return value.model || t("model");
//       case "location":
//         // Check if value.location is an array and not empty
//         if (Array.isArray(value.location) && value.location.length > 0) {
//           if (value.location.length === 1) {
//             // If only one location is selected, display its label
//             return (
//               currentLocationsData.find(
//                 (loc) => loc.value === value.location[0]
//               )?.label || value.location[0]
//             );
//           } else {
//             // If multiple locations are selected, display a summary
//             // You should define 'locationsSelected' in your i18n translation files
//             return `${value.location.length} ${t("location")}`;
//             // Alternatively, to show a comma-separated list of the first few:
//             /*
//             const displayedLocations = value.location.slice(0, 2).map(locValue =>
//               currentLocationsData.find(loc => loc.value === locValue)?.label || locValue
//             ).join(', ');
//             return value.location.length > 2 ? `${displayedLocations}...` : displayedLocations;
//             */
//           }
//         }
//         return t("location"); // Default text if no locations are selected
//       case "cylinder":
//         return value.cylinder || t("cylinder");
//       case "transmission":
//         return value.transmission || t("transmission");
//       case "fuelType":
//         return value.fuelType || t("fuel_type");
//       case "exteriorColor":
//         return value.exteriorColor || t("exterior_color");
//       case "interiorColor":
//         return value.interiorColor || t("interior_color");
//       default:
//         return "";
//     }
//   };

//   // MODIFIED: getActiveFilterCount to handle 'location' as an array
//   const getActiveFilterCount = () => {
//     let count = 0;
//     if (value.make) count++;
//     if (value.model) count++;
//     if (Array.isArray(value.location) && value.location.length > 0) count++; // CHANGED
//     if (value.cylinder) count++;
//     if (value.transmission) count++;
//     if (value.fuelType) count++;
//     if (value.exteriorColor) count++;
//     if (value.interiorColor) count++;
//     if (value.yearMin || value.yearMax) count++;
//     if (value.priceMin || value.priceMax) count++;
//     if (value.kilometerMin || value.kilometerMax) count++;
//     return count;
//   };

//   const activeFilterCount = getActiveFilterCount();

//   const bottomSheetHeight = bottomSheetAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, height * 0.7],
//   });

//   // Format year range for display
//   const getYearRangeText = () => {
//     if (value.yearMin && value.yearMax) {
//       const minYear =
//         i18n.language === "ar"
//           ? value.yearMin.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
//           : value.yearMin;
//       const maxYear =
//         i18n.language === "ar"
//           ? value.yearMax.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
//           : value.yearMax;
//       return `${minYear} - ${maxYear}`;
//     } else if (value.yearMin) {
//       const minYear =
//         i18n.language === "ar"
//           ? value.yearMin.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
//           : value.yearMin;
//       return `${minYear}+`;
//     } else if (value.yearMax) {
//       const maxYear =
//         i18n.language === "ar"
//           ? value.yearMax.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
//           : value.yearMax;
//       return `≤${maxYear}`;
//     }
//     return t("year");
//   };

//   // Format price range for display
//   const getPriceRangeText = () => {
//     if (value.priceMin && value.priceMax) {
//       const minPrice =
//         i18n.language === "ar"
//           ? Number.parseInt(value.priceMin).toLocaleString("ar-EG")
//           : Number.parseInt(value.priceMin).toLocaleString();
//       const maxPrice =
//         i18n.language === "ar"
//           ? Number.parseInt(value.priceMax).toLocaleString("ar-EG")
//           : Number.parseInt(value.priceMax).toLocaleString();
//       return `$${minPrice} - $${maxPrice}`;
//     } else if (value.priceMin) {
//       const minPrice =
//         i18n.language === "ar"
//           ? Number.parseInt(value.priceMin).toLocaleString("ar-EG")
//           : Number.parseInt(value.priceMin).toLocaleString();
//       return `$${minPrice}+`;
//     } else if (value.priceMax) {
//       const maxPrice =
//         i18n.language === "ar"
//           ? Number.parseInt(value.priceMax).toLocaleString("ar-EG")
//           : Number.parseInt(value.priceMax).toLocaleString();
//       return `≤$${maxPrice}`;
//     }
//     return t("price");
//   };

//   // Format kilometer range for display
//   const getKilometerRangeText = () => {
//     if (value.kilometerMin && value.kilometerMax) {
//       const minKm =
//         i18n.language === "ar"
//           ? Number.parseInt(value.kilometerMin).toLocaleString("ar-EG")
//           : Number.parseInt(value.kilometerMin).toLocaleString();
//       const maxKm =
//         i18n.language === "ar"
//           ? Number.parseInt(value.kilometerMax).toLocaleString("ar-EG")
//           : Number.parseInt(value.kilometerMax).toLocaleString();
//       return `${minKm} - ${maxKm} ${i18n.language === "ar" ? "كم" : "km"}`;
//     } else if (value.kilometerMin) {
//       const minKm =
//         i18n.language === "ar"
//           ? Number.parseInt(value.kilometerMin).toLocaleString("ar-EG")
//           : Number.parseInt(value.kilometerMin).toLocaleString();
//       return `${minKm}+ ${i18n.language === "ar" ? "كم" : "km"}`;
//     } else if (value.kilometerMax) {
//       const maxKm =
//         i18n.language === "ar"
//           ? Number.parseInt(value.kilometerMax).toLocaleString("ar-EG")
//           : Number.parseInt(value.kilometerMax).toLocaleString();
//       return `≤${maxKm} ${i18n.language === "ar" ? "كم" : "km"}`;
//     }
//     return t("kilometer");
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
//           {/* Filters Button - Opens Comprehensive Modal */}
//           <TouchableOpacity
//             style={styles.filtersButton}
//             onPress={() => setComprehensiveFilterVisible(true)}
//             activeOpacity={0.7}
//           >
//             <View style={styles.filterIconContainer}>
//               <Ionicons name="options" size={18} color="#B80200" />
//               {activeFilterCount > 0 && (
//                 <View style={styles.filterBadge}>
//                   <Text style={styles.filterBadgeText}>
//                     {activeFilterCount}
//                   </Text>
//                 </View>
//               )}
//             </View>
//             <Text style={[styles.filtersText, rtlStyle]}>{t("filters")}</Text>
//           </TouchableOpacity>

//           {/* Make Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.make ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("make")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("make")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Model Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               !value.make && styles.pillButtonDisabled,
//               value.model ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => {
//               if (value.make) {
//                 openBottomSheet("model");
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
//               {getFilterValue("model")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color={!value.make ? "#ccc" : "#666"}
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Location Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               Array.isArray(value.location) && value.location.length > 0
//                 ? styles.pillButtonActive
//                 : null, // Updated active check
//             ]}
//             onPress={() => openBottomSheet("location")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("location")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Year Range Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.yearMin || value.yearMax ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => setYearFilterVisible(true)}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getYearRangeText()}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Price Range Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.priceMin || value.priceMax ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => setPriceFilterVisible(true)}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getPriceRangeText()}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Kilometer Range Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.kilometerMin || value.kilometerMax
//                 ? styles.pillButtonActive
//                 : null,
//             ]}
//             onPress={() => setKilometerFilterVisible(true)}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getKilometerRangeText()}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Cylinder Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.cylinder ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("cylinder")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("cylinder")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Transmission Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.transmission ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("transmission")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("transmission")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Fuel Type Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.fuelType ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("fuelType")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("fuelType")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Exterior Color Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.exteriorColor ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("exteriorColor")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("exteriorColor")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Interior Color Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.interiorColor ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("interiorColor")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("interiorColor")}
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

//       {/* Comprehensive Filter Modal */}
//       <ComprehensiveFilterModal
//         visible={comprehensiveFilterVisible}
//         onClose={() => setComprehensiveFilterVisible(false)}
//         value={value}
//         onChange={onChange}
//       />

//       {/* Bottom Sheet Modal for individual filters */}
//       <Modal
//         visible={bottomSheetVisible}
//         transparent={true}
//         animationType="none"
//         onRequestClose={closeBottomSheet}
//       >
//         <TouchableWithoutFeedback onPress={closeBottomSheet}>
//           <View style={styles.modalOverlay}>
//             <TouchableWithoutFeedback>
//               <Animated.View
//                 style={[
//                   styles.bottomSheetContainer,
//                   { height: bottomSheetHeight },
//                 ]}
//               >
//                 <View style={styles.bottomSheetHeader}>
//                   <Text style={styles.bottomSheetTitle}>
//                     {getFilterTitle()}
//                   </Text>
//                   <TouchableOpacity onPress={closeBottomSheet}>
//                     <Ionicons name="close" size={24} color="#333" />
//                   </TouchableOpacity>
//                 </View>

//                 <View style={styles.searchInputContainer}>
//                   <Ionicons
//                     name="search"
//                     size={18}
//                     color="#B80200"
//                     style={styles.searchIcon}
//                   />
//                   <TextInput
//                     style={[styles.searchInput, rtlStyle]}
//                     value={searchQuery}
//                     onChangeText={handleSearchChange}
//                     placeholder={t("Search")}
//                     placeholderTextColor="#666"
//                     autoFocus={true}
//                   />
//                 </View>

//                 <FlatList
//                   data={getBottomSheetData()}
//                   keyExtractor={(item, index) => `${activeFilter}-${index}`}
//                   renderItem={renderBottomSheetItem}
//                   style={styles.bottomSheetList}
//                   showsVerticalScrollIndicator={true}
//                   ListEmptyComponent={() => (
//                     <View style={styles.noResultsContainer}>
//                       <Text style={styles.noResults}>
//                         {t("noResultsFound")}
//                       </Text>
//                     </View>
//                   )}
//                 />
//               </Animated.View>
//             </TouchableWithoutFeedback>
//           </View>
//         </TouchableWithoutFeedback>
//       </Modal>

//       {/* Range Filter Modals */}
//       <YearFilterModal
//         visible={yearFilterVisible}
//         onClose={() => setYearFilterVisible(false)}
//         yearMin={value.yearMin}
//         yearMax={value.yearMax}
//         onApply={handleYearFilter}
//       />

//       <PriceFilterModal
//         visible={priceFilterVisible}
//         onClose={() => setPriceFilterVisible(false)}
//         priceMin={value.priceMin}
//         priceMax={value.priceMax}
//         onApply={handlePriceFilter}
//       />

//       <KilometerFilterModal
//         visible={kilometerFilterVisible}
//         onClose={() => setKilometerFilterVisible(false)}
//         kilometerMin={value.kilometerMin}
//         kilometerMax={value.kilometerMax}
//         onApply={handleKilometerFilter}
//       />
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
//     position: "relative",
//   },
//   filterBadge: {
//     position: "absolute",
//     top: -8,
//     right: -8,
//     backgroundColor: "#b80200",
//     borderRadius: 10,
//     width: 16,
//     height: 16,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   filterBadgeText: {
//     color: "#ffffff",
//     fontSize: 10,
//     fontWeight: "bold",
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
//     paddingRight: 16,
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
//   },
//   pillButtonTextDisabled: {
//     color: "#aaa",
//   },
//   chevronIcon: {
//     marginLeft: 8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "flex-end",
//   },
//   bottomSheetContainer: {
//     backgroundColor: "#ffffff",
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingBottom: 20,
//   },
//   bottomSheetHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   bottomSheetTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//   },
//   searchInputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     margin: 12,
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
//   bottomSheetList: {
//     flex: 1,
//   },
//   bottomSheetItem: {
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f5f5f5",
//   },
//   bottomSheetItemText: {
//     fontSize: 16,
//     color: "#333",
//   },
//   noResultsContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 30,
//   },
//   noResults: {
//     fontSize: Math.max(13, 1),
//     color: "#666",
//     fontStyle: "italic",
//   },
// });
//-----------------------------------------------------------------------------------------//

// import { arabicMakes, locations, makes } from "@/utils/constants";
// import { Ionicons } from "@expo/vector-icons";
// import { useEffect, useRef, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   Animated,
//   Dimensions,
//   FlatList,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   View,
// } from "react-native";
// import { useRTL } from "../hooks/useRTL";
// import ComprehensiveFilterModal from "./ComprehensiveFilterModal";
// import {
//   KilometerFilterModal,
//   PriceFilterModal,
//   YearFilterModal,
// } from "./FilterBottomSheet";

// interface SearchValue {
//   make: string;
//   model: string;
//   location: string;
//   cylinder: string;
//   transmission: string;
//   fuelType: string;
//   exteriorColor: string;
//   interiorColor: string;
//   priceMin: string;
//   priceMax: string;
//   yearMin: string;
//   yearMax: string;
//   kilometerMin: string;
//   kilometerMax: string;
// }

// interface InlineSearchBarProps {
//   value: SearchValue;
//   onChange: (value: SearchValue) => void;
//   placeholder?: string;
// }

// export default function InlineSearchBar({
//   value,
//   onChange,
//   placeholder,
// }: InlineSearchBarProps) {
//   const { t, i18n } = useTranslation();
//   const { rtlViewStyle, rtlStyle } = useRTL();
//   const [selectedMakeData, setSelectedMakeData] = useState<any | null>(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
//   const [activeFilter, setActiveFilter] = useState<string | null>(null);

//   // Comprehensive filter modal state
//   const [comprehensiveFilterVisible, setComprehensiveFilterVisible] =
//     useState(false);

//   // Separate modal states for individual filters
//   const [yearFilterVisible, setYearFilterVisible] = useState(false);
//   const [priceFilterVisible, setPriceFilterVisible] = useState(false);
//   const [kilometerFilterVisible, setKilometerFilterVisible] = useState(false);

//   const bottomSheetAnim = useRef(new Animated.Value(0)).current;
//   const { height } = Dimensions.get("window");

//   const currentMakesData = i18n.language === "ar" ? arabicMakes : makes;
//   const currentLocationsData = locations.map((loc) =>
//     i18n.language === "ar"
//       ? { ...loc, label: loc.arValue }
//       : { ...loc, label: loc.label }
//   );

//   // Filter options
//   const cylinderOptions = [
//     t("All"),
//     t("1"),
//     t("2"),
//     t("4"),
//     t("6"),
//     t("8"),
//     t("Other"),
//   ];
//   const transmissionOptions = [t("All"), t("Automatic"), t("Manual")];
//   const fuelTypeOptions = [
//     t("All"),
//     t("Petrol"),
//     t("Diesel"),
//     t("Electric"),
//     t("Hybrid"),
//   ];
//   const colorOptions = [
//     t("All"),
//     t("Black"),
//     t("White"),
//     t("Red"),
//     t("Blue"),
//     t("Silver"),
//     t("Gray"),
//     t("Green"),
//     t("Brown"),
//     t("Yellow"),
//     t("Orange"),
//     t("Purple"),
//     t("Gold"),
//     t("Other"),
//   ];

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
//     if (bottomSheetVisible) {
//       Animated.timing(bottomSheetAnim, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: false,
//       }).start();
//     } else {
//       Animated.timing(bottomSheetAnim, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: false,
//       }).start();
//     }
//   }, [bottomSheetVisible]);

//   const handleSelectMake = (make: string) => {
//     const selectedMake = currentMakesData.find(
//       (m) => m.label === make || m.value === make
//     );
//     onChange({
//       ...value,
//       make: selectedMake ? selectedMake.value : make === t("All") ? "" : make,
//       model: "",
//     });
//     setSelectedMakeData(selectedMake || null);
//     closeBottomSheet();
//   };

//   const handleSelectModel = (model: string) => {
//     onChange({
//       ...value,
//       model: model === t("All") ? "" : model,
//     });
//     closeBottomSheet();
//   };

//   const handleSelectLocation = (location: string) => {
//     const selectedLocation = currentLocationsData.find(
//       (loc) => loc.label === location
//     );
//     onChange({
//       ...value,
//       location: selectedLocation
//         ? selectedLocation.value
//         : location === t("All")
//         ? ""
//         : location,
//     });
//     closeBottomSheet();
//   };

//   const handleSelectCylinder = (cylinder: string) => {
//     onChange({
//       ...value,
//       cylinder: cylinder === t("All") ? "" : cylinder,
//     });
//     closeBottomSheet();
//   };

//   const handleSelectTransmission = (transmission: string) => {
//     onChange({
//       ...value,
//       transmission: transmission === t("All") ? "" : transmission,
//     });
//     closeBottomSheet();
//   };

//   const handleSelectFuelType = (fuelType: string) => {
//     onChange({
//       ...value,
//       fuelType: fuelType === t("All") ? "" : fuelType,
//     });
//     closeBottomSheet();
//   };

//   const handleSelectExteriorColor = (color: string) => {
//     onChange({
//       ...value,
//       exteriorColor: color === t("All") ? "" : color,
//     });
//     closeBottomSheet();
//   };

//   const handleSelectInteriorColor = (color: string) => {
//     onChange({
//       ...value,
//       interiorColor: color === t("All") ? "" : color,
//     });
//     closeBottomSheet();
//   };

//   // Range filter handlers
//   const handleYearFilter = (yearMin: string, yearMax: string) => {
//     onChange({
//       ...value,
//       yearMin,
//       yearMax,
//     });
//   };

//   const handlePriceFilter = (priceMin: string, priceMax: string) => {
//     onChange({
//       ...value,
//       priceMin,
//       priceMax,
//     });
//   };

//   const handleKilometerFilter = (
//     kilometerMin: string,
//     kilometerMax: string
//   ) => {
//     onChange({
//       ...value,
//       kilometerMin,
//       kilometerMax,
//     });
//   };

//   const handleSearchChange = (text: string) => {
//     setSearchQuery(text);
//   };

//   const openBottomSheet = (filter: string) => {
//     setActiveFilter(filter);
//     setSearchQuery("");
//     setBottomSheetVisible(true);
//   };

//   const closeBottomSheet = () => {
//     setBottomSheetVisible(false);
//     setActiveFilter(null);
//     setSearchQuery("");
//   };

//   const renderBottomSheetItem = ({ item }: { item: string }) => (
//     <TouchableOpacity
//       style={styles.bottomSheetItem}
//       onPress={() => {
//         switch (activeFilter) {
//           case "make":
//             handleSelectMake(item);
//             break;
//           case "model":
//             handleSelectModel(item);
//             break;
//           case "location":
//             handleSelectLocation(item);
//             break;
//           case "cylinder":
//             handleSelectCylinder(item);
//             break;
//           case "transmission":
//             handleSelectTransmission(item);
//             break;
//           case "fuelType":
//             handleSelectFuelType(item);
//             break;
//           case "exteriorColor":
//             handleSelectExteriorColor(item);
//             break;
//           case "interiorColor":
//             handleSelectInteriorColor(item);
//             break;
//           default:
//             break;
//         }
//       }}
//       activeOpacity={0.7}
//     >
//       <Text style={[styles.bottomSheetItemText, rtlStyle]}>{item}</Text>
//     </TouchableOpacity>
//   );

//   const getBottomSheetData = () => {
//     switch (activeFilter) {
//       case "make":
//         const filteredMakes = currentMakesData
//           .map((make) => make.label)
//           .filter((label) =>
//             label.toLowerCase().includes(searchQuery.toLowerCase())
//           );
//         return [t("All"), ...filteredMakes];
//       case "model":
//         if (!selectedMakeData) return [t("All")];
//         const filteredModels = (selectedMakeData.models || []).filter(
//           (model: string) =>
//             model.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//         return [t("All"), ...filteredModels];
//       case "location":
//         const filteredLocations = currentLocationsData
//           .map((loc) => loc.label)
//           .filter((label) =>
//             label.toLowerCase().includes(searchQuery.toLowerCase())
//           );
//         return [t("All"), ...filteredLocations];
//       case "cylinder":
//         return cylinderOptions.filter((option) =>
//           option.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//       case "transmission":
//         return transmissionOptions.filter((option) =>
//           option.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//       case "fuelType":
//         return fuelTypeOptions.filter((option) =>
//           option.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//       case "exteriorColor":
//       case "interiorColor":
//         return colorOptions.filter((option) =>
//           option.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//       default:
//         return [];
//     }
//   };

//   const getFilterTitle = () => {
//     switch (activeFilter) {
//       case "make":
//         return t("Select Make");
//       case "model":
//         return t("Select Model");
//       case "location":
//         return t("Select Location");
//       case "cylinder":
//         return t("Select Cylinder");
//       case "transmission":
//         return t("Select Transmission");
//       case "fuelType":
//         return t("Select Fuel Type");
//       case "exteriorColor":
//         return t("Select Exterior Color");
//       case "interiorColor":
//         return t("Select Interior Color");
//       default:
//         return "";
//     }
//   };

//   const getFilterValue = (filterName: string) => {
//     switch (filterName) {
//       case "make":
//         return value.make
//           ? currentMakesData.find((m) => m.value === value.make)?.label ||
//               value.make
//           : t("make");
//       case "model":
//         return value.model || t("model");
//       case "location":
//         return value.location
//           ? currentLocationsData.find((loc) => loc.value === value.location)
//               ?.label || value.location
//           : t("location");
//       case "cylinder":
//         return value.cylinder || t("cylinder");
//       case "transmission":
//         return value.transmission || t("transmission");
//       case "fuelType":
//         return value.fuelType || t("fuel");
//       case "exteriorColor":
//         return value.exteriorColor || t("ext. color");
//       case "interiorColor":
//         return value.interiorColor || t("int. color");
//       default:
//         return "";
//     }
//   };

//   // Get active filter count
//   const getActiveFilterCount = () => {
//     let count = 0;
//     if (value.make) count++;
//     if (value.model) count++;
//     if (value.location) count++;
//     if (value.cylinder) count++;
//     if (value.transmission) count++;
//     if (value.fuelType) count++;
//     if (value.exteriorColor) count++;
//     if (value.interiorColor) count++;
//     if (value.yearMin || value.yearMax) count++;
//     if (value.priceMin || value.priceMax) count++;
//     if (value.kilometerMin || value.kilometerMax) count++;
//     return count;
//   };

//   const activeFilterCount = getActiveFilterCount();

//   const bottomSheetHeight = bottomSheetAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, height * 0.7],
//   });

//   // Format year range for display
//   const getYearRangeText = () => {
//     if (value.yearMin && value.yearMax) {
//       const minYear =
//         i18n.language === "ar"
//           ? value.yearMin.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
//           : value.yearMin;
//       const maxYear =
//         i18n.language === "ar"
//           ? value.yearMax.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
//           : value.yearMax;
//       return `${minYear} - ${maxYear}`;
//     } else if (value.yearMin) {
//       const minYear =
//         i18n.language === "ar"
//           ? value.yearMin.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
//           : value.yearMin;
//       return `${minYear}+`;
//     } else if (value.yearMax) {
//       const maxYear =
//         i18n.language === "ar"
//           ? value.yearMax.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])
//           : value.yearMax;
//       return `≤${maxYear}`;
//     }
//     return t("year");
//   };

//   // Format price range for display
//   const getPriceRangeText = () => {
//     if (value.priceMin && value.priceMax) {
//       const minPrice =
//         i18n.language === "ar"
//           ? Number.parseInt(value.priceMin).toLocaleString("ar-EG")
//           : Number.parseInt(value.priceMin).toLocaleString();
//       const maxPrice =
//         i18n.language === "ar"
//           ? Number.parseInt(value.priceMax).toLocaleString("ar-EG")
//           : Number.parseInt(value.priceMax).toLocaleString();
//       return `$${minPrice} - $${maxPrice}`;
//     } else if (value.priceMin) {
//       const minPrice =
//         i18n.language === "ar"
//           ? Number.parseInt(value.priceMin).toLocaleString("ar-EG")
//           : Number.parseInt(value.priceMin).toLocaleString();
//       return `$${minPrice}+`;
//     } else if (value.priceMax) {
//       const maxPrice =
//         i18n.language === "ar"
//           ? Number.parseInt(value.priceMax).toLocaleString("ar-EG")
//           : Number.parseInt(value.priceMax).toLocaleString();
//       return `≤$${maxPrice}`;
//     }
//     return t("price");
//   };

//   // Format kilometer range for display
//   const getKilometerRangeText = () => {
//     if (value.kilometerMin && value.kilometerMax) {
//       const minKm =
//         i18n.language === "ar"
//           ? Number.parseInt(value.kilometerMin).toLocaleString("ar-EG")
//           : Number.parseInt(value.kilometerMin).toLocaleString();
//       const maxKm =
//         i18n.language === "ar"
//           ? Number.parseInt(value.kilometerMax).toLocaleString("ar-EG")
//           : Number.parseInt(value.kilometerMax).toLocaleString();
//       return `${minKm} - ${maxKm} ${i18n.language === "ar" ? "كم" : "km"}`;
//     } else if (value.kilometerMin) {
//       const minKm =
//         i18n.language === "ar"
//           ? Number.parseInt(value.kilometerMin).toLocaleString("ar-EG")
//           : Number.parseInt(value.kilometerMin).toLocaleString();
//       return `${minKm}+ ${i18n.language === "ar" ? "كم" : "km"}`;
//     } else if (value.kilometerMax) {
//       const maxKm =
//         i18n.language === "ar"
//           ? Number.parseInt(value.kilometerMax).toLocaleString("ar-EG")
//           : Number.parseInt(value.kilometerMax).toLocaleString();
//       return `≤${maxKm} ${i18n.language === "ar" ? "كم" : "km"}`;
//     }
//     return t("km");
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
//           {/* Filters Button - Opens Comprehensive Modal */}
//           <TouchableOpacity
//             style={styles.filtersButton}
//             onPress={() => setComprehensiveFilterVisible(true)}
//             activeOpacity={0.7}
//           >
//             <View style={styles.filterIconContainer}>
//               <Ionicons name="options" size={18} color="#B80200" />
//               {activeFilterCount > 0 && (
//                 <View style={styles.filterBadge}>
//                   <Text style={styles.filterBadgeText}>
//                     {activeFilterCount}
//                   </Text>
//                 </View>
//               )}
//             </View>
//             <Text style={[styles.filtersText, rtlStyle]}>{t("filters")}</Text>
//           </TouchableOpacity>

//           {/* Make Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.make ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("make")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("make")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Model Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               !value.make && styles.pillButtonDisabled,
//               value.model ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => {
//               if (value.make) {
//                 openBottomSheet("model");
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
//               {getFilterValue("model")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color={!value.make ? "#ccc" : "#666"}
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Location Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.location ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("location")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("location")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Year Range Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.yearMin || value.yearMax ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => setYearFilterVisible(true)}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getYearRangeText()}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Price Range Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.priceMin || value.priceMax ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => setPriceFilterVisible(true)}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getPriceRangeText()}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Kilometer Range Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.kilometerMin || value.kilometerMax
//                 ? styles.pillButtonActive
//                 : null,
//             ]}
//             onPress={() => setKilometerFilterVisible(true)}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getKilometerRangeText()}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Cylinder Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.cylinder ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("cylinder")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("cylinder")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Transmission Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.transmission ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("transmission")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("transmission")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Fuel Type Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.fuelType ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("fuelType")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("fuelType")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Exterior Color Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.exteriorColor ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("exteriorColor")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("exteriorColor")}
//             </Text>
//             <Ionicons
//               name="chevron-down"
//               size={16}
//               color="#666"
//               style={styles.chevronIcon}
//             />
//           </TouchableOpacity>

//           {/* Interior Color Filter */}
//           <TouchableOpacity
//             style={[
//               styles.pillButton,
//               value.interiorColor ? styles.pillButtonActive : null,
//             ]}
//             onPress={() => openBottomSheet("interiorColor")}
//             activeOpacity={0.8}
//           >
//             <Text style={[styles.pillButtonText, rtlStyle]}>
//               {getFilterValue("interiorColor")}
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

//       {/* Comprehensive Filter Modal */}
//       <ComprehensiveFilterModal
//         visible={comprehensiveFilterVisible}
//         onClose={() => setComprehensiveFilterVisible(false)}
//         value={value}
//         onChange={onChange}
//       />

//       {/* Bottom Sheet Modal for individual filters */}
//       <Modal
//         visible={bottomSheetVisible}
//         transparent={true}
//         animationType="none"
//         onRequestClose={closeBottomSheet}
//       >
//         <TouchableWithoutFeedback onPress={closeBottomSheet}>
//           <View style={styles.modalOverlay}>
//             <TouchableWithoutFeedback>
//               <Animated.View
//                 style={[
//                   styles.bottomSheetContainer,
//                   { height: bottomSheetHeight },
//                 ]}
//               >
//                 <View style={styles.bottomSheetHeader}>
//                   <Text style={styles.bottomSheetTitle}>
//                     {getFilterTitle()}
//                   </Text>
//                   <TouchableOpacity onPress={closeBottomSheet}>
//                     <Ionicons name="close" size={24} color="#333" />
//                   </TouchableOpacity>
//                 </View>

//                 <View style={styles.searchInputContainer}>
//                   <Ionicons
//                     name="search"
//                     size={18}
//                     color="#B80200"
//                     style={styles.searchIcon}
//                   />
//                   <TextInput
//                     style={[styles.searchInput, rtlStyle]}
//                     value={searchQuery}
//                     onChangeText={handleSearchChange}
//                     placeholder={t("Search")}
//                     placeholderTextColor="#666"
//                     autoFocus={true}
//                   />
//                 </View>

//                 <FlatList
//                   data={getBottomSheetData()}
//                   keyExtractor={(item, index) => `${activeFilter}-${index}`}
//                   renderItem={renderBottomSheetItem}
//                   style={styles.bottomSheetList}
//                   showsVerticalScrollIndicator={true}
//                   ListEmptyComponent={() => (
//                     <View style={styles.noResultsContainer}>
//                       <Text style={styles.noResults}>
//                         {t("noResultsFound")}
//                       </Text>
//                     </View>
//                   )}
//                 />
//               </Animated.View>
//             </TouchableWithoutFeedback>
//           </View>
//         </TouchableWithoutFeedback>
//       </Modal>

//       {/* Range Filter Modals */}
//       <YearFilterModal
//         visible={yearFilterVisible}
//         onClose={() => setYearFilterVisible(false)}
//         yearMin={value.yearMin}
//         yearMax={value.yearMax}
//         onApply={handleYearFilter}
//       />

//       <PriceFilterModal
//         visible={priceFilterVisible}
//         onClose={() => setPriceFilterVisible(false)}
//         priceMin={value.priceMin}
//         priceMax={value.priceMax}
//         onApply={handlePriceFilter}
//       />

//       <KilometerFilterModal
//         visible={kilometerFilterVisible}
//         onClose={() => setKilometerFilterVisible(false)}
//         kilometerMin={value.kilometerMin}
//         kilometerMax={value.kilometerMax}
//         onApply={handleKilometerFilter}
//       />
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
//     position: "relative",
//   },
//   filterBadge: {
//     position: "absolute",
//     top: -8,
//     right: -8,
//     backgroundColor: "#b80200",
//     borderRadius: 10,
//     width: 16,
//     height: 16,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   filterBadgeText: {
//     color: "#ffffff",
//     fontSize: 10,
//     fontWeight: "bold",
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
//     paddingRight: 16,
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
//   },
//   pillButtonTextDisabled: {
//     color: "#aaa",
//   },
//   chevronIcon: {
//     marginLeft: 8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "flex-end",
//   },
//   bottomSheetContainer: {
//     backgroundColor: "#ffffff",
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingBottom: 20,
//   },
//   bottomSheetHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   bottomSheetTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//   },
//   searchInputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     margin: 12,
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
//   bottomSheetList: {
//     flex: 1,
//   },
//   bottomSheetItem: {
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f5f5f5",
//   },
//   bottomSheetItemText: {
//     fontSize: 16,
//     color: "#333",
//   },
//   noResultsContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 30,
//   },
//   noResults: {
//     fontSize: Math.max(13, 1),
//     color: "#666",
//     fontStyle: "italic",
//   },
// });
