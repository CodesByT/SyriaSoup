"use client";

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useRTL } from "../../hooks/useRTL";
import { addCar } from "../../utils/api";
import { arabicMakes, makes } from "../../utils/constants";

export default function PlaceAd() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { isRTL, rtlStyle, getFlexDirection } = useRTL();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    price_usd: "",
    year: "",
    kilometer: "",
    number_of_cylinders: "",
    location: "",
    transmission: "",
    fuel_type: "",
    exterior_color: "",
    interior_color: "",
    selected_features: [] as string[],
    description: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const [modalOptions, setModalOptions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Get makes based on current language
  const makeOptions = isRTL
    ? arabicMakes.map((make) => make.label)
    : makes.map((make) => make.label);

  // Get models based on selected make and current language
  const getModelOptions = (selectedMake: string) => {
    if (!selectedMake) return [];

    if (isRTL) {
      const arabicMake = arabicMakes.find(
        (make) => make.label === selectedMake
      );
      return arabicMake?.models || [];
    } else {
      const englishMake = makes.find((make) => make.label === selectedMake);
      return englishMake?.models || [];
    }
  };

  const modelOptions = getModelOptions(formData.make);

  const cylinderOptions = [t("1"), t("2"), t("4"), t("6"), t("8"), t("Other")];
  const locationOptions = [
    t("Aleppo"),
    t("Damascus"),
    t("Daraa"),
    t("Deir_ez_Zor"),
    t("Hama"),
    t("Hasaka"),
    t("Homs"),
    t("Idlib"),
    t("Latakia"),
    t("Qamishli"),
    t("Raqqa"),
    t("Suweida"),
    t("Tartus"),
  ];
  const transmissionOptions = [t("Automatic"), t("Manual")];
  const fuelTypeOptions = [
    t("Petrol"),
    t("Diesel"),
    t("Electric"),
    t("Hybrid"),
  ];
  const colorOptions = [
    t("Black"),
    t("White"),
    t("Red"),
    t("Blue"),
    t("Silver"),
    t("Other"),
  ];
  const featureOptions = [
    t("ThreeSixty_degree_camera"),
    t("Adaptive_headlights"),
    t("Blind_spot_warning"),
    t("Cooled_Seats"),
    t("Heated_seats"),
    t("LED_headlights"),
    t("Performance_tyres"),
    t("Sound_system"),
    t("ABS"),
    t("Bluetooth"),
    t("Extensive_tool_kit"),
    t("Keyless_start"),
    t("Memory_seat"),
    t("Reversing_camera"),
    t("Traction_control"),
    t("Active_head_restraints"),
    t("Blind_spot_alert"),
    t("Forward_collision_warning"),
    t("Leather_seats"),
    t("Navigation_system"),
    t("Side_airbags"),
    t("USB_port"),
  ];

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | string[]
  ) => {
    if (field === "make") {
      // Clear model when make changes
      setFormData({ ...formData, [field]: value as string, model: "" });
    } else if (field === "selected_features") {
      setFormData({ ...formData, [field]: value as string[] });
    } else {
      setFormData({ ...formData, [field]: value as string });
    }
  };

  const toggleFeature = (feature: string) => {
    const newFeatures = formData.selected_features.includes(feature)
      ? formData.selected_features.filter((f) => f !== feature)
      : [...formData.selected_features, feature];
    handleInputChange("selected_features", newFeatures);
  };

  const getFilteredOptions = (options: string[], query: string) => {
    if (!query.trim()) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(query.toLowerCase())
    );
  };

  const openPicker = (field: string, options: string[]) => {
    setCurrentField(field);
    setModalOptions(options);
    setSearchQuery(""); // Reset search when opening picker
    setModalVisible(true);
  };

  const selectOption = (value: string) => {
    if (currentField === "selected_features") {
      // This shouldn't happen in this context, but for type safety
      return;
    }
    handleInputChange(currentField as keyof typeof formData, value);
    setSearchQuery(""); // Clear search when selecting
    setModalVisible(false);
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("error"), t("media_library_permission_required"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 20 - images.length,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert(t("error"), t("please_login"));
      return;
    }

    console.log("Starting form submission...");
    console.log("Form data:", formData);
    console.log("Images:", images.length);

    setLoading(true);
    try {
      const data = new FormData();

      // Map frontend fields to backend fields exactly as expected
      data.append("make", formData.make);
      data.append("model", formData.model);
      data.append("priceUSD", formData.price_usd);
      data.append("year", formData.year);
      data.append("kilometer", formData.kilometer);
      data.append("engineSize", formData.number_of_cylinders); // Backend expects engineSize, not numberOfCylinders
      data.append("location", formData.location);
      data.append("transmission", formData.transmission);
      data.append("fuelType", formData.fuel_type);
      data.append("exteriorColor", formData.exterior_color);
      data.append("interiorColor", formData.interior_color);
      data.append(
        "selectedFeatures",
        JSON.stringify(formData.selected_features)
      );
      data.append("description", formData.description);

      console.log("Adding images to FormData...");

      // Use EXACTLY the same approach as edit-listing.tsx
      images.forEach((uri, index) => {
        const fileType = uri.split(".").pop() || "jpg";
        const name = `image-${Date.now()}-${index}.${fileType}`;

        console.log(`Adding image ${index + 1}:`, name);

        // Use "images" field name - EXACTLY like edit-listing.tsx
        data.append("images", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          type: `image/${fileType}`,
          name,
        } as any);
      });

      console.log("Sending request to API...");
      const response = await addCar(data);
      console.log("API Response:", response.data);

      Alert.alert(t("success"), t("car_listing_created"));

      // Reset form
      setFormData({
        make: "",
        model: "",
        price_usd: "",
        year: "",
        kilometer: "",
        number_of_cylinders: "",
        location: "",
        transmission: "",
        fuel_type: "",
        exterior_color: "",
        interior_color: "",
        selected_features: [],
        description: "",
      });
      setImages([]);
      router.push("/(tabs)");
    } catch (error: any) {
      console.error("PlaceAd: Error submitting listing:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert(
        t("error"),
        error.response?.data?.message ||
          error.message ||
          t("failed_to_create_car")
      );
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <View style={styles.form}>
      <Text style={[styles.section_title, rtlStyle]}>{t("general_info")}</Text>
      <View style={styles.section_divider} />

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("make")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("make", makeOptions)}
        >
          <Text
            style={[
              styles.picker_text,
              !formData.make && styles.placeholder,
              rtlStyle,
            ]}
          >
            {formData.make || t("select_make")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("model")}</Text>
        <TouchableOpacity
          style={[
            styles.picker,
            { flexDirection: getFlexDirection() },
            !formData.make && styles.picker_disabled,
          ]}
          onPress={() => formData.make && openPicker("model", modelOptions)}
          disabled={!formData.make}
        >
          <Text
            style={[
              styles.picker_text,
              (!formData.model || !formData.make) && styles.placeholder,
              rtlStyle,
            ]}
          >
            {formData.make
              ? formData.model || t("select_model")
              : t("select_make_first")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color={!formData.make ? "#999999" : "#314352"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("price_usd")}</Text>
        <TextInput
          style={[styles.input, styles.left_align, rtlStyle]}
          value={formData.price_usd}
          onChangeText={(value) => handleInputChange("price_usd", value)}
          placeholder="$"
          placeholderTextColor="#999999"
          keyboardType="numeric"
          textAlign={isRTL ? "right" : "left"}
        />
      </View>

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("year")}</Text>
        <TextInput
          style={[styles.input, styles.left_align, rtlStyle]}
          value={formData.year}
          onChangeText={(value) => handleInputChange("year", value)}
          placeholder={t("year_placeholder")}
          placeholderTextColor="#999999"
          keyboardType="numeric"
          textAlign={isRTL ? "right" : "left"}
        />
      </View>

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("kilometer")}</Text>
        <TextInput
          style={[styles.input, styles.left_align, rtlStyle]}
          value={formData.kilometer}
          onChangeText={(value) => handleInputChange("kilometer", value)}
          placeholder={t("kilometer_placeholder")}
          placeholderTextColor="#999999"
          keyboardType="numeric"
          textAlign={isRTL ? "right" : "left"}
        />
      </View>

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("number_of_cylinders")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("number_of_cylinders", cylinderOptions)}
        >
          <Text
            style={[
              styles.picker_text,
              !formData.number_of_cylinders && styles.placeholder,
              rtlStyle,
            ]}
          >
            {formData.number_of_cylinders || t("select_cylinders")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("location")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("location", locationOptions)}
        >
          <Text
            style={[
              styles.picker_text,
              !formData.location && styles.placeholder,
              rtlStyle,
            ]}
          >
            {formData.location || t("select_location")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("transmission")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("transmission", transmissionOptions)}
        >
          <Text
            style={[
              styles.picker_text,
              !formData.transmission && styles.placeholder,
              rtlStyle,
            ]}
          >
            {formData.transmission || t("select_transmission")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("fuel_type")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("fuel_type", fuelTypeOptions)}
        >
          <Text
            style={[
              styles.picker_text,
              !formData.fuel_type && styles.placeholder,
              rtlStyle,
            ]}
          >
            {formData.fuel_type || t("select_fuel_type")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("exterior_color")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("exterior_color", colorOptions)}
        >
          <Text
            style={[
              styles.picker_text,
              !formData.exterior_color && styles.placeholder,
              rtlStyle,
            ]}
          >
            {formData.exterior_color || t("select_exterior_color")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("interior_color")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("interior_color", colorOptions)}
        >
          <Text
            style={[
              styles.picker_text,
              !formData.interior_color && styles.placeholder,
              rtlStyle,
            ]}
          >
            {formData.interior_color || t("select_interior_color")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.section_title, rtlStyle]}>{t("features")}</Text>
      <View style={styles.section_divider} />
      <View style={styles.feature_container}>
        {featureOptions.map((feature) => (
          <TouchableOpacity
            key={feature}
            style={[
              styles.feature_item,
              { flexDirection: getFlexDirection() },
              formData.selected_features.includes(feature) &&
                styles.feature_item_active,
            ]}
            onPress={() => toggleFeature(feature)}
          >
            <View style={styles.checkbox}>
              {formData.selected_features.includes(feature) && (
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              )}
            </View>
            <Text
              style={[
                styles.feature_text,
                rtlStyle,
                { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
                formData.selected_features.includes(feature) &&
                  styles.feature_text_active,
              ]}
            >
              {feature}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.section_title, rtlStyle]}>{t("description")}</Text>
      <View style={styles.section_divider} />
      <TextInput
        style={[styles.input, styles.text_area, rtlStyle]}
        value={formData.description}
        onChangeText={(value) => handleInputChange("description", value)}
        placeholder={t("description")}
        placeholderTextColor="#999999"
        multiline
        numberOfLines={8}
        textAlign={isRTL ? "right" : "left"}
      />

      <Text style={[styles.section_title, rtlStyle]}>{t("gallery")}</Text>
      <View style={styles.section_divider} />
      <TouchableOpacity
        style={[
          styles.image_picker_button,
          { flexDirection: getFlexDirection() },
        ]}
        onPress={pickImages}
      >
        <Ionicons name="image-outline" size={24} color="#B80200" />
        <Text
          style={[
            styles.image_picker_text,
            rtlStyle,
            { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
          ]}
        >
          {t("choose_images")}
        </Text>
      </TouchableOpacity>

      <View style={styles.image_preview}>
        {images.map((uri, index) => (
          <View key={index} style={styles.image_item}>
            <Image
              source={{ uri }}
              style={styles.preview_image}
              contentFit="cover"
            />
            <TouchableOpacity
              style={styles.remove_image_button}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={20} color="#B80200" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.submit_button, loading && styles.submit_button_disabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={[styles.submit_button_text, rtlStyle]}>
            {t("add_listing")}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
        <Text style={[styles.headerTitle, rtlStyle]}>{t("add_listing")}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <FlatList
          data={[0]}
          renderItem={renderForm}
          keyExtractor={() => "form"}
          contentContainerStyle={styles.list_content}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal_container}>
          <View style={styles.modal_content}>
            {/* Search Input - only show for make and model */}
            {(currentField === "make" || currentField === "model") && (
              <View style={styles.search_container}>
                <View
                  style={[
                    styles.search_input_container,
                    { flexDirection: getFlexDirection() },
                  ]}
                >
                  <Ionicons
                    name="search"
                    size={20}
                    color="#B80200"
                    style={
                      isRTL ? styles.search_icon_rtl : styles.search_icon_ltr
                    }
                  />
                  <TextInput
                    style={[styles.search_input, rtlStyle]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={
                      currentField === "make"
                        ? t("search_make")
                        : t("search_model")
                    }
                    placeholderTextColor="#999999"
                    textAlign={isRTL ? "right" : "left"}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      style={styles.clear_search}
                    >
                      <Ionicons name="close-circle" size={20} color="#999999" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <ScrollView style={styles.modal_scroll}>
              {getFilteredOptions(modalOptions, searchQuery).length > 0 ? (
                getFilteredOptions(modalOptions, searchQuery).map(
                  (option, index) => (
                    <TouchableOpacity
                      key={`${option}-${index}`}
                      style={styles.modal_item}
                      onPress={() => selectOption(option)}
                    >
                      <Text style={[styles.modal_text, rtlStyle]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  )
                )
              ) : (
                <View style={styles.no_results_container}>
                  <Text style={[styles.no_results_text, rtlStyle]}>
                    {t("no_results_found")}
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modal_close_button}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modal_close_text, rtlStyle]}>
                {t("cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // This new line will center the content horizontally
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  form: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  section_title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#314352",
    marginBottom: 8,
  },
  section_divider: {
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e0e0e0",
    marginBottom: 16,
  },
  input_container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#314352",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: "#314352",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  left_align: {
    textAlign: "left",
  },
  picker: {
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  picker_text: {
    flex: 1,
    fontSize: 16,
    color: "#314352",
  },
  placeholder: {
    color: "#999999",
  },
  text_area: {
    height: 120,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  feature_container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  feature_item: {
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 8,
  },
  feature_item_active: {
    backgroundColor: "#B80200",
    borderColor: "#B80200",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#314352",
    justifyContent: "center",
    alignItems: "center",
  },
  feature_text: {
    fontSize: 15,
    color: "#314352",
    fontWeight: "500",
  },
  feature_text_active: {
    color: "#ffffff",
  },
  image_picker_button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  image_picker_text: {
    fontSize: 16,
    color: "#B80200",
    fontWeight: "600",
  },
  image_preview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  image_item: {
    position: "relative",
  },
  preview_image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  remove_image_button: {
    position: "absolute",
    top: -10,
    right: -10,
  },
  submit_button: {
    backgroundColor: "#B80200",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#B80200",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submit_button_disabled: {
    backgroundColor: "#e57373",
    shadowColor: "transparent",
    elevation: 0,
  },
  submit_button_text: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  list_content: {
    paddingBottom: 40,
  },
  modal_container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modal_content: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "50%",
  },
  modal_item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modal_text: {
    fontSize: 16,
    color: "#314352",
  },
  modal_close_button: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginTop: 8,
  },
  modal_close_text: {
    fontSize: 16,
    color: "#B80200",
    fontWeight: "600",
  },
  picker_disabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#d0d0d0",
  },
  search_container: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 8,
  },
  search_input_container: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  search_input: {
    flex: 1,
    fontSize: 16,
    color: "#314352",
    paddingVertical: 0,
  },
  search_icon_ltr: {
    marginRight: 12,
  },
  search_icon_rtl: {
    marginLeft: 12,
  },
  clear_search: {
    padding: 4,
  },
  modal_scroll: {
    maxHeight: 300,
  },
  no_results_container: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  no_results_text: {
    fontSize: 16,
    color: "#999999",
    fontStyle: "italic",
  },
});

// "use client";

// import { Ionicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   FlatList,
//   Modal,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import Snackbar from "react-native-snackbar";
// import { useAuth } from "../../contexts/AuthContext";
// import { useRTL } from "../../hooks/useRTL";
// import { addCar } from "../../utils/api";
// import { arabicMakes, makes } from "../../utils/constants";

// export default function PlaceAd() {
//   const { t } = useTranslation();
//   const { isAuthenticated } = useAuth();
//   const { isRTL, rtlStyle, getFlexDirection } = useRTL();
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const [formData, setFormData] = useState({
//     make: "",
//     model: "",
//     price_usd: "",
//     year: "",
//     kilometer: "",
//     number_of_cylinders: "",
//     location: "",
//     transmission: "",
//     fuel_type: "",
//     exterior_color: "",
//     interior_color: "",
//     selected_features: [] as string[],
//     description: "",
//   });
//   const [images, setImages] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [currentField, setCurrentField] = useState("");
//   const [modalOptions, setModalOptions] = useState<string[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");

//   // Get makes based on current language
//   const makeOptions = isRTL
//     ? arabicMakes.map((make) => make.label)
//     : makes.map((make) => make.label);

//   // Get models based on selected make and current language
//   const getModelOptions = (selectedMake: string) => {
//     if (!selectedMake) return [];

//     if (isRTL) {
//       const arabicMake = arabicMakes.find(
//         (make) => make.label === selectedMake
//       );
//       return arabicMake?.models || [];
//     } else {
//       const englishMake = makes.find((make) => make.label === selectedMake);
//       return englishMake?.models || [];
//     }
//   };

//   const modelOptions = getModelOptions(formData.make);

//   const cylinderOptions = [t("1"), t("2"), t("4"), t("6"), t("8"), t("Other")];
//   const locationOptions = [
//     t("Aleppo"),
//     t("Damascus"),
//     t("Daraa"),
//     t("Deir_ez_Zor"),
//     t("Hama"),
//     t("Hasaka"),
//     t("Homs"),
//     t("Idlib"),
//     t("Latakia"),
//     t("Qamishli"),
//     t("Raqqa"),
//     t("Suweida"),
//     t("Tartus"),
//   ];
//   const transmissionOptions = [t("Automatic"), t("Manual")];
//   const fuelTypeOptions = [
//     t("Petrol"),
//     t("Diesel"),
//     t("Electric"),
//     t("Hybrid"),
//   ];
//   const colorOptions = [
//     t("Black"),
//     t("White"),
//     t("Red"),
//     t("Blue"),
//     t("Silver"),
//     t("Other"),
//   ];
//   const featureOptions = [
//     t("ThreeSixty_degree_camera"),
//     t("Adaptive_headlights"),
//     t("Blind_spot_warning"),
//     t("Cooled_Seats"),
//     t("Heated_seats"),
//     t("LED_headlights"),
//     t("Performance_tyres"),
//     t("Sound_system"),
//     t("ABS"),
//     t("Bluetooth"),
//     t("Extensive_tool_kit"),
//     t("Keyless_start"),
//     t("Memory_seat"),
//     t("Reversing_camera"),
//     t("Traction_control"),
//     t("Active_head_restraints"),
//     t("Blind_spot_alert"),
//     t("Forward_collision_warning"),
//     t("Leather_seats"),
//     t("Navigation_system"),
//     t("Side_airbags"),
//     t("USB_port"),
//   ];

//   const handleInputChange = (
//     field: keyof typeof formData,
//     value: string | string[]
//   ) => {
//     if (field === "make") {
//       // Clear model when make changes
//       setFormData({ ...formData, [field]: value as string, model: "" });
//     } else if (field === "selected_features") {
//       setFormData({ ...formData, [field]: value as string[] });
//     } else {
//       setFormData({ ...formData, [field]: value as string });
//     }
//   };

//   const toggleFeature = (feature: string) => {
//     const newFeatures = formData.selected_features.includes(feature)
//       ? formData.selected_features.filter((f) => f !== feature)
//       : [...formData.selected_features, feature];
//     handleInputChange("selected_features", newFeatures);
//   };

//   const getFilteredOptions = (options: string[], query: string) => {
//     if (!query.trim()) return options;
//     return options.filter((option) =>
//       option.toLowerCase().includes(query.toLowerCase())
//     );
//   };

//   const openPicker = (field: string, options: string[]) => {
//     setCurrentField(field);
//     setModalOptions(options);
//     setSearchQuery(""); // Reset search when opening picker
//     setModalVisible(true);
//   };

//   const selectOption = (value: string) => {
//     if (currentField === "selected_features") {
//       // This shouldn't happen in this context, but for type safety
//       return;
//     }
//     handleInputChange(currentField as keyof typeof formData, value);
//     setSearchQuery(""); // Clear search when selecting
//     setModalVisible(false);
//   };

//   const pickImages = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Snackbar.show({
//         text: t("media_library_permission_required"),
//         duration: 1000,
//         backgroundColor: "#B80200",
//         textColor: "#fff",
//       });
//       // Alert.alert(t("error"), t("media_library_permission_required"));
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsMultipleSelection: true,
//       selectionLimit: 20 - images.length,
//       quality: 0.7,
//     });

//     if (!result.canceled) {
//       const newImages = result.assets.map((asset) => asset.uri);
//       setImages([...images, ...newImages]);
//     }
//   };

//   const removeImage = (index: number) => {
//     setImages(images.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async () => {
//     if (!isAuthenticated) {
//       Snackbar.show({
//         text: t("please_login"),
//         duration: 1000,
//         backgroundColor: "#B80200",
//         textColor: "#fff",
//       });
//       // Alert.alert(t("error"), t("please_login"));
//       return;
//     }

//     setLoading(true);
//     try {
//       const data = new FormData();
//       const fieldMapping: { [key: string]: string } = {
//         make: "make",
//         model: "model",
//         price_usd: "priceUSD",
//         year: "year",
//         kilometer: "kilometer",
//         number_of_cylinders: "numberOfCylinders",
//         location: "location",
//         transmission: "transmission",
//         fuel_type: "fuelType",
//         exterior_color: "exteriorColor",
//         interior_color: "interiorColor",
//         selected_features: "selectedFeatures",
//         description: "description",
//       };

//       Object.entries(formData).forEach(([key, value]) => {
//         const backendKey = fieldMapping[key] || key;
//         if (backendKey === "selectedFeatures") {
//           data.append(backendKey, JSON.stringify(value));
//         } else {
//           data.append(backendKey, value as string);
//         }
//       });

//       images.forEach((uri, index) => {
//         const fileType = uri.split(".").pop();
//         const name = `image-${index}.${fileType}`;
//         data.append("files", {
//           uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
//           type: `image/${fileType}`,
//           name,
//         } as any);
//       });

//       await addCar(data);
//       Snackbar.show({
//         text: t("car_listing_created"),
//         duration: 1000,
//         backgroundColor: "green",
//         textColor: "#fff",
//       });
//       // Alert.alert(t("success"), t("car_listing_created"));
//       setFormData({
//         make: "",
//         model: "",
//         price_usd: "",
//         year: "",
//         kilometer: "",
//         number_of_cylinders: "",
//         location: "",
//         transmission: "",
//         fuel_type: "",
//         exterior_color: "",
//         interior_color: "",
//         selected_features: [],
//         description: "",
//       });
//       setImages([]);
//       router.push("/(tabs)");
//     } catch (error: any) {
//       // console.error("PlaceAd: Error submitting listing:", error);
//       Snackbar.show({
//         text: t("failed_to_create_car"),
//         duration: 1000,
//         backgroundColor: "#B80200",
//         textColor: "#fff",
//       });
//       // Alert.alert(t("error"), error.message || t("failed_to_create_car"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderForm = () => (
//     <View style={styles.form}>
//       <Text style={[styles.section_title, rtlStyle]}>{t("general_info")}</Text>
//       <View style={styles.section_divider} />

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("make")}</Text>
//         <TouchableOpacity
//           style={[styles.picker, { flexDirection: getFlexDirection() }]}
//           onPress={() => openPicker("make", makeOptions)}
//         >
//           <Text
//             style={[
//               styles.picker_text,
//               !formData.make && styles.placeholder,
//               rtlStyle,
//             ]}
//           >
//             {formData.make || t("select_make")}
//           </Text>
//           <Ionicons
//             name={isRTL ? "chevron-back" : "chevron-forward"}
//             size={20}
//             color="#314352"
//           />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("model")}</Text>
//         <TouchableOpacity
//           style={[
//             styles.picker,
//             { flexDirection: getFlexDirection() },
//             !formData.make && styles.picker_disabled,
//           ]}
//           onPress={() => formData.make && openPicker("model", modelOptions)}
//           disabled={!formData.make}
//         >
//           <Text
//             style={[
//               styles.picker_text,
//               (!formData.model || !formData.make) && styles.placeholder,
//               rtlStyle,
//             ]}
//           >
//             {formData.make
//               ? formData.model || t("select_model")
//               : t("select_make_first")}
//           </Text>
//           <Ionicons
//             name={isRTL ? "chevron-back" : "chevron-forward"}
//             size={20}
//             color={!formData.make ? "#999999" : "#314352"}
//           />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("price_usd")}</Text>
//         <TextInput
//           style={[styles.input, styles.left_align, rtlStyle]}
//           value={formData.price_usd}
//           onChangeText={(value) => handleInputChange("price_usd", value)}
//           placeholder="$"
//           placeholderTextColor="#999999"
//           keyboardType="numeric"
//           textAlign={isRTL ? "right" : "left"}
//         />
//       </View>

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("year")}</Text>
//         <TextInput
//           style={[styles.input, styles.left_align, rtlStyle]}
//           value={formData.year}
//           onChangeText={(value) => handleInputChange("year", value)}
//           placeholder={t("year_placeholder")}
//           placeholderTextColor="#999999"
//           keyboardType="numeric"
//           textAlign={isRTL ? "right" : "left"}
//         />
//       </View>

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("kilometer")}</Text>
//         <TextInput
//           style={[styles.input, styles.left_align, rtlStyle]}
//           value={formData.kilometer}
//           onChangeText={(value) => handleInputChange("kilometer", value)}
//           placeholder={t("kilometer_placeholder")}
//           placeholderTextColor="#999999"
//           keyboardType="numeric"
//           textAlign={isRTL ? "right" : "left"}
//         />
//       </View>

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("number_of_cylinders")}</Text>
//         <TouchableOpacity
//           style={[styles.picker, { flexDirection: getFlexDirection() }]}
//           onPress={() => openPicker("number_of_cylinders", cylinderOptions)}
//         >
//           <Text
//             style={[
//               styles.picker_text,
//               !formData.number_of_cylinders && styles.placeholder,
//               rtlStyle,
//             ]}
//           >
//             {formData.number_of_cylinders || t("select_cylinders")}
//           </Text>
//           <Ionicons
//             name={isRTL ? "chevron-back" : "chevron-forward"}
//             size={20}
//             color="#314352"
//           />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("location")}</Text>
//         <TouchableOpacity
//           style={[styles.picker, { flexDirection: getFlexDirection() }]}
//           onPress={() => openPicker("location", locationOptions)}
//         >
//           <Text
//             style={[
//               styles.picker_text,
//               !formData.location && styles.placeholder,
//               rtlStyle,
//             ]}
//           >
//             {formData.location || t("select_location")}
//           </Text>
//           <Ionicons
//             name={isRTL ? "chevron-back" : "chevron-forward"}
//             size={20}
//             color="#314352"
//           />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("transmission")}</Text>
//         <TouchableOpacity
//           style={[styles.picker, { flexDirection: getFlexDirection() }]}
//           onPress={() => openPicker("transmission", transmissionOptions)}
//         >
//           <Text
//             style={[
//               styles.picker_text,
//               !formData.transmission && styles.placeholder,
//               rtlStyle,
//             ]}
//           >
//             {formData.transmission || t("select_transmission")}
//           </Text>
//           <Ionicons
//             name={isRTL ? "chevron-back" : "chevron-forward"}
//             size={20}
//             color="#314352"
//           />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("fuel_type")}</Text>
//         <TouchableOpacity
//           style={[styles.picker, { flexDirection: getFlexDirection() }]}
//           onPress={() => openPicker("fuel_type", fuelTypeOptions)}
//         >
//           <Text
//             style={[
//               styles.picker_text,
//               !formData.fuel_type && styles.placeholder,
//               rtlStyle,
//             ]}
//           >
//             {formData.fuel_type || t("select_fuel_type")}
//           </Text>
//           <Ionicons
//             name={isRTL ? "chevron-back" : "chevron-forward"}
//             size={20}
//             color="#314352"
//           />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("exterior_color")}</Text>
//         <TouchableOpacity
//           style={[styles.picker, { flexDirection: getFlexDirection() }]}
//           onPress={() => openPicker("exterior_color", colorOptions)}
//         >
//           <Text
//             style={[
//               styles.picker_text,
//               !formData.exterior_color && styles.placeholder,
//               rtlStyle,
//             ]}
//           >
//             {formData.exterior_color || t("select_exterior_color")}
//           </Text>
//           <Ionicons
//             name={isRTL ? "chevron-back" : "chevron-forward"}
//             size={20}
//             color="#314352"
//           />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("interior_color")}</Text>
//         <TouchableOpacity
//           style={[styles.picker, { flexDirection: getFlexDirection() }]}
//           onPress={() => openPicker("interior_color", colorOptions)}
//         >
//           <Text
//             style={[
//               styles.picker_text,
//               !formData.interior_color && styles.placeholder,
//               rtlStyle,
//             ]}
//           >
//             {formData.interior_color || t("select_interior_color")}
//           </Text>
//           <Ionicons
//             name={isRTL ? "chevron-back" : "chevron-forward"}
//             size={20}
//             color="#314352"
//           />
//         </TouchableOpacity>
//       </View>

//       <Text style={[styles.section_title, rtlStyle]}>{t("features")}</Text>
//       <View style={styles.section_divider} />
//       <View style={styles.feature_container}>
//         {featureOptions.map((feature) => (
//           <TouchableOpacity
//             key={feature}
//             style={[
//               styles.feature_item,
//               { flexDirection: getFlexDirection() },
//               formData.selected_features.includes(feature) &&
//                 styles.feature_item_active,
//             ]}
//             onPress={() => toggleFeature(feature)}
//           >
//             <View style={styles.checkbox}>
//               {formData.selected_features.includes(feature) && (
//                 <Ionicons name="checkmark" size={14} color="#ffffff" />
//               )}
//             </View>
//             <Text
//               style={[
//                 styles.feature_text,
//                 rtlStyle,
//                 { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
//                 formData.selected_features.includes(feature) &&
//                   styles.feature_text_active,
//               ]}
//             >
//               {feature}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <Text style={[styles.section_title, rtlStyle]}>{t("description")}</Text>
//       <View style={styles.section_divider} />
//       <TextInput
//         style={[styles.input, styles.text_area, rtlStyle]}
//         value={formData.description}
//         onChangeText={(value) => handleInputChange("description", value)}
//         placeholder={t("description")}
//         placeholderTextColor="#999999"
//         multiline
//         numberOfLines={8}
//         textAlign={isRTL ? "right" : "left"}
//       />

//       <Text style={[styles.section_title, rtlStyle]}>{t("gallery")}</Text>
//       <View style={styles.section_divider} />
//       <TouchableOpacity
//         style={[
//           styles.image_picker_button,
//           { flexDirection: getFlexDirection() },
//         ]}
//         onPress={pickImages}
//       >
//         <Ionicons name="image-outline" size={24} color="#B80200" />
//         <Text
//           style={[
//             styles.image_picker_text,
//             rtlStyle,
//             { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
//           ]}
//         >
//           {t("choose_images")}
//         </Text>
//       </TouchableOpacity>

//       <View style={styles.image_preview}>
//         {images.map((uri, index) => (
//           <View key={index} style={styles.image_item}>
//             <Image
//               source={{ uri }}
//               style={styles.preview_image}
//               contentFit="cover"
//             />
//             <TouchableOpacity
//               style={styles.remove_image_button}
//               onPress={() => removeImage(index)}
//             >
//               <Ionicons name="close-circle" size={20} color="#B80200" />
//             </TouchableOpacity>
//           </View>
//         ))}
//       </View>

//       <TouchableOpacity
//         style={[styles.submit_button, loading && styles.submit_button_disabled]}
//         onPress={handleSubmit}
//         disabled={loading}
//       >
//         {loading ? (
//           <ActivityIndicator size="small" color="#ffffff" />
//         ) : (
//           <Text style={[styles.submit_button_text, rtlStyle]}>
//             {t("add_listing")}
//           </Text>
//         )}
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       {/* Header */}
//       <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
//         <Text style={[styles.headerTitle, rtlStyle]}>{t("add_listing")}</Text>
//       </View>

//       {/* Content */}
//       <View style={styles.content}>
//         <FlatList
//           data={[0]}
//           renderItem={renderForm}
//           keyExtractor={() => "form"}
//           contentContainerStyle={styles.list_content}
//           showsVerticalScrollIndicator={false}
//         />
//       </View>

//       <Modal
//         visible={modalVisible}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modal_container}>
//           <View style={styles.modal_content}>
//             {/* Search Input - only show for make and model */}
//             {(currentField === "make" || currentField === "model") && (
//               <View style={styles.search_container}>
//                 <View
//                   style={[
//                     styles.search_input_container,
//                     { flexDirection: getFlexDirection() },
//                   ]}
//                 >
//                   <Ionicons
//                     name="search"
//                     size={20}
//                     color="#B80200"
//                     style={
//                       isRTL ? styles.search_icon_rtl : styles.search_icon_ltr
//                     }
//                   />
//                   <TextInput
//                     style={[styles.search_input, rtlStyle]}
//                     value={searchQuery}
//                     onChangeText={setSearchQuery}
//                     placeholder={
//                       currentField === "make"
//                         ? t("search_make")
//                         : t("search_model")
//                     }
//                     placeholderTextColor="#999999"
//                     textAlign={isRTL ? "right" : "left"}
//                   />
//                   {searchQuery.length > 0 && (
//                     <TouchableOpacity
//                       onPress={() => setSearchQuery("")}
//                       style={styles.clear_search}
//                     >
//                       <Ionicons name="close-circle" size={20} color="#999999" />
//                     </TouchableOpacity>
//                   )}
//                 </View>
//               </View>
//             )}

//             <ScrollView style={styles.modal_scroll}>
//               {getFilteredOptions(modalOptions, searchQuery).length > 0 ? (
//                 getFilteredOptions(modalOptions, searchQuery).map(
//                   (option, index) => (
//                     <TouchableOpacity
//                       key={`${option}-${index}`}
//                       style={styles.modal_item}
//                       onPress={() => selectOption(option)}
//                     >
//                       <Text style={[styles.modal_text, rtlStyle]}>
//                         {option}
//                       </Text>
//                     </TouchableOpacity>
//                   )
//                 )
//               ) : (
//                 <View style={styles.no_results_container}>
//                   <Text style={[styles.no_results_text, rtlStyle]}>
//                     {t("no_results_found")}
//                   </Text>
//                 </View>
//               )}
//             </ScrollView>

//             <TouchableOpacity
//               style={styles.modal_close_button}
//               onPress={() => setModalVisible(false)}
//             >
//               <Text style={[styles.modal_close_text, rtlStyle]}>
//                 {t("cancel")}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#1a1a1a",
//   },
//   header: {
//     backgroundColor: "#1a1a1a",
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     alignItems: "center",
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     // This new line will center the content horizontally
//     justifyContent: "center",
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#ffffff",
//   },
//   content: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//   },
//   form: {
//     padding: 16,
//     backgroundColor: "#ffffff",
//   },
//   section_title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     color: "#314352",
//     marginBottom: 8,
//   },
//   section_divider: {
//     borderTopWidth: 2,
//     borderStyle: "dashed",
//     borderColor: "#e0e0e0",
//     marginBottom: 16,
//   },
//   input_container: {
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#314352",
//     marginBottom: 8,
//   },
//   input: {
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     padding: 14,
//     fontSize: 16,
//     color: "#314352",
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   left_align: {
//     textAlign: "left",
//   },
//   picker: {
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   picker_text: {
//     flex: 1,
//     fontSize: 16,
//     color: "#314352",
//   },
//   placeholder: {
//     color: "#999999",
//   },
//   text_area: {
//     height: 120,
//     textAlignVertical: "top",
//     marginBottom: 16,
//   },
//   feature_container: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     marginBottom: 16,
//   },
//   feature_item: {
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//     marginBottom: 8,
//   },
//   feature_item_active: {
//     backgroundColor: "#B80200",
//     borderColor: "#B80200",
//   },
//   checkbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 2,
//     borderColor: "#314352",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   feature_text: {
//     fontSize: 15,
//     color: "#314352",
//     fontWeight: "500",
//   },
//   feature_text_active: {
//     color: "#ffffff",
//   },
//   image_picker_button: {
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#ffffff",
//     borderWidth: 2,
//     borderStyle: "dashed",
//     borderColor: "#e0e0e0",
//     borderRadius: 8,
//     padding: 20,
//     marginBottom: 16,
//   },
//   image_picker_text: {
//     fontSize: 16,
//     color: "#B80200",
//     fontWeight: "600",
//   },
//   image_preview: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     marginBottom: 16,
//   },
//   image_item: {
//     position: "relative",
//   },
//   preview_image: {
//     width: 80,
//     height: 80,
//     borderRadius: 8,
//   },
//   remove_image_button: {
//     position: "absolute",
//     top: -10,
//     right: -10,
//   },
//   submit_button: {
//     backgroundColor: "#B80200",
//     padding: 16,
//     borderRadius: 8,
//     alignItems: "center",
//     shadowColor: "#B80200",
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   submit_button_disabled: {
//     backgroundColor: "#e57373",
//     shadowColor: "transparent",
//     elevation: 0,
//   },
//   submit_button_text: {
//     color: "#ffffff",
//     fontSize: 18,
//     fontWeight: "700",
//   },
//   list_content: {
//     paddingBottom: 40,
//   },
//   modal_container: {
//     flex: 1,
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     justifyContent: "flex-end",
//   },
//   modal_content: {
//     backgroundColor: "#ffffff",
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//     padding: 16,
//     maxHeight: "50%",
//   },
//   modal_item: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#e0e0e0",
//   },
//   modal_text: {
//     fontSize: 16,
//     color: "#314352",
//   },
//   modal_close_button: {
//     padding: 16,
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     marginTop: 8,
//   },
//   modal_close_text: {
//     fontSize: 16,
//     color: "#B80200",
//     fontWeight: "600",
//   },
//   picker_disabled: {
//     backgroundColor: "#f0f0f0",
//     borderColor: "#d0d0d0",
//   },
//   search_container: {
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#e0e0e0",
//     marginBottom: 8,
//   },
//   search_input_container: {
//     backgroundColor: "#f8f9fa",
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//     alignItems: "center",
//   },
//   search_input: {
//     flex: 1,
//     fontSize: 16,
//     color: "#314352",
//     paddingVertical: 0,
//   },
//   search_icon_ltr: {
//     marginRight: 12,
//   },
//   search_icon_rtl: {
//     marginLeft: 12,
//   },
//   clear_search: {
//     padding: 4,
//   },
//   modal_scroll: {
//     maxHeight: 300,
//   },
//   no_results_container: {
//     padding: 32,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   no_results_text: {
//     fontSize: 16,
//     color: "#999999",
//     fontStyle: "italic",
//   },
// });
