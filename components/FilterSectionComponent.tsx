// FilterSectionComponent.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Import the RangeSlider component
import RangeSlider from "./RangeSlider"; // Adjust the path as per your project structure

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

const FilterSectionComponent = memo<{
  section: FilterSection;
  selectedValue: any;
  onSelectionChange: (sectionId: string, value: any) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isArabic: boolean;
  rtlStyle: any;
  rtlViewStyle: any;
}>(function FilterSectionComponent({
  section,
  selectedValue,
  onSelectionChange,
  isExpanded,
  onToggleExpanded,
  isArabic,
  rtlStyle,
  rtlViewStyle,
}) {
  const [searchText, setSearchText] = useState("");
  const { t, i18n } = useTranslation();

  const isCheckboxSection = useMemo(() => {
    return ["location", "transmission", "fuelType"].includes(section.id);
  }, [section.id]);

  const filteredOptions = useMemo(() => {
    if (!section.options || !searchText) return section.options || [];
    return section.options.filter((option) =>
      option.label.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [section.options, searchText]);

  const renderOption = useCallback(
    ({ item }: { item: FilterOption }) => {
      const isSelected =
        section.type === "multiple"
          ? selectedValue?.includes?.(item.value)
          : selectedValue === item.value;

      return (
        <TouchableOpacity
          style={[
            localStyles.optionItem,
            isSelected && localStyles.selectedOption,
          ]}
          onPress={() => {
            if (section.type === "multiple") {
              const currentValues = selectedValue || [];
              const newValues = isSelected
                ? currentValues.filter((v: any) => v !== item.value)
                : [...currentValues, item.value];
              onSelectionChange(section.id, newValues);
            } else {
              onSelectionChange(section.id, item.value);
            }
          }}
        >
          <Text
            style={[
              localStyles.optionText,
              isSelected && localStyles.selectedOptionText,
              isArabic && localStyles.rtlText,
            ]}
          >
            {item.label}
          </Text>
          {isSelected && (
            <Ionicons
              name="checkmark"
              size={16}
              color="#ffffff"
              style={isArabic ? { marginRight: 8 } : { marginLeft: 8 }}
            />
          )}
        </TouchableOpacity>
      );
    },
    [section, selectedValue, onSelectionChange, isArabic]
  );

  const formatValueForSlider = useCallback(
    (value: number) => {
      if (section.id === "yearRange") {
        return value.toString();
      } else if (section.id === "priceRange") {
        const displayValue =
          value >= 1000 ? `${Math.floor(value / 1000)}k` : `${value}`;
        return `$${displayValue}`;
      } else if (section.id === "kilometerRange") {
        const kmText = "km";
        const displayValue =
          value >= 1000 ? `${Math.floor(value / 1000)}k` : `${value}`;
        return `${displayValue} ${kmText}`;
      }
      return value.toString();
    },
    [section.id]
  );

  const renderRangeInput = () => {
    const minVal =
      selectedValue?.min !== undefined ? selectedValue.min : section.min;
    const maxVal =
      selectedValue?.max !== undefined ? selectedValue.max : section.max;

    return (
      <View style={[localStyles.renderRangeInputstyle]}>
        <RangeSlider
          min={section.min!}
          max={section.max!}
          step={section.step!}
          minValue={minVal!}
          maxValue={maxVal!}
          onValueChange={(minChange, maxChange) => {
            onSelectionChange(section.id, { min: minChange, max: maxChange });
          }}
          formatLabel={(value: number) => {
            if (section.id === "yearRange") {
              return value === section.min ? t("All") : value.toString();
            } else if (section.id === "priceRange") {
              if (value === section.min && section.min === 0) return "$0";
              if (value === section.max && section.max === 100000)
                return t("100000 $");
              const displayValue =
                value >= 1000 ? `${Math.floor(value / 1000)}k` : `${value}`;
              return `$${displayValue}`;
            } else if (section.id === "kilometerRange") {
              if (value === section.min && section.min === 0) return "0 km";
              if (value === section.max && section.max === 200000)
                return t("200000 km");
              const kmText = "km";
              const displayValue =
                value >= 1000 ? `${Math.floor(value / 1000)}k` : `${value}`;
              return `${displayValue} ${kmText}`;
            }
            return value.toLocaleString();
          }}
          title={section.title}
          unit={section.unit}
        />
      </View>
    );
  };

  const renderSearchInput = () => (
    <TextInput
      style={[localStyles.searchInput, isArabic && localStyles.rtlTextInput]}
      value={selectedValue || ""}
      onChangeText={(text) => onSelectionChange(section.id, text)}
      placeholder={t(`Search ${section.title.toLowerCase()}...`)}
    />
  );

  const renderCheckboxOptions = () => (
    <View style={localStyles.checkboxOptionsContainer}>
      {filteredOptions.map((item: FilterOption) => {
        const isSelected =
          section.type === "multiple"
            ? selectedValue?.includes?.(item.value)
            : selectedValue === item.value;
        return (
          <TouchableOpacity
            key={item.id}
            style={[localStyles.compactCheckboxOption, rtlViewStyle]}
            onPress={() => {
              if (section.type === "multiple") {
                const currentValues = selectedValue || [];
                const newValues = isSelected
                  ? currentValues.filter((v: any) => v !== item.value)
                  : [...currentValues, item.value];
                onSelectionChange(section.id, newValues);
              } else {
                onSelectionChange(section.id, item.value);
              }
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                localStyles.compactCheckbox,
                isSelected && localStyles.checkboxSelected,
              ]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={12} color="#ffffff" />
              )}
            </View>
            <Text style={[localStyles.compactCheckboxText, rtlStyle]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View>
      {section.type === "range" ? (
        renderRangeInput()
      ) : (
        <View style={localStyles.sectionContainer}>
          <TouchableOpacity
            style={[localStyles.sectionHeader, rtlViewStyle]}
            onPress={onToggleExpanded}
          >
            <Text style={[localStyles.sectionTitle, rtlStyle]}>
              {section.title}
            </Text>

            {!isCheckboxSection && (
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#666"
              />
            )}
          </TouchableOpacity>

          {(isExpanded || isCheckboxSection) && (
            <View style={localStyles.sectionContent}>
              {(section.type === "single" || section.type === "multiple") &&
                !isCheckboxSection && (
                  <>
                    {section.options && section.options.length > 5 && (
                      <TextInput
                        style={[
                          localStyles.searchInput,
                          isArabic && localStyles.rtlTextInput,
                        ]}
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholder={t(
                          `Search ${section.title.toLowerCase()}...`
                        )}
                      />
                    )}
                    <View style={localStyles.optionsContainer}>
                      <FlatList
                        data={filteredOptions}
                        renderItem={renderOption}
                        keyExtractor={(item) => item.id}
                        style={localStyles.optionsList}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                      />
                    </View>
                  </>
                )}

              {isCheckboxSection && renderCheckboxOptions()}
            </View>
          )}
        </View>
      )}
    </View>
  );
});

export default FilterSectionComponent;

const localStyles = StyleSheet.create({
  sectionContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#323332",
  },
  renderRangeInputstyle: {
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  expandIcon: {
    fontSize: 18,
    color: "#666",
  },
  sectionContent: {
    padding: 16,
    backgroundColor: "#fdfdfd",
  },
  optionsContainer: {},
  optionsList: {},
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 4,
    backgroundColor: "#f0f0f0",
  },
  selectedOption: {
    backgroundColor: "#b80200",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  selectedOptionText: {
    color: "#fff",
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 16,
    color: "#fff",
    marginLeft: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: "#fff",
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
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  rangeInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#fff",
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
    color: "#333",
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    position: "relative",
    marginHorizontal: 10,
  },
  sliderSelectedTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#b80200",
    position: "absolute",
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#b80200",
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff",
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
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  compactCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#dee2e6",
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#b80200",
    borderColor: "#b80200",
  },
  compactCheckboxText: {
    paddingHorizontal: 5,
    fontSize: 14,
    color: "#495057",
  },
});
