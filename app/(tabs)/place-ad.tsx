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

  const makeOptions = [
    "Chrysler",
    "Toyota",
    "Honda",
    "Ford",
    "BMW",
    "Mercedes",
    "Other",
  ];
  const modelOptions = ["Sedan", "SUV", "Coupe", "Convertible", "Other"];
  const cylinderOptions = ["4", "6", "8", "Other"];
  const locationOptions = ["Damascus", "Aleppo", "Homs", "Latakia", "Other"];
  const transmissionOptions = ["Automatic", "Manual"];
  const fuelTypeOptions = ["Petrol", "Diesel", "Electric", "Hybrid"];
  const colorOptions = ["Black", "White", "Red", "Blue", "Silver", "Other"];
  const featureOptions = [
    "360-degree camera",
    "Adaptive headlights",
    "Blind-spot warning",
    "Cooled Seats",
    "Heated seats",
    "LED headlights",
    "Performance tyres",
    "Sound system",
    "ABS",
    "Bluetooth",
    "Extensive tool kit",
    "Keyless start",
    "Memory seat",
    "Reversing camera",
    "Traction control",
    "Active head restraints",
    "Blind spot alert",
    "Forward-collision warning",
    "Leather seats",
    "Navigation system",
    "Side airbags",
    "USB port",
  ];

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | string[]
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleFeature = (feature: string) => {
    const newFeatures = formData.selected_features.includes(feature)
      ? formData.selected_features.filter((f) => f !== feature)
      : [...formData.selected_features, feature];
    handleInputChange("selected_features", newFeatures);
  };

  const openPicker = (field: string, options: string[]) => {
    setCurrentField(field);
    setModalOptions(options);
    setModalVisible(true);
  };

  const selectOption = (value: string) => {
    handleInputChange(currentField as keyof typeof formData, value);
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

    setLoading(true);
    try {
      const data = new FormData();
      const fieldMapping: { [key: string]: string } = {
        make: "make",
        model: "model",
        price_usd: "priceUSD",
        year: "year",
        kilometer: "kilometer",
        number_of_cylinders: "numberOfCylinders",
        location: "location",
        transmission: "transmission",
        fuel_type: "fuelType",
        exterior_color: "exteriorColor",
        interior_color: "interiorColor",
        selected_features: "selectedFeatures",
        description: "description",
      };

      Object.entries(formData).forEach(([key, value]) => {
        const backendKey = fieldMapping[key] || key;
        if (backendKey === "selectedFeatures") {
          data.append(backendKey, JSON.stringify(value));
        } else {
          data.append(backendKey, value as string);
        }
      });

      images.forEach((uri, index) => {
        const fileType = uri.split(".").pop();
        const name = `image-${index}.${fileType}`;
        data.append("files", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          type: `image/${fileType}`,
          name,
        } as any);
      });

      await addCar(data);
      Alert.alert(t("success"), t("car_listing_created"));
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
      Alert.alert(t("error"), error.message || t("failed_to_create_car"));
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
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("model", modelOptions)}
        >
          <Text
            style={[
              styles.picker_text,
              !formData.model && styles.placeholder,
              rtlStyle,
            ]}
          >
            {formData.model || t("select_model")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
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
            <ScrollView>
              {modalOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modal_item}
                  onPress={() => selectOption(option)}
                >
                  <Text style={[styles.modal_text, rtlStyle]}>{option}</Text>
                </TouchableOpacity>
              ))}
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
});
