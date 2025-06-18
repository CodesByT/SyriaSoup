"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions } from "react-native";
import { useRTL } from "../hooks/useRTL";
import { arabicMakes, locations, makes } from "../utils/constants";

import FilterModal from "./FilterModal";

const { width, height } = Dimensions.get("window");

interface FilterOption {
  id: string;
  label: string;
  value: any;
}

interface FilterSection {
  id: string;
  title: string;
  type: "single" | "multiple" | "range" | "search";
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

interface SearchValue {
  make?: string;
  model?: string;
  location?: string[];
  cylinder?: string;
  transmission?: string;
  fuelType?: string;
  exteriorColor?: string;
  interiorColor?: string;
  priceMin?: string;
  priceMax?: string;
  yearMin?: string;
  yearMax?: string;
  kilometerMin?: string;
  kilometerMax?: string;
}

export default function ComprehensiveFilterModal({
  visible,
  onClose,
  value,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  value: any;
  onChange: (value: any) => void;
}) {
  const { t, i18n } = useTranslation();
  const { rtlViewStyle, rtlStyle, getFlexDirection } = useRTL();
  const isArabic = i18n.language === "ar";

  const [localFilters, setLocalFilters] = useState<Record<string, any>>(value);

  const currentMakesData = i18n.language === "ar" ? arabicMakes : makes;
  const currentLocationsData = locations.map((loc) =>
    i18n.language === "ar"
      ? { ...loc, label: loc.arValue }
      : { ...loc, label: loc.label }
  );

  useEffect(() => {
    if (visible) {
      setLocalFilters(value);
    }
  }, [visible, value]);

  const cylinderOptions = useMemo<FilterOption[]>(
    () => [
      { id: "all_cyl", label: t("All"), value: "" },
      { id: "3_cyl", label: t("3"), value: "3" },
      { id: "4_cyl", label: t("4"), value: "4" },
      { id: "5_cyl", label: t("5"), value: "5" },
      { id: "6_cyl", label: t("6"), value: "6" },
      { id: "8_cyl", label: t("8"), value: "8" },
      { id: "other_cyl", label: t("Other"), value: "Other" },
    ],
    [t]
  );

  const transmissionOptions = useMemo<FilterOption[]>(
    () => [
      { id: "all_trans", label: t("All"), value: "" },
      { id: "auto_trans", label: t("Automatic"), value: "Automatic" },
      { id: "manual_trans", label: t("Manual"), value: "Manual" },
    ],
    [t]
  );

  const fuelTypeOptions = useMemo<FilterOption[]>(
    () => [
      { id: "all_fuel", label: t("All"), value: "" },
      { id: "petrol_fuel", label: t("Petrol"), value: "Petrol" },
      { id: "diesel_fuel", label: t("Diesel"), value: "Diesel" },
      { id: "electric_fuel", label: t("Electric"), value: "Electric" },
      { id: "hybrid_fuel", label: t("Hybrid"), value: "Hybrid" },
    ],
    [t]
  );

  const colorOptions = useMemo<FilterOption[]>(
    () => [
      { id: "all_color", label: t("All"), value: "" },
      { id: "blue_color", label: t("Blue"), value: "Blue" },
      { id: "black_color", label: t("Black"), value: "Black" },
      { id: "brown_color", label: t("Brown"), value: "Brown" },
      { id: "gold_color", label: t("Gold"), value: "Gold" },
      { id: "green_color", label: t("Green"), value: "Green" },
      { id: "red_color", label: t("Red"), value: "Red" },
      { id: "prink_color", label: t("Pink"), value: "Pink" },
      { id: "purple_color", label: t("Purple"), value: "Purple" },
      { id: "silver_color", label: t("Silver"), value: "Silver" },
      { id: "white_color", label: t("White"), value: "White" },
      { id: "other_color", label: t("Other"), value: "Other" },
    ],
    [t]
  );

  const currentYear = new Date().getFullYear();

  const baseSections = useMemo<FilterSection[]>(
    () => [
      {
        id: "make",
        title: t("make_from_car_details_screen"),
        type: "single",
        options: [
          { id: "all_make", label: t("All"), value: "" },
          ...currentMakesData.map((m: any) => ({
            id: `make_${m.value}`,
            label: m.label,
            value: m.value,
          })),
        ],
      },
      {
        id: "model",
        title: t("Model"),
        type: "single",
        options: [],
      },
      {
        id: "yearRange",
        title: t("year_for_filer"),
        type: "range",
        min: 1970,
        max: currentYear,
        step: 1,
        // No 'unit' prop here for year, as per the RangeSlider logic
      },
      {
        id: "priceRange",
        title: t("Price_for_filter"),
        type: "range",
        min: 0,
        max: 100000,
        step: 1000,
        unit: "$",
      },
      {
        id: "kilometerRange",
        title: t("Kilometers_for_filters"),
        type: "range",
        min: 0,
        max: 200000,
        step: 1000,
        unit: "km",
      },
      {
        id: "location",
        title: t("location"),
        type: "multiple",
        options: currentLocationsData.map((loc: any) => ({
          id: `loc_${loc.value}`,
          label: loc.label,
          value: loc.value,
        })),
      },
      {
        id: "cylinder",
        title: t("cylinder"),
        type: "single",
        options: cylinderOptions,
      },
      {
        id: "transmission",
        title: t("transmission"),
        type: "single",
        options: transmissionOptions,
      },
      {
        id: "fuelType",
        title: t("fuel_type"),
        type: "single",
        options: fuelTypeOptions,
      },
      {
        id: "exteriorColor",
        title: t("exterior_color"),
        type: "single",
        options: colorOptions,
      },
      {
        id: "interiorColor",
        title: t("interior_color"),
        type: "single",
        options: colorOptions,
      },
    ],
    [
      t,
      currentMakesData,
      currentLocationsData,
      currentYear,
      cylinderOptions,
      transmissionOptions,
      fuelTypeOptions,
      colorOptions,
    ]
  );

  // This function converts the external 'value' (SearchValue) into the internal 'newFilters' format for FilterModal/RangeSlider
  const convertSearchValueToFilterModalFormat = useCallback(
    (filters: SearchValue) => {
      const newFilters: Record<string, any> = {};

      if (filters.make) newFilters.make = filters.make;
      if (filters.model) newFilters.model = filters.model;
      if (filters.cylinder) newFilters.cylinder = filters.cylinder;
      if (filters.transmission) newFilters.transmission = filters.transmission;
      if (filters.fuelType) newFilters.fuelType = filters.fuelType;
      if (filters.exteriorColor)
        newFilters.exteriorColor = filters.exteriorColor;
      if (filters.interiorColor)
        newFilters.interiorColor = filters.interiorColor;

      if (filters.location && filters.location.length > 0)
        newFilters.location = filters.location;

      // Ensure yearRange always has valid numbers, defaulting to full range if not set
      const yearSectionConfig = baseSections.find((s) => s.id === "yearRange");
      if (yearSectionConfig) {
        const defaultMinYear = yearSectionConfig.min || 1970;
        const defaultMaxYear = yearSectionConfig.max || currentYear;

        newFilters.yearRange = {
          min: filters.yearMin ? parseInt(filters.yearMin) : defaultMinYear,
          max: filters.yearMax ? parseInt(filters.yearMax) : defaultMaxYear,
        };
      }

      if (filters.priceMin || filters.priceMax) {
        newFilters.priceRange = {
          min: filters.priceMin ? parseInt(filters.priceMin) : undefined,
          max: filters.priceMax ? parseInt(filters.priceMax) : undefined,
        };
      }
      if (filters.kilometerMin || filters.kilometerMax) {
        newFilters.kilometerRange = {
          min: filters.kilometerMin
            ? parseInt(filters.kilometerMin)
            : undefined,
          max: filters.kilometerMax
            ? parseInt(filters.kilometerMax)
            : undefined,
        };
      }
      return newFilters;
    },
    [baseSections, currentYear]
  );

  // This function converts the internal 'newFilters' format from FilterModal/RangeSlider back to external 'SearchValue'
  const convertFilterModalFormatToSearchValue = useCallback(
    (newFilters: Record<string, any>): SearchValue => {
      const oldFilters: SearchValue = {
        make: newFilters.make || "",
        model: newFilters.model || "",
        location: newFilters.location || [],
        cylinder: newFilters.cylinder || "",
        transmission: newFilters.transmission || "",
        fuelType: newFilters.fuelType || "",
        exteriorColor: newFilters.exteriorColor || "",
        interiorColor: newFilters.interiorColor || "",
        priceMin: newFilters.priceRange?.min?.toString() || "",
        priceMax: newFilters.priceRange?.max?.toString() || "",
        yearMin: newFilters.yearRange?.min?.toString() || "",
        yearMax: newFilters.yearRange?.max?.toString() || "",
        kilometerMin: newFilters.kilometerRange?.min?.toString() || "",
        kilometerMax: newFilters.kilometerRange?.max?.toString() || "",
      };

      // --- CRITICAL FIX: DO NOT SET yearMin/Max to empty string ---
      // This is the key. We want year to always be numbers, not "" for "All".
      // NO LOGIC HERE FOR yearMin/Max that turns them into "" if they match max range.

      const priceSection = baseSections.find((s) => s.id === "priceRange");
      if (priceSection && oldFilters.priceMin === priceSection.min?.toString())
        oldFilters.priceMin = "";
      if (priceSection && oldFilters.priceMax === priceSection.max?.toString())
        oldFilters.priceMax = "";

      const kilometerSection = baseSections.find(
        (s) => s.id === "kilometerRange"
      );
      if (
        kilometerSection &&
        oldFilters.kilometerMin === kilometerSection.min?.toString()
      )
        oldFilters.kilometerMin = "";
      if (
        kilometerSection &&
        oldFilters.kilometerMax === kilometerSection.max?.toString()
      )
        oldFilters.kilometerMax = "";

      return oldFilters;
    },
    [baseSections]
  );

  const handleApply = useCallback(
    (newFilters: Record<string, any>) => {
      const convertedFilters =
        convertFilterModalFormatToSearchValue(newFilters);
      onChange(convertedFilters);
      onClose();
    },
    [onChange, onClose, convertFilterModalFormatToSearchValue]
  );

  const initialFiltersConverted = useMemo(
    () => convertSearchValueToFilterModalFormat(value),
    [value, convertSearchValueToFilterModalFormat]
  );

  return (
    <FilterModal
      visible={visible}
      onClose={onClose}
      onApply={handleApply}
      sections={baseSections}
      initialFilters={initialFiltersConverted}
      allMakesData={currentMakesData}
    />
  );
}
//----------------------------------------------------------------------------------

// "use client";
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { useTranslation } from "react-i18next";
// import { Dimensions } from "react-native";
// import { useRTL } from "../hooks/useRTL";
// import { arabicMakes, locations, makes } from "../utils/constants"; // Ensure this path is correct

// // Import the FilterModal component
// import FilterModal from "./FilterModal";

// const { width, height } = Dimensions.get("window");

// // Define interfaces for FilterOption and FilterSection here
// // to ensure type consistency when creating the 'sections' array.
// interface FilterOption {
//   id: string;
//   label: string;
//   value: any;
// }

// interface FilterSection {
//   id: string;
//   title: string;
//   type: "single" | "multiple" | "range" | "search";
//   options?: FilterOption[];
//   min?: number;
//   max?: number;
//   step?: number;
//   unit?: string;
// }

// interface SearchValue {
//   make?: string;
//   model?: string;
//   location?: string[];
//   cylinder?: string;
//   transmission?: string;
//   fuelType?: string;
//   exteriorColor?: string;
//   interiorColor?: string;
//   priceMin?: string;
//   priceMax?: string;
//   yearMin?: string;
//   yearMax?: string;
//   kilometerMin?: string;
//   kilometerMax?: string;
// }

// // ComprehensiveFilterModal - now acts as a wrapper for the new FilterModal
// export default function ComprehensiveFilterModal({
//   visible,
//   onClose,
//   value,
//   onChange,
// }: {
//   visible: boolean;
//   onClose: () => void;
//   value: any;
//   onChange: (value: any) => void;
// }) {
//   const { t, i18n } = useTranslation();
//   const { rtlViewStyle, rtlStyle, getFlexDirection } = useRTL();
//   const isArabic = i18n.language === "ar";

//   const [localFilters, setLocalFilters] = useState<Record<string, any>>(value);

//   // Use currentMakesData and currentLocationsData as before
//   const currentMakesData = i18n.language === "ar" ? arabicMakes : makes;
//   const currentLocationsData = locations.map((loc) =>
//     i18n.language === "ar"
//       ? { ...loc, label: loc.arValue }
//       : { ...loc, label: loc.label }
//   );

//   useEffect(() => {
//     if (visible) {
//       // When modal opens, sync internal state with external value
//       setLocalFilters(value);
//     }
//   }, [visible, value]);

//   const cylinderOptions = useMemo<FilterOption[]>(
//     () => [
//       { id: "all_cyl", label: t("All"), value: "" },
//       { id: "3_cyl", label: t("3"), value: "3" },
//       { id: "4_cyl", label: t("4"), value: "4" },
//       { id: "5_cyl", label: t("5"), value: "5" },
//       { id: "6_cyl", label: t("6"), value: "6" },
//       { id: "8_cyl", label: t("8"), value: "8" },
//       { id: "other_cyl", label: t("Other"), value: "Other" },
//     ],
//     [t]
//   );

//   const transmissionOptions = useMemo<FilterOption[]>(
//     () => [
//       { id: "all_trans", label: t("All"), value: "" },
//       { id: "auto_trans", label: t("Automatic"), value: "Automatic" },
//       { id: "manual_trans", label: t("Manual"), value: "Manual" },
//     ],
//     [t]
//   );

//   const fuelTypeOptions = useMemo<FilterOption[]>(
//     () => [
//       { id: "all_fuel", label: t("All"), value: "" },
//       { id: "petrol_fuel", label: t("Petrol"), value: "Petrol" },
//       { id: "diesel_fuel", label: t("Diesel"), value: "Diesel" },
//       { id: "electric_fuel", label: t("Electric"), value: "Electric" },
//       { id: "hybrid_fuel", label: t("Hybrid"), value: "Hybrid" },
//     ],
//     [t]
//   );

//   const colorOptions = useMemo<FilterOption[]>(
//     () => [
//       { id: "all_color", label: t("All"), value: "" },
//       { id: "blue_color", label: t("Blue"), value: "Blue" },
//       { id: "beige_color", label: t("Beige"), value: "Beige" },
//       { id: "black_color", label: t("Black"), value: "Black" },
//       { id: "white_color", label: t("White"), value: "White" },
//       { id: "brown_color", label: t("Brown"), value: "Brown" },
//       { id: "red_color", label: t("Red"), value: "Red" },
//       { id: "other_color", label: t("Other"), value: "Other" },

//       // { id: "silver_color", label: t("Silver"), value: "Silver" },
//       // { id: "gray_color", label: t("Gray"), value: "Gray" },
//       // { id: "green_color", label: t("Green"), value: "Green" },
//       // { id: "yellow_color", label: t("Yellow"), value: "Yellow" },
//       // { id: "orange_color", label: t("Orange"), value: "Orange" },
//       // { id: "purple_color", label: t("Purple"), value: "Purple" },
//       // { id: "gold_color", label: t("Gold"), value: "Gold" },
//     ],
//     [t]
//   );

//   const currentYear = new Date().getFullYear();

//   // Define the base sections array here
//   const baseSections = useMemo<FilterSection[]>(
//     () => [
//       {
//         id: "make",
//         title: t("make"),
//         type: "single",
//         options: [
//           { id: "all_make", label: t("All"), value: "" },
//           ...currentMakesData.map((m: any) => ({
//             id: `make_${m.value}`,
//             label: m.label,
//             value: m.value,
//           })),
//         ],
//       },
//       {
//         id: "model",
//         title: t("Model"),
//         type: "single",
//         // Options will be dynamically populated by FilterModal based on selected make
//         options: [], // Initially empty, FilterModal will fill this
//       },
//       {
//         id: "yearRange",
//         title: t("year"),
//         type: "range",
//         min: 1970,
//         max: currentYear,
//         step: 1,
//       },
//       {
//         id: "priceRange",
//         title: t("Price_for_filter"),
//         type: "range",
//         min: 0,
//         max: 100000,
//         step: 1000,
//         unit: "$",
//       },
//       {
//         id: "kilometerRange",
//         title: t("Kilometers_for_filters"),
//         type: "range",
//         min: 0,
//         max: 200000,
//         step: 1000,
//         unit: t("km"),
//       },
//       {
//         id: "location",
//         title: t("location"),
//         type: "multiple",
//         options: currentLocationsData.map((loc: any) => ({
//           id: `loc_${loc.value}`,
//           label: loc.label,
//           value: loc.value,
//         })),
//       },
//       {
//         id: "cylinder",
//         title: t("cylinder"),
//         type: "single",
//         options: cylinderOptions,
//       },
//       {
//         id: "transmission",
//         title: t("transmission"),
//         type: "single",
//         options: transmissionOptions,
//       },
//       {
//         id: "fuelType",
//         title: t("fuel_type"),
//         type: "single",
//         options: fuelTypeOptions,
//       },
//       {
//         id: "exteriorColor",
//         title: t("exterior_color"),
//         type: "single",
//         options: colorOptions,
//       },
//       {
//         id: "interiorColor",
//         title: t("interior_color"),
//         type: "single",
//         options: colorOptions,
//       },
//     ],
//     [
//       t,
//       currentMakesData,
//       currentLocationsData,
//       currentYear,
//       cylinderOptions,
//       transmissionOptions,
//       fuelTypeOptions,
//       colorOptions,
//     ]
//   );

//   const convertLocalFiltersToNewFormat = useCallback((filters: SearchValue) => {
//     const newFilters: Record<string, any> = {};

//     if (filters.make) newFilters.make = filters.make;
//     if (filters.model) newFilters.model = filters.model;
//     if (filters.cylinder) newFilters.cylinder = filters.cylinder;
//     if (filters.transmission) newFilters.transmission = filters.transmission;
//     if (filters.fuelType) newFilters.fuelType = filters.fuelType;
//     if (filters.exteriorColor) newFilters.exteriorColor = filters.exteriorColor;
//     if (filters.interiorColor) newFilters.interiorColor = filters.interiorColor;

//     if (filters.location && filters.location.length > 0)
//       newFilters.location = filters.location;

//     if (filters.yearMin || filters.yearMax) {
//       newFilters.yearRange = {
//         min: filters.yearMin ? parseInt(filters.yearMin) : undefined,
//         max: filters.yearMax ? parseInt(filters.yearMax) : undefined,
//       };
//     }
//     if (filters.priceMin || filters.priceMax) {
//       newFilters.priceRange = {
//         min: filters.priceMin ? parseInt(filters.priceMin) : undefined,
//         max: filters.priceMax ? parseInt(filters.priceMax) : undefined,
//       };
//     }
//     if (filters.kilometerMin || filters.kilometerMax) {
//       newFilters.kilometerRange = {
//         min: filters.kilometerMin ? parseInt(filters.kilometerMin) : undefined,
//         max: filters.kilometerMax ? parseInt(filters.kilometerMax) : undefined,
//       };
//     }
//     return newFilters;
//   }, []);

//   const convertNewFiltersToLocalFormat = useCallback(
//     (newFilters: Record<string, any>): SearchValue => {
//       const oldFilters: SearchValue = {
//         make: newFilters.make || "",
//         model: newFilters.model || "",
//         location: newFilters.location || [],
//         cylinder: newFilters.cylinder || "",
//         transmission: newFilters.transmission || "",
//         fuelType: newFilters.fuelType || "",
//         exteriorColor: newFilters.exteriorColor || "",
//         interiorColor: newFilters.interiorColor || "",
//         priceMin: newFilters.priceRange?.min?.toString() || "",
//         priceMax: newFilters.priceRange?.max?.toString() || "",
//         yearMin: newFilters.yearRange?.min?.toString() || "",
//         yearMax: newFilters.yearRange?.max?.toString() || "",
//         kilometerMin: newFilters.kilometerRange?.min?.toString() || "",
//         kilometerMax: newFilters.kilometerRange?.max?.toString() || "",
//       };

//       // Apply default value conditions for clearing filters if they match initial range values
//       // Find the specific section from baseSections to get its min/max
//       const yearSection = baseSections.find((s) => s.id === "yearRange");
//       if (yearSection && oldFilters.yearMin === yearSection.min?.toString())
//         oldFilters.yearMin = "1970";
//       if (yearSection && oldFilters.yearMax === yearSection.max?.toString())
//         oldFilters.yearMax = "";

//       const priceSection = baseSections.find((s) => s.id === "priceRange");
//       if (priceSection && oldFilters.priceMin === priceSection.min?.toString())
//         oldFilters.priceMin = "";
//       if (priceSection && oldFilters.priceMax === priceSection.max?.toString())
//         oldFilters.priceMax = "";

//       const kilometerSection = baseSections.find(
//         (s) => s.id === "kilometerRange"
//       );
//       if (
//         kilometerSection &&
//         oldFilters.kilometerMin === kilometerSection.min?.toString()
//       )
//         oldFilters.kilometerMin = "";
//       if (
//         kilometerSection &&
//         oldFilters.kilometerMax === kilometerSection.max?.toString()
//       )
//         oldFilters.kilometerMax = "";

//       return oldFilters;
//     },
//     [baseSections] // Depend on baseSections to get min/max
//   );

//   const handleApply = useCallback(
//     (newFilters: Record<string, any>) => {
//       const convertedFilters = convertNewFiltersToLocalFormat(newFilters);
//       onChange(convertedFilters);
//       onClose();
//     },
//     [onChange, onClose, convertNewFiltersToLocalFormat]
//   );

//   const initialFiltersConverted = useMemo(
//     () => convertLocalFiltersToNewFormat(value),
//     [value, convertLocalFiltersToNewFormat]
//   );

//   return (
//     <FilterModal
//       visible={visible}
//       onClose={onClose}
//       onApply={handleApply}
//       sections={baseSections} // Pass the base sections
//       initialFilters={initialFiltersConverted}
//       allMakesData={currentMakesData} // Pass all makes data for dynamic model loading
//     />
//   );
// }
//---------------------------------------------------------------------------------------------
// "use client";
// import { useTranslation } from "react-i18next";

// import { Ionicons } from "@expo/vector-icons";
// import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
// import {
//   Dimensions,
//   FlatList,
//   Modal, // Keep PanResponder if you need it for other gestures in the modal, otherwise it can be removed
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useRTL } from "../hooks/useRTL";
// import { arabicMakes, locations, makes } from "../utils/constants";

// // Import the RangeSlider component
// import RangeSlider from "./RangeSlider"; // Adjust the path as per your project structure

// const { width, height } = Dimensions.get("window");

// // Define interfaces for the new FilterModal structure
// interface FilterOption {
//   id: string;
//   label: string;
//   value: any;
// }

// interface FilterSection {
//   id: string;
//   title: string;
//   type: "single" | "multiple" | "range" | "search";
//   options?: FilterOption[];
//   min?: number;
//   max?: number;
//   step?: number;
//   unit?: string; // Added unit for display in range filters
// }

// interface FilterModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onApply: (filters: Record<string, any>) => void;
//   sections: FilterSection[];
//   initialFilters?: Record<string, any>;
// }

// // FilterSectionComponent - Adapted to use RTL and existing styles where possible
// const FilterSectionComponent = memo<{
//   section: FilterSection;
//   selectedValue: any;
//   onSelectionChange: (sectionId: string, value: any) => void;
//   isExpanded: boolean;
//   onToggleExpanded: () => void;
//   isArabic: boolean;
//   rtlStyle: any;
//   rtlViewStyle: any;
// }>(function FilterSectionComponent({
//   section,
//   selectedValue,
//   onSelectionChange,
//   isExpanded,
//   onToggleExpanded,
//   isArabic,
//   rtlStyle,
//   rtlViewStyle,
// }) {
//   const [searchText, setSearchText] = useState("");
//   const { t, i18n } = useTranslation();

//   const isCheckboxSection = useMemo(() => {
//     // Now 'location' is also a checkbox section
//     return ["location", "transmission", "fuelType"].includes(section.id);
//   }, [section.id]);

//   const filteredOptions = useMemo(() => {
//     if (!section.options || !searchText) return section.options || [];
//     return section.options.filter((option) =>
//       option.label.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [section.options, searchText]);

//   const renderOption = useCallback(
//     ({ item }: { item: FilterOption }) => {
//       const isSelected =
//         section.type === "multiple"
//           ? selectedValue?.includes?.(item.value)
//           : selectedValue === item.value;

//       return (
//         <TouchableOpacity
//           style={[
//             localStyles.optionItem,
//             isSelected && localStyles.selectedOption,
//           ]}
//           onPress={() => {
//             if (section.type === "multiple") {
//               const currentValues = selectedValue || [];
//               const newValues = isSelected
//                 ? currentValues.filter((v: any) => v !== item.value)
//                 : [...currentValues, item.value];
//               onSelectionChange(section.id, newValues);
//             } else {
//               onSelectionChange(section.id, item.value);
//             }
//           }}
//         >
//           <Text
//             style={[
//               localStyles.optionText,
//               isSelected && localStyles.selectedOptionText,
//               isArabic && localStyles.rtlText,
//             ]}
//           >
//             {item.label}
//           </Text>
//           {isSelected && (
//             <Ionicons
//               name="checkmark"
//               size={16}
//               color="#ffffff"
//               style={isArabic ? { marginRight: 8 } : { marginLeft: 8 }}
//             />
//           )}
//         </TouchableOpacity>
//       );
//     },
//     [section, selectedValue, onSelectionChange, isArabic]
//   );

//   const formatValueForSlider = useCallback(
//     (value: number) => {
//       if (section.id === "yearRange") {
//         return value.toString();
//       } else if (section.id === "priceRange") {
//         const displayValue =
//           value >= 1000 ? `${Math.floor(value / 1000)}k` : `${value}`;
//         return `$${displayValue}`;
//       } else if (section.id === "kilometerRange") {
//         const kmText = "km";
//         const displayValue =
//           value >= 1000 ? `${Math.floor(value / 1000)}k` : `${value}`;
//         return `${displayValue} ${kmText}`;
//       }
//       return value.toString();
//     },
//     [section.id]
//   );

//   const renderRangeInput = () => {
//     const minVal =
//       selectedValue?.min !== undefined ? selectedValue.min : section.min;
//     const maxVal =
//       selectedValue?.max !== undefined ? selectedValue.max : section.max;

//     return (
//       <View style={[localStyles.renderRangeInputstyle]}>
//         <RangeSlider
//           min={section.min!}
//           max={section.max!}
//           step={section.step!}
//           minValue={minVal!}
//           maxValue={maxVal!}
//           onValueChange={(minChange, maxChange) => {
//             onSelectionChange(section.id, { min: minChange, max: maxChange });
//           }}
//           formatLabel={(value: number) => {
//             if (section.id === "yearRange") {
//               return value === section.min ? t("All") : value.toString();
//             } else if (section.id === "priceRange") {
//               if (value === section.min && section.min === 0) return "$0";
//               if (value === section.max && section.max === 100000)
//                 return t("Any price");
//               const displayValue =
//                 value >= 1000 ? `${Math.floor(value / 1000)}k` : `${value}`;
//               return `$${displayValue}`;
//             } else if (section.id === "kilometerRange") {
//               if (value === section.min && section.min === 0) return "0 km";
//               if (value === section.max && section.max === 200000)
//                 return t("Any kilometers");
//               const kmText = "km";
//               const displayValue =
//                 value >= 1000 ? `${Math.floor(value / 1000)}k` : `${value}`;
//               return `${displayValue} ${kmText}`;
//             }
//             return value.toLocaleString();
//           }}
//           // The RangeSlider component doesn't take isArabic, rtlStyle directly,
//           // it handles its own formatting and layout.
//           // If you need RTL for the slider itself, you'd modify RangeSlider.tsx
//           // based on i18n.language, similar to how it's done for formatValue in RangeSlider.tsx
//           title={section.title} // Pass title to RangeSlider if it supports it
//           unit={section.unit} // Pass unit to RangeSlider if it supports it
//         />
//       </View>
//     );
//   };

//   const renderSearchInput = () => (
//     <TextInput
//       style={[localStyles.searchInput, isArabic && localStyles.rtlTextInput]}
//       value={selectedValue || ""}
//       onChangeText={(text) => onSelectionChange(section.id, text)}
//       placeholder={t(`Search ${section.title.toLowerCase()}...`)}
//     />
//   );

//   const renderCheckboxOptions = () => (
//     <View style={localStyles.checkboxOptionsContainer}>
//       {filteredOptions.map((item: FilterOption) => {
//         const isSelected =
//           section.type === "multiple"
//             ? selectedValue?.includes?.(item.value)
//             : selectedValue === item.value;
//         return (
//           <TouchableOpacity
//             key={item.id}
//             style={[localStyles.compactCheckboxOption, rtlViewStyle]}
//             onPress={() => {
//               if (section.type === "multiple") {
//                 const currentValues = selectedValue || [];
//                 const newValues = isSelected
//                   ? currentValues.filter((v: any) => v !== item.value)
//                   : [...currentValues, item.value];
//                 onSelectionChange(section.id, newValues);
//               } else {
//                 onSelectionChange(section.id, item.value);
//               }
//             }}
//             activeOpacity={0.7}
//           >
//             <View
//               style={[
//                 localStyles.compactCheckbox,
//                 isSelected && localStyles.checkboxSelected,
//               ]}
//             >
//               {isSelected && (
//                 <Ionicons name="checkmark" size={12} color="#ffffff" />
//               )}
//             </View>
//             <Text style={[localStyles.compactCheckboxText, rtlStyle]}>
//               {item.label}
//             </Text>
//           </TouchableOpacity>
//         );
//       })}
//     </View>
//   );

//   return (
//     <View>
//       {section.type === "range" ? (
//         renderRangeInput()
//       ) : (
//         <View style={localStyles.sectionContainer}>
//           <TouchableOpacity
//             style={[localStyles.sectionHeader, rtlViewStyle]}
//             onPress={onToggleExpanded}
//           >
//             <Text style={[localStyles.sectionTitle, rtlStyle]}>
//               {section.title}
//             </Text>

//             {/* Show toggle icon only if not a range filter and not a checkbox filter */}
//             {!isCheckboxSection && (
//               <Ionicons
//                 name={isExpanded ? "chevron-up" : "chevron-down"}
//                 size={18}
//                 color="#666"
//               />
//             )}
//           </TouchableOpacity>

//           {/* Content is always expanded for range and checkbox sections, conditionally for others */}
//           {(isExpanded || isCheckboxSection) && (
//             <View style={localStyles.sectionContent}>
//               {(section.type === "single" || section.type === "multiple") &&
//                 !isCheckboxSection && ( // This condition now correctly applies to non-checkbox sections
//                   <>
//                     {section.options && section.options.length > 5 && (
//                       <TextInput
//                         style={[
//                           localStyles.searchInput,
//                           isArabic && localStyles.rtlTextInput,
//                         ]}
//                         value={searchText}
//                         onChangeText={setSearchText}
//                         placeholder={t(
//                           `Search ${section.title.toLowerCase()}...`
//                         )}
//                       />
//                     )}
//                     <View style={localStyles.optionsContainer}>
//                       <FlatList
//                         data={filteredOptions}
//                         renderItem={renderOption}
//                         keyExtractor={(item) => item.id}
//                         style={localStyles.optionsList}
//                         showsVerticalScrollIndicator={true}
//                         nestedScrollEnabled={true} // Essential for FlatList inside a ScrollView
//                       />
//                     </View>
//                   </>
//                 )}

//               {isCheckboxSection && renderCheckboxOptions()}
//             </View>
//           )}
//         </View>
//       )}
//     </View>
//   );
// });

// // ComprehensiveFilterModal - now acts as a wrapper for the new FilterModal
// export default function ComprehensiveFilterModal({
//   visible,
//   onClose,
//   value,
//   onChange,
// }: {
//   visible: boolean;
//   onClose: () => void;
//   value: any; // Using any for now to match the general FilterModal's initialFilters
//   onChange: (value: any) => void;
// }) {
//   const { t, i18n } = useTranslation();
//   const { rtlViewStyle, rtlStyle, getFlexDirection } = useRTL();
//   const isArabic = i18n.language === "ar";

//   const [localFilters, setLocalFilters] = useState<Record<string, any>>(value);
//   const [selectedMakeData, setSelectedMakeData] = useState<any | null>(null);

//   const currentMakesData = i18n.language === "ar" ? arabicMakes : makes;
//   const currentLocationsData = locations.map((loc) =>
//     i18n.language === "ar"
//       ? { ...loc, label: loc.arValue }
//       : { ...loc, label: loc.label }
//   );

//   useEffect(() => {
//     if (visible) {
//       setLocalFilters(value);
//     }
//   }, [visible, value]);

//   useEffect(() => {
//     if (localFilters.make) {
//       const foundMake = currentMakesData.find(
//         (m) => m.value === localFilters.make || m.label === localFilters.make
//       );
//       setSelectedMakeData(foundMake || null);
//     } else {
//       setSelectedMakeData(null);
//     }
//   }, [localFilters.make, i18n.language, currentMakesData]);

//   const cylinderOptions = useMemo(
//     () => [
//       { id: "all_cyl", label: t("All"), value: "" },
//       { id: "1_cyl", label: t("1"), value: "1" },
//       { id: "2_cyl", label: t("2"), value: "2" },
//       { id: "4_cyl", label: t("4"), value: "4" },
//       { id: "6_cyl", label: t("6"), value: "6" },
//       { id: "8_cyl", label: t("8"), value: "8" },
//       { id: "other_cyl", label: t("Other"), value: "Other" },
//     ],
//     [t]
//   );

//   const transmissionOptions = useMemo(
//     () => [
//       { id: "all_trans", label: t("All"), value: "" },
//       { id: "auto_trans", label: t("Automatic"), value: "Automatic" },
//       { id: "manual_trans", label: t("Manual"), value: "Manual" },
//     ],
//     [t]
//   );

//   const fuelTypeOptions = useMemo(
//     () => [
//       { id: "all_fuel", label: t("All"), value: "" },
//       { id: "petrol_fuel", label: t("Petrol"), value: "Petrol" },
//       { id: "diesel_fuel", label: t("Diesel"), value: "Diesel" },
//       { id: "electric_fuel", label: t("Electric"), value: "Electric" },
//       { id: "hybrid_fuel", label: t("Hybrid"), value: "Hybrid" },
//     ],
//     [t]
//   );

//   const colorOptions = useMemo(
//     () => [
//       { id: "all_color", label: t("All"), value: "" },
//       { id: "black_color", label: t("Black"), value: "Black" },
//       { id: "white_color", label: t("White"), value: "White" },
//       { id: "red_color", label: t("Red"), value: "Red" },
//       { id: "blue_color", label: "Blue", value: "Blue" },
//       { id: "silver_color", label: t("Silver"), value: "Silver" },
//       { id: "gray_color", label: t("Gray"), value: "Gray" },
//       { id: "green_color", label: t("Green"), value: "Green" },
//       { id: "brown_color", label: t("Brown"), value: "Brown" },
//       { id: "yellow_color", label: t("Yellow"), value: "Yellow" },
//       { id: "orange_color", label: t("Orange"), value: "Orange" },
//       { id: "purple_color", label: t("Purple"), value: "Purple" },
//       { id: "gold_color", label: t("Gold"), value: "Gold" },
//       { id: "other_color", label: t("Other"), value: "Other" },
//     ],
//     [t]
//   );

//   const currentYear = new Date().getFullYear();

//   const sections: FilterSection[] = useMemo(
//     () => [
//       {
//         id: "make",
//         title: t("Make"),
//         type: "single",
//         options: [
//           { id: "all_make", label: t("All"), value: "" },
//           ...currentMakesData.map((m: any) => ({
//             id: `make_${m.value}`,
//             label: m.label,
//             value: m.value,
//           })),
//         ],
//       },
//       {
//         id: "model",
//         title: t("Model"),
//         type: "single",
//         options: [
//           { id: "all_model", label: t("All"), value: "" },
//           ...(selectedMakeData?.models || []).map((m: string) => ({
//             id: `model_${m}`,
//             label: m,
//             value: m,
//           })),
//         ],
//       },
//       {
//         id: "location",
//         title: t("Location"),
//         type: "multiple", // Changed to multiple as per the new FilterModal's capability
//         options: currentLocationsData.map((loc: any) => ({
//           id: `loc_${loc.value}`,
//           label: loc.label,
//           value: loc.value,
//         })),
//       },
//       {
//         id: "yearRange",
//         title: t("Year"),
//         type: "range",
//         min: 1970,
//         max: currentYear,
//         step: 1,
//       },
//       {
//         id: "priceRange",
//         title: t("Price"),
//         type: "range",
//         min: 0,
//         max: 100000,
//         step: 1000,
//         unit: "$",
//       },
//       {
//         id: "kilometerRange",
//         title: t("Kilometers"),
//         type: "range",
//         min: 0,
//         max: 200000,
//         step: 1000,
//         unit: "km",
//       },
//       {
//         id: "cylinder",
//         title: t("Cylinder"),
//         type: "single",
//         options: cylinderOptions,
//       },
//       {
//         id: "transmission",
//         title: t("Transmission"),
//         type: "single",
//         options: transmissionOptions,
//       },
//       {
//         id: "fuelType",
//         title: t("Fuel Type"),
//         type: "single",
//         options: fuelTypeOptions,
//       },
//       {
//         id: "exteriorColor",
//         title: t("Exterior Color"),
//         type: "single",
//         options: colorOptions,
//       },
//       {
//         id: "interiorColor",
//         title: t("Interior Color"),
//         type: "single",
//         options: colorOptions,
//       },
//     ],
//     [
//       t,
//       currentMakesData,
//       selectedMakeData,
//       currentLocationsData,
//       currentYear,
//       cylinderOptions,
//       transmissionOptions,
//       fuelTypeOptions,
//       colorOptions,
//     ]
//   );

//   interface SearchValue {
//     make?: string;
//     model?: string;
//     location?: string[]; // Changed to string[] for multiple locations
//     cylinder?: string;
//     transmission?: string;
//     fuelType?: string;
//     exteriorColor?: string;
//     interiorColor?: string;
//     priceMin?: string;
//     priceMax?: string;
//     yearMin?: string;
//     yearMax?: string;
//     kilometerMin?: string;
//     kilometerMax?: string;
//   }

//   const convertLocalFiltersToNewFormat = useCallback((filters: SearchValue) => {
//     const newFilters: Record<string, any> = {};

//     // Map simple single selections
//     if (filters.make) newFilters.make = filters.make;
//     if (filters.model) newFilters.model = filters.model;
//     if (filters.cylinder) newFilters.cylinder = filters.cylinder;
//     if (filters.transmission) newFilters.transmission = filters.transmission;
//     if (filters.fuelType) newFilters.fuelType = filters.fuelType;
//     if (filters.exteriorColor) newFilters.exteriorColor = filters.exteriorColor;
//     if (filters.interiorColor) newFilters.interiorColor = filters.interiorColor;

//     // Map location (now multiple, but original was single)
//     if (filters.location && filters.location.length > 0)
//       newFilters.location = filters.location; // Directly assign array

//     // Map range filters
//     if (filters.yearMin || filters.yearMax) {
//       newFilters.yearRange = {
//         min: filters.yearMin ? parseInt(filters.yearMin) : undefined,
//         max: filters.yearMax ? parseInt(filters.yearMax) : undefined,
//       };
//     }
//     if (filters.priceMin || filters.priceMax) {
//       newFilters.priceRange = {
//         min: filters.priceMin ? parseInt(filters.priceMin) : undefined,
//         max: filters.priceMax ? parseInt(filters.priceMax) : undefined,
//       };
//     }
//     if (filters.kilometerMin || filters.kilometerMax) {
//       newFilters.kilometerRange = {
//         min: filters.kilometerMin ? parseInt(filters.kilometerMin) : undefined,
//         max: filters.kilometerMax ? parseInt(filters.kilometerMax) : undefined,
//       };
//     }
//     return newFilters;
//   }, []);

//   const convertNewFiltersToLocalFormat = useCallback(
//     (newFilters: Record<string, any>): SearchValue => {
//       const oldFilters: SearchValue = {
//         make: newFilters.make || "",
//         model: newFilters.model || "",
//         location: newFilters.location || [], // Keep as array
//         cylinder: newFilters.cylinder || "",
//         transmission: newFilters.transmission || "",
//         fuelType: newFilters.fuelType || "",
//         exteriorColor: newFilters.exteriorColor || "",
//         interiorColor: newFilters.interiorColor || "",
//         priceMin: newFilters.priceRange?.min?.toString() || "",
//         priceMax: newFilters.priceRange?.max?.toString() || "",
//         yearMin: newFilters.yearRange?.min?.toString() || "",
//         yearMax: newFilters.yearRange?.max?.toString() || "",
//         kilometerMin: newFilters.kilometerRange?.min?.toString() || "",
//         kilometerMax: newFilters.kilometerRange?.max?.toString() || "",
//       };

//       // Handle 'All' equivalent for ranges
//       if (
//         oldFilters.yearMin === "1970" &&
//         sections.find((s) => s.id === "yearRange")?.min === 1970
//       )
//         oldFilters.yearMin = "";
//       if (
//         oldFilters.yearMax === currentYear.toString() &&
//         sections.find((s) => s.id === "yearRange")?.max === currentYear
//       )
//         oldFilters.yearMax = "";
//       if (
//         oldFilters.priceMin === "0" &&
//         sections.find((s) => s.id === "priceRange")?.min === 0
//       )
//         oldFilters.priceMin = "";
//       if (
//         oldFilters.priceMax === "100000" &&
//         sections.find((s) => s.id === "priceRange")?.max === 100000
//       )
//         oldFilters.priceMax = "";
//       if (
//         oldFilters.kilometerMin === "0" &&
//         sections.find((s) => s.id === "kilometerRange")?.min === 0
//       )
//         oldFilters.kilometerMin = "";
//       if (
//         oldFilters.kilometerMax === "200000" &&
//         sections.find((s) => s.id === "kilometerRange")?.max === 200000
//       )
//         oldFilters.kilometerMax = "";

//       return oldFilters;
//     },
//     [currentYear, sections]
//   );

//   const handleApply = useCallback(
//     (newFilters: Record<string, any>) => {
//       const convertedFilters = convertNewFiltersToLocalFormat(newFilters);
//       onChange(convertedFilters);
//       onClose();
//     },
//     [onChange, onClose, convertNewFiltersToLocalFormat]
//   );

//   const initialFiltersConverted = useMemo(
//     () => convertLocalFiltersToNewFormat(value),
//     [value, convertLocalFiltersToNewFormat]
//   );

//   return (
//     <FilterModal
//       visible={visible}
//       onClose={onClose}
//       onApply={handleApply}
//       sections={sections}
//       initialFilters={initialFiltersConverted}
//     />
//   );
// }

// // FilterModal Component - Copied and adapted from user's provided code
// const FilterModal: React.FC<FilterModalProps> = ({
//   visible,
//   onClose,
//   onApply,
//   sections,
//   initialFilters = {},
// }) => {
//   const { t, i18n } = useTranslation();
//   const { rtlViewStyle, rtlStyle } = useRTL();
//   const isArabic = i18n.language === "ar";

//   const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
//   const [expandedSections, setExpandedSections] = useState<Set<string>>(
//     new Set()
//   );

//   useEffect(() => {
//     if (visible) {
//       setFilters(initialFilters);
//       const defaultExpanded = new Set(
//         sections
//           .filter(
//             (s) =>
//               s.type === "range" ||
//               ["location", "transmission", "fuelType"].includes(s.id)
//           )
//           .map((s) => s.id)
//       );
//       setExpandedSections(defaultExpanded);
//     }
//   }, [visible, initialFilters, sections]);

//   const handleSelectionChange = useCallback((sectionId: string, value: any) => {
//     setFilters((prev) => {
//       const newState = { ...prev, [sectionId]: value };

//       if (sectionId === "make" && prev.make !== value) {
//         newState.model = "";
//       }
//       return newState;
//     });
//   }, []);

//   const handleToggleExpanded = useCallback((sectionId: string) => {
//     setExpandedSections((prev) => {
//       const newSet = new Set(prev);
//       if (newSet.has(sectionId)) {
//         newSet.delete(sectionId);
//       } else {
//         newSet.add(sectionId);
//       }
//       return newSet;
//     });
//   }, []);

//   const handleClearAll = useCallback(() => {
//     setFilters({});
//     const defaultExpanded = new Set(
//       sections
//         .filter(
//           (s) =>
//             s.type === "range" ||
//             ["location", "transmission", "fuelType"].includes(s.id)
//         )
//         .map((s) => s.id)
//     );
//     setExpandedSections(defaultExpanded);
//   }, [sections]);

//   const handleApplyPress = useCallback(() => {
//     onApply(filters);
//   }, [filters, onApply]);

//   const renderSection = useCallback(
//     ({ item }: { item: FilterSection }) => {
//       const alwaysExpanded =
//         item.type === "range" ||
//         ["location", "transmission", "fuelType"].includes(item.id);

//       if (item.id === "model" && !filters.make) {
//         return null;
//       }
//       return (
//         <FilterSectionComponent
//           section={item}
//           selectedValue={filters[item.id]}
//           onSelectionChange={handleSelectionChange}
//           isExpanded={alwaysExpanded || expandedSections.has(item.id)}
//           onToggleExpanded={() => handleToggleExpanded(item.id)}
//           isArabic={isArabic}
//           rtlStyle={rtlStyle}
//           rtlViewStyle={rtlViewStyle}
//         />
//       );
//     },
//     [
//       filters,
//       expandedSections,
//       handleSelectionChange,
//       handleToggleExpanded,
//       isArabic,
//       rtlStyle,
//       rtlViewStyle,
//     ]
//   );

//   const getActiveFilterCount = useCallback(() => {
//     let count = 0;
//     for (const key in filters) {
//       const value = filters[key];
//       if (value) {
//         if (typeof value === "object" && !Array.isArray(value)) {
//           if (value.min !== undefined || value.max !== undefined) {
//             const section = sections.find((s) => s.id === key);
//             if (section) {
//               const defaultMin = section.min;
//               const defaultMax = section.max;
//               if (
//                 (value.min !== undefined && value.min !== defaultMin) ||
//                 (value.max !== undefined && value.max !== defaultMax)
//               ) {
//                 count++;
//               }
//             }
//           }
//         } else if (Array.isArray(value)) {
//           if (value.length > 0) count++;
//         } else if (value !== "") {
//           count++;
//         }
//       }
//     }
//     return count;
//   }, [filters, sections]);

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="pageSheet"
//       onRequestClose={onClose}
//     >
//       <SafeAreaView style={localStyles.container}>
//         <View style={[localStyles.header, rtlViewStyle]}>
//           <TouchableOpacity onPress={onClose} style={localStyles.closeButton}>
//             <Ionicons name="close" size={24} color="#333" />
//           </TouchableOpacity>
//           <Text style={[localStyles.headerTitle, rtlStyle]}>
//             {t("Filters")}
//           </Text>
//         </View>

//         <FlatList
//           data={sections}
//           renderItem={renderSection}
//           keyExtractor={(item) => item.id}
//           style={localStyles.sectionsContainer}
//           showsVerticalScrollIndicator={true}
//           contentContainerStyle={localStyles.sectionsContent}
//         />

//         <View style={[localStyles.footer, rtlViewStyle]}>
//           <TouchableOpacity
//             style={[localStyles.button, localStyles.resetButton]}
//             onPress={handleClearAll}
//             activeOpacity={0.7}
//           >
//             <Text style={[localStyles.resetButtonText, rtlStyle]}>
//               {t("Reset")}
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[localStyles.button, localStyles.applyButton]}
//             onPress={handleApplyPress}
//             activeOpacity={0.7}
//           >
//             <Text style={[localStyles.applyButtonText, rtlStyle]}>
//               {t("Apply")}{" "}
//               {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     </Modal>
//   );
// };

// // Merged and adapted styles from both original ComprehensiveFilterModal and the provided FilterModal
// const localStyles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#ffffff",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   closeButton: {
//     padding: 4,
//   },
//   closeButtonText: {
//     fontSize: 18,
//     color: "#666",
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//   },
//   clearButton: {
//     padding: 8,
//   },
//   clearButtonText: {
//     fontSize: 14,
//     color: "#b80200",
//     fontWeight: "500",
//   },
//   sectionsContainer: {
//     flex: 1,
//   },
//   sectionsContent: {
//     paddingBottom: 20,
//   },
//   sectionContainer: {
//     marginHorizontal: 16,
//     marginVertical: 8,
//     borderRadius: 8,
//     backgroundColor: "#f8f9fa",
//     overflow: "hidden",
//     borderWidth: 1,
//     borderColor: "#e9ecef",
//   },
//   renderRangeInputstyle: {
//     paddingHorizontal: 15,
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//     backgroundColor: "#ffffff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#333",
//   },
//   expandIcon: {
//     fontSize: 18,
//     color: "#666",
//   },
//   sectionContent: {
//     padding: 16,
//     backgroundColor: "#fdfdfd",
//   },
//   optionsContainer: {
//     // maxHeight: 200,
//   },
//   optionsList: {
//     // maxHeight: 200,
//   },
//   optionItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//     marginVertical: 4,
//     backgroundColor: "#f0f0f0",
//   },
//   selectedOption: {
//     backgroundColor: "#b80200",
//   },
//   optionText: {
//     fontSize: 14,
//     color: "#333",
//     flex: 1,
//   },
//   selectedOptionText: {
//     color: "#fff",
//     fontWeight: "600",
//   },
//   checkmark: {
//     fontSize: 16,
//     color: "#fff",
//     marginLeft: 8,
//   },
//   searchInput: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 12,
//     fontSize: 14,
//     backgroundColor: "#fff",
//   },
//   rangeContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     gap: 10,
//   },
//   rangeInputContainer: {
//     flex: 1,
//   },
//   rangeLabel: {
//     fontSize: 12,
//     color: "#666",
//     marginBottom: 4,
//     fontWeight: "500",
//   },
//   rangeInput: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     fontSize: 14,
//     backgroundColor: "#fff",
//   },
//   footer: {
//     flexDirection: "row",
//     padding: 16,
//     borderTopWidth: 1,
//     borderTopColor: "#f0f0f0",
//     backgroundColor: "#ffffff",
//     gap: 12,
//   },
//   button: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   resetButton: {
//     backgroundColor: "#f0f0f0",
//     borderWidth: 1,
//     borderColor: "#b80200",
//   },
//   resetButtonText: {
//     fontSize: 15,
//     color: "#b80200",
//     fontWeight: "600",
//   },
//   applyButton: {
//     backgroundColor: "#b80200",
//   },
//   applyButtonText: {
//     fontSize: 15,
//     color: "#fff",
//     fontWeight: "600",
//   },
//   rtlText: {
//     textAlign: "right",
//   },
//   rtlTextInput: {
//     textAlign: "right",
//   },
//   sliderContainer: {
//     // These styles are no longer directly used by the imported RangeSlider, but might be leftover.
//     marginVertical: 12,
//   },
//   sliderValuesContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },
//   sliderValue: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#333",
//   },
//   sliderTrack: {
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: "#e0e0e0",
//     justifyContent: "center",
//     position: "relative",
//     marginHorizontal: 10,
//   },
//   sliderSelectedTrack: {
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: "#b80200",
//     position: "absolute",
//   },
//   sliderThumb: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: "#b80200",
//     position: "absolute",
//     borderWidth: 2,
//     borderColor: "#fff",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 3,
//     top: -9,
//   },
//   checkboxOptionsContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     marginTop: 8,
//     marginBottom: 8,
//   },
//   compactCheckboxOption: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     backgroundColor: "#f8f9fa",
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: "#e9ecef",
//   },
//   compactCheckbox: {
//     width: 16,
//     height: 16,
//     borderRadius: 4,
//     borderWidth: 1,
//     borderColor: "#dee2e6",
//     marginRight: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   checkboxSelected: {
//     backgroundColor: "#b80200",
//     borderColor: "#b80200",
//   },
//   compactCheckboxText: {
//     paddingHorizontal: 5,
//     fontSize: 12,
//     color: "#495057",
//   },
// });
