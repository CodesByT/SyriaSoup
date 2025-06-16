// FilterModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRTL } from "../hooks/useRTL";

// Import FilterSectionComponent
import FilterSectionComponent from "./FilterSectionComponent";

interface FilterOption {
  id: string;
  label: string;
  value: any;
}

interface MakeData {
  label: string;
  value: string;
  arValue?: string; // Optional if not always present
  enValue?: string; // Optional if not always present
  models: string[];
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

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, any>) => void;
  sections: FilterSection[]; // These are now the base sections from ComprehensiveFilterModal
  initialFilters?: Record<string, any>;
  allMakesData: MakeData[]; // New prop to receive all makes data
  disableVerticalScroll?: boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  sections: baseSections, // Renamed to avoid confusion with internal dynamicSections
  initialFilters = {},
  allMakesData, // Destructure new prop
  disableVerticalScroll = false,
}) => {
  const { t, i18n } = useTranslation();
  const { rtlViewStyle, rtlStyle } = useRTL();
  const isArabic = i18n.language === "ar";

  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [selectedMakeData, setSelectedMakeData] = useState<MakeData | null>(
    null
  );

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
      const defaultExpanded = new Set(
        baseSections // Use baseSections for initial expansion
          .filter(
            (s) =>
              s.type === "range" ||
              ["location", "transmission", "fuelType"].includes(s.id)
          )
          .map((s) => s.id)
      );
      setExpandedSections(defaultExpanded);
    }
  }, [visible, initialFilters, baseSections]);

  // Effect to update selectedMakeData when make filter changes
  useEffect(() => {
    if (filters.make) {
      const foundMake = allMakesData.find(
        (m) => m.value === filters.make || m.label === filters.make
      );
      setSelectedMakeData(foundMake || null);
    } else {
      setSelectedMakeData(null);
    }
  }, [filters.make, allMakesData]);

  const handleSelectionChange = useCallback((sectionId: string, value: any) => {
    setFilters((prev) => {
      const newState = { ...prev, [sectionId]: value };

      // If make changes, reset model
      if (sectionId === "make" && prev.make !== value) {
        newState.model = "";
      }
      return newState;
    });
  }, []);

  const handleToggleExpanded = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters({});
    const defaultExpanded = new Set(
      baseSections // Use baseSections for default expansion
        .filter(
          (s) =>
            s.type === "range" ||
            ["location", "transmission", "fuelType"].includes(s.id)
        )
        .map((s) => s.id)
    );
    setExpandedSections(defaultExpanded);
  }, [baseSections]);

  const handleApplyPress = useCallback(() => {
    onApply(filters);
  }, [filters, onApply]);

  // Dynamically create sections for rendering
  const dynamicSections = useMemo(() => {
    return baseSections.map((section) => {
      if (section.id === "model") {
        return {
          ...section,
          options: [
            { id: "all_model", label: t("All"), value: "" },
            ...(selectedMakeData?.models || []).map((m: string) => ({
              id: `model_${m}`,
              label: m,
              value: m,
            })),
          ],
        };
      }
      return section;
    });
  }, [baseSections, selectedMakeData, t]); // Add selectedMakeData as dependency

  const renderSection = useCallback(
    ({ item }: { item: FilterSection }) => {
      const alwaysExpanded =
        item.type === "range" ||
        ["location", "transmission", "fuelType"].includes(item.id);

      // Only hide model section if no make is selected
      if (item.id === "model" && !filters.make) {
        return null;
      }
      return (
        <FilterSectionComponent
          section={item}
          selectedValue={filters[item.id]}
          onSelectionChange={handleSelectionChange}
          isExpanded={alwaysExpanded || expandedSections.has(item.id)}
          onToggleExpanded={() => handleToggleExpanded(item.id)}
          isArabic={isArabic}
          rtlStyle={rtlStyle}
          rtlViewStyle={rtlViewStyle}
        />
      );
    },
    [
      filters,
      expandedSections,
      handleSelectionChange,
      handleToggleExpanded,
      isArabic,
      rtlStyle,
      rtlViewStyle,
    ]
  );

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    for (const key in filters) {
      const value = filters[key];
      if (value) {
        if (typeof value === "object" && !Array.isArray(value)) {
          // Handle range filters
          if (value.min !== undefined || value.max !== undefined) {
            const section = baseSections.find((s) => s.id === key); // Use baseSections
            if (section) {
              const defaultMin = section.min;
              const defaultMax = section.max;
              if (
                (value.min !== undefined && value.min !== defaultMin) ||
                (value.max !== undefined && value.max !== defaultMax)
              ) {
                count++;
              }
            }
          }
        } else if (Array.isArray(value)) {
          // Handle multiple selection filters (e.g., location)
          if (value.length > 0) count++;
        } else if (value !== "") {
          // Handle single selection filters
          count++;
        }
      }
    }
    return count;
  }, [filters, baseSections]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={localStyles.container}>
        <View style={[localStyles.header, rtlViewStyle]}>
          <TouchableOpacity onPress={onClose} style={localStyles.closeButton}>
            <Ionicons
              name="close"
              size={24}
              color={localStyles.headerTitle.color}
            />
          </TouchableOpacity>
          <Text style={[localStyles.headerTitle, rtlStyle]}>
            {t("filters")}
          </Text>
        </View>

        <FlatList
          data={dynamicSections} // Use dynamicSections here
          renderItem={renderSection}
          keyExtractor={(item) => item.id}
          style={localStyles.sectionsContainer}
          showsVerticalScrollIndicator={!disableVerticalScroll}
          contentContainerStyle={localStyles.sectionsContent}
        />

        <View style={[localStyles.footer, rtlViewStyle]}>
          <TouchableOpacity
            style={[localStyles.button, localStyles.resetButton]}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={[localStyles.resetButtonText, rtlStyle]}>
              {t("Reset")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[localStyles.button, localStyles.applyButton]}
            onPress={handleApplyPress}
            activeOpacity={0.7}
          >
            <Text style={[localStyles.applyButtonText, rtlStyle]}>
              {t("Apply")}{" "}
              {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default FilterModal;

// Merged and adapted styles from both original ComprehensiveFilterModal and the provided FilterModal
const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // Main modal background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0", // Light gray separator
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#666", // Slightly darker gray for close button text (not used, using icon color)
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333", // Dark gray for header title
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: "#b80200", // Theme accent red for clear button text
    fontWeight: "500",
  },
  sectionsContainer: {
    flex: 1,
  },
  sectionsContent: {
    paddingBottom: 20,
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa", // Light background for section cards
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e9ecef", // Light border for section cards
  },
  renderRangeInputstyle: {
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff", // White background for section headers
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0", // Light gray separator
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333", // Dark gray for section titles
  },
  expandIcon: {
    fontSize: 18,
    color: "#666", // Gray for expand/collapse icon
  },
  sectionContent: {
    padding: 16,
    backgroundColor: "#fdfdfd", // Very light background for section content
  },
  optionsContainer: {
    // maxHeight: 200,
  },
  optionsList: {
    // maxHeight: 200,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 4,
    backgroundColor: "#f0f0f0", // Light gray background for unselected options
  },
  selectedOption: {
    backgroundColor: "#b80200", // Theme accent red for selected options
  },
  optionText: {
    fontSize: 14,
    color: "#333", // Dark gray text for unselected options
    flex: 1,
  },
  selectedOptionText: {
    color: "#fff", // White text for selected options
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 16,
    color: "#fff", // White checkmark for selected options
    marginLeft: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd", // Light gray border for search input
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: "#fff", // White background for search input
  },
  rangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  rangeInputContainer: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    color: "#666", // Gray for range input labels
    marginBottom: 4,
    fontWeight: "500",
  },
  rangeInput: {
    borderWidth: 1,
    borderColor: "#ddd", // Light gray border for range inputs
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#fff", // White background for range inputs
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0", // Light gray separator
    backgroundColor: "#ffffff", // White background for footer
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButton: {
    backgroundColor: "#f0f0f0", // Light gray background for reset button
    borderWidth: 1,
    borderColor: "#b80200", // Theme accent red border for reset button
  },
  resetButtonText: {
    fontSize: 15,
    color: "#b80200", // Theme accent red text for reset button
    fontWeight: "600",
  },
  applyButton: {
    backgroundColor: "#b80200", // Theme accent red for apply button
  },
  applyButtonText: {
    fontSize: 15,
    color: "#fff", // White text for apply button
    fontWeight: "600",
  },
  rtlText: {
    textAlign: "right",
  },
  rtlTextInput: {
    textAlign: "right",
  },
  sliderContainer: {
    marginVertical: 12,
  },
  sliderValuesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333", // Dark gray for slider values
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e0e0", // Light gray for inactive slider track
    justifyContent: "center",
    position: "relative",
    marginHorizontal: 10,
  },
  sliderSelectedTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#b80200", // Theme accent red for active slider track
    position: "absolute",
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#b80200", // Theme accent red for slider thumb
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff", // White border for slider thumb
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    top: -9,
  },
  checkboxOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  compactCheckboxOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f8f9fa", // Light background for unselected compact checkboxes
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9ecef", // Light border for unselected compact checkboxes
  },
  compactCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#dee2e6", // Light gray border for unselected compact checkboxes
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#b80200", // Theme accent red for selected compact checkboxes
    borderColor: "#b80200", // Theme accent red border for selected compact checkboxes
  },
  compactCheckboxText: {
    paddingHorizontal: 5,
    fontSize: 12,
    color: "#495057", // Dark gray for compact checkbox text
  },
});
// // FilterModal.tsx
// import { Ionicons } from "@expo/vector-icons";
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   FlatList,
//   Modal,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useRTL } from "../hooks/useRTL";

// // Import FilterSectionComponent
// import FilterSectionComponent from "./FilterSectionComponent";

// interface FilterOption {
//   id: string;
//   label: string;
//   value: any;
// }

// interface MakeData {
//   label: string;
//   value: string;
//   arValue?: string; // Optional if not always present
//   enValue?: string; // Optional if not always present
//   models: string[];
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

// interface FilterModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onApply: (filters: Record<string, any>) => void;
//   sections: FilterSection[]; // These are now the base sections from ComprehensiveFilterModal
//   initialFilters?: Record<string, any>;
//   allMakesData: MakeData[]; // New prop to receive all makes data
// }

// const FilterModal: React.FC<FilterModalProps> = ({
//   visible,
//   onClose,
//   onApply,
//   sections: baseSections, // Renamed to avoid confusion with internal dynamicSections
//   initialFilters = {},
//   allMakesData, // Destructure new prop
// }) => {
//   const { t, i18n } = useTranslation();
//   const { rtlViewStyle, rtlStyle } = useRTL();
//   const isArabic = i18n.language === "ar";

//   const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
//   const [expandedSections, setExpandedSections] = useState<Set<string>>(
//     new Set()
//   );
//   const [selectedMakeData, setSelectedMakeData] = useState<MakeData | null>(
//     null
//   );

//   useEffect(() => {
//     if (visible) {
//       setFilters(initialFilters);
//       const defaultExpanded = new Set(
//         baseSections // Use baseSections for initial expansion
//           .filter(
//             (s) =>
//               s.type === "range" ||
//               ["location", "transmission", "fuelType"].includes(s.id)
//           )
//           .map((s) => s.id)
//       );
//       setExpandedSections(defaultExpanded);
//     }
//   }, [visible, initialFilters, baseSections]);

//   // Effect to update selectedMakeData when make filter changes
//   useEffect(() => {
//     if (filters.make) {
//       const foundMake = allMakesData.find(
//         (m) => m.value === filters.make || m.label === filters.make
//       );
//       setSelectedMakeData(foundMake || null);
//     } else {
//       setSelectedMakeData(null);
//     }
//   }, [filters.make, allMakesData]);

//   const handleSelectionChange = useCallback((sectionId: string, value: any) => {
//     setFilters((prev) => {
//       const newState = { ...prev, [sectionId]: value };

//       // If make changes, reset model
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
//       baseSections // Use baseSections for default expansion
//         .filter(
//           (s) =>
//             s.type === "range" ||
//             ["location", "transmission", "fuelType"].includes(s.id)
//         )
//         .map((s) => s.id)
//     );
//     setExpandedSections(defaultExpanded);
//   }, [baseSections]);

//   const handleApplyPress = useCallback(() => {
//     onApply(filters);
//   }, [filters, onApply]);

//   // Dynamically create sections for rendering
//   const dynamicSections = useMemo(() => {
//     return baseSections.map((section) => {
//       if (section.id === "model") {
//         return {
//           ...section,
//           options: [
//             { id: "all_model", label: t("All"), value: "" },
//             ...(selectedMakeData?.models || []).map((m: string) => ({
//               id: `model_${m}`,
//               label: m,
//               value: m,
//             })),
//           ],
//         };
//       }
//       return section;
//     });
//   }, [baseSections, selectedMakeData, t]); // Add selectedMakeData as dependency

//   const renderSection = useCallback(
//     ({ item }: { item: FilterSection }) => {
//       const alwaysExpanded =
//         item.type === "range" ||
//         ["location", "transmission", "fuelType"].includes(item.id);

//       // Only hide model section if no make is selected
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
//           // Handle range filters
//           if (value.min !== undefined || value.max !== undefined) {
//             const section = baseSections.find((s) => s.id === key); // Use baseSections
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
//           // Handle multiple selection filters (e.g., location)
//           if (value.length > 0) count++;
//         } else if (value !== "") {
//           // Handle single selection filters
//           count++;
//         }
//       }
//     }
//     return count;
//   }, [filters, baseSections]);

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
//             {t("filters")}
//           </Text>
//         </View>

//         <FlatList
//           data={dynamicSections} // Use dynamicSections here
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

// export default FilterModal;

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
// // FilterModal.tsx
// import { Ionicons } from "@expo/vector-icons";
// import React, { useCallback, useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   FlatList,
//   Modal,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useRTL } from "../hooks/useRTL";

// // Import FilterSectionComponent
// import FilterSectionComponent from "./FilterSectionComponent";

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

// interface FilterModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onApply: (filters: Record<string, any>) => void;
//   sections: FilterSection[];
//   initialFilters?: Record<string, any>;
// }

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

// export default FilterModal;

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
