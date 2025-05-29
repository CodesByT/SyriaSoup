import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder,
}: SearchBarProps) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  console.log("SearchBar: Rendering with value:", value);

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <Ionicons
        name="search"
        size={20}
        color={isFocused ? "#b80200" : "#313332"}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || t("search.placeholder")}
        placeholderTextColor={isFocused ? "#b80200" : "#313332"}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8, // Reduced vertical margin
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#313332",
    zIndex: 1, // Ensure no overlap with header
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
    paddingTop: 0, // Adjust this value
    paddingBottom: 0, // Adjust this value as well
  },
});
