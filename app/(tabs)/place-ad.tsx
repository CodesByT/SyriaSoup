import i18n from "@/i18n";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
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
import { showToastable } from "react-native-toastable"; // Assuming this is correct import
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useAuth } from "../../contexts/AuthContext";
import { useRTL } from "../../hooks/useRTL";
import { addCar } from "../../utils/api";
import {
  arabicMakes,
  colorOptionsData,
  cylinderOptionsData,
  featureOptionsData,
  fuelTypeOptionsData,
  interiorColorOptionsData,
  locationOptionsData,
  makes,
  transmissionOptionsData,
} from "../../utils/constants"; // Import new data structures

export default function PlaceAd() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { isRTL, rtlStyle, getFlexDirection } = useRTL();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [languageSwitcherWidth, setLanguageSwitcherWidth] = useState(0);

  const [formData, setFormData] = useState({
    make: "", // Stores English key (from makes.label)
    model: "", // Stores English key (from makes.models)
    price_usd: "",
    year: "",
    kilometer: "",
    number_of_cylinders: "", // Stores English value (e.g., "3", "Other")
    location: "", // Stores English value (e.g., "Damascus")
    transmission: "", // Stores English value (e.g., "Automatic")
    fuel_type: "", // Stores English value (e.g., "Petrol")
    exterior_color: "", // Stores English value (e.g., "Black")
    interior_color: "", // Stores English value (e.g., "Black")
    selected_features: [] as string[], // Stores English values (e.g., "360-degree camera")
    description: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const [modalOptions, setModalOptions] = useState<string[]>([]); // These will hold the *display values* (en or ar)
  const [searchQuery, setSearchQuery] = useState("");

  const getEnglishValueFromDisplayValue = (
    translatedValue: string,
    field: string
  ): string => {
    // If not RTL, the displayed value is already the English value (or the English key for makes/models)
    if (!isRTL) {
      return translatedValue;
    }

    // Special handling for 'make' and 'model' due to their nested structure
    if (field === "make") {
      const arabicMake = arabicMakes.find((m) => m.label === translatedValue);
      return arabicMake?.enValue || translatedValue;
    }
    if (field === "model") {
      const selectedEnglishMake = formData.make; // This is the English make stored in formData
      const englishMakeObj = makes.find((m) => m.label === selectedEnglishMake);
      if (englishMakeObj) {
        // Iterate through the English models of the selected make
        for (const modelKey of englishMakeObj.models) {
          // Check if the Arabic translation of this English model key matches the displayed value
          if (
            arabicMakes
              .find((am) => am.enValue === selectedEnglishMake)
              ?.models.includes(translatedValue) &&
            i18n.t(modelKey, { lng: "ar" }) === translatedValue
          ) {
            return modelKey; // Found the English key (which for models is the value)
          }
        }
      }
      return translatedValue; // Fallback if not found
    }

    // For all other fields (cylinder, location, transmission, etc., and features)
    // We iterate through their respective data arrays to find the English 'en' value
    let dataArray: { key: string; en: string; ar: string }[] = [];
    switch (field) {
      case "number_of_cylinders":
        dataArray = cylinderOptionsData;
        break;
      case "location":
        dataArray = locationOptionsData;
        break;
      case "transmission":
        dataArray = transmissionOptionsData;
        break;
      case "fuel_type":
        dataArray = fuelTypeOptionsData;
        break;
      case "exterior_color":
        dataArray = colorOptionsData;
        break;
      case "interior_color":
        dataArray = interiorColorOptionsData;
        break;
      case "selected_features":
        dataArray = featureOptionsData;
        break;
      default:
        break;
    }

    for (const item of dataArray) {
      if (item.ar === translatedValue) {
        return item.en; // Return 'en' value for storage
      }
    }
    return translatedValue; // Fallback: if no match, store the original (Arabic) value
  };

  const getDisplayValue = (
    field: keyof typeof formData,
    englishValue: string
  ): string => {
    if (!englishValue) return "";

    // For make and model, use the existing complex logic
    if (field === "make") {
      if (isRTL) {
        const arabicMake = arabicMakes.find((m) => m.enValue === englishValue);
        return arabicMake?.label || englishValue; // Directly return Arabic label or English value
      }
      return englishValue; // Directly return English label
    }
    if (field === "model") {
      if (isRTL) {
        const arabicMake = arabicMakes.find((m) => m.enValue === formData.make);
        if (arabicMake) {
          // Find the Arabic model string that corresponds to the englishValue
          const arabicModelDisplay = arabicMake.models.find(
            (m) => getEnglishValueFromDisplayValue(m, "model") === englishValue
          );
          return arabicModelDisplay || englishValue;
        }
        return englishValue;
      }
      return englishValue; // Directly return English model
    }

    // For other fields (cylinder, location, transmission, etc., and features)
    // Look up the display value from the data arrays based on current language
    let dataArray: { key: string; en: string; ar: string }[] = [];
    switch (field) {
      case "number_of_cylinders":
        dataArray = cylinderOptionsData;
        break;
      case "location":
        dataArray = locationOptionsData;
        break;
      case "transmission":
        dataArray = transmissionOptionsData;
        break;
      case "fuel_type":
        dataArray = fuelTypeOptionsData;
        break;
      case "exterior_color":
        dataArray = colorOptionsData;
        break;
      case "interior_color":
        dataArray = interiorColorOptionsData;
        break;
      case "selected_features":
        dataArray = featureOptionsData;
        break;
      default:
        return englishValue; // Fallback for other fields if not found in specific data
    }

    const foundItem = dataArray.find((item) => item.en === englishValue);
    if (foundItem) {
      return isRTL ? foundItem.ar : foundItem.en;
    }
    return englishValue; // Fallback if not found
  };

  const makeOptions = isRTL
    ? arabicMakes.map((make) => make.label)
    : makes.map((make) => make.label);

  // Model options: get models for the *currently selected English make*, then map to display strings
  const getModelOptions = (selectedMakeEnglish: string) => {
    if (!selectedMakeEnglish) return [];

    const englishMake = makes.find(
      (make) => make.label === selectedMakeEnglish
    );
    if (!englishMake) return [];

    if (isRTL) {
      const arabicMake = arabicMakes.find(
        (am) => am.enValue === selectedMakeEnglish
      );
      return arabicMake?.models || []; // Return Arabic model strings
    } else {
      return englishMake.models; // Return English model strings
    }
  };
  const modelOptions = getModelOptions(formData.make);

  // Other options: arrays of display strings (either 'en' or 'ar' based on current language)
  const cylinderDisplayOptions = cylinderOptionsData.map((item) =>
    isRTL ? item.ar : item.en
  );
  const locationDisplayOptions = locationOptionsData.map((item) =>
    isRTL ? item.ar : item.en
  );
  const transmissionDisplayOptions = transmissionOptionsData.map((item) =>
    isRTL ? item.ar : item.en
  );
  const fuelTypeDisplayOptions = fuelTypeOptionsData.map((item) =>
    isRTL ? item.ar : item.en
  );
  const colorDisplayOptions = colorOptionsData.map((item) =>
    isRTL ? item.ar : item.en
  );
  const interiorColorOptions = interiorColorOptionsData.map((item) =>
    isRTL ? item.ar : item.en
  );
  const featureDisplayOptions = featureOptionsData.map((item) =>
    isRTL ? item.ar : item.en
  );

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | string[]
  ) => {
    let valueToStore: string | string[] = value;

    // For dropdown/picker fields, convert the displayed `value` to its English value for storage
    if (
      [
        "make",
        "model",
        "number_of_cylinders",
        "location",
        "transmission",
        "fuel_type",
        "exterior_color",
        "interior_color",
        "selected_features",
      ].includes(field)
    ) {
      valueToStore = getEnglishValueFromDisplayValue(value as string, field);
    }
    // For text inputs (price_usd, year, kilometer, description), the `value` is already what needs to be stored.

    if (field === "make") {
      // If make changes, reset model as models depend on make
      setFormData({ ...formData, [field]: valueToStore as string, model: "" });
    } else {
      setFormData({ ...formData, [field]: valueToStore as string });
    }
  };

  /**
   * Toggles the selection of a feature.
   * @param featureDisplayValue The display value of the feature (Arabic or English).
   */
  const toggleFeature = (featureDisplayValue: string) => {
    // Get the English 'en' value for storage
    const englishValueToStore = getEnglishValueFromDisplayValue(
      featureDisplayValue,
      "selected_features"
    );

    const newFeatures = formData.selected_features.includes(englishValueToStore)
      ? formData.selected_features.filter((f) => f !== englishValueToStore)
      : [...formData.selected_features, englishValueToStore];
    setFormData({ ...formData, selected_features: newFeatures });
  };

  const getFilteredOptions = (options: string[], query: string) => {
    if (!query.trim()) return options;
    return options.filter((optionDisplayValue) =>
      optionDisplayValue.toLowerCase().includes(query.toLowerCase())
    );
  };

  const openPicker = (field: string, options: string[]) => {
    setCurrentField(field);
    setModalOptions(options); // Pass localized display strings to modalOptions
    setSearchQuery("");
    setModalVisible(true);
  };

  const selectOption = (selectedDisplayValue: string) => {
    // selectedDisplayValue is the actual string displayed and selected by the user (e.g., "كامري" or "Automatic")
    handleInputChange(
      currentField as keyof typeof formData,
      selectedDisplayValue
    );
    setSearchQuery("");
    setModalVisible(false);
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToastable({
        message: t("media_library_permission_required"),
        status: "warning",
        duration: 2000,
      });
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
      showToastable({
        message: t("please_login"),
        status: "warning",
        duration: 2000,
      });
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();

      // All formData values should already be in English values at this point
      data.append("make", formData.make);
      data.append("model", formData.model);
      data.append("priceUSD", formData.price_usd);
      data.append("year", formData.year);
      data.append("kilometer", formData.kilometer);
      data.append("engineSize", formData.number_of_cylinders);
      data.append("location", formData.location);
      data.append("transmission", formData.transmission);
      data.append("fuelType", formData.fuel_type);
      data.append("exteriorColor", formData.exterior_color);
      data.append("interiorColor", formData.interior_color);
      data.append(
        "selectedFeatures",
        JSON.stringify(formData.selected_features) // selected_features are now English 'en' values
      );
      data.append("description", formData.description); // Description remains as is

      images.forEach((uri, index) => {
        const fileType = uri.split(".").pop() || "jpg";
        const name = `image-${Date.now()}-${index}.${fileType}`;

        data.append("images", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          type: `image/${fileType}`,
          name,
        } as any);
      });

      const response = await addCar(data);
      showToastable({
        message: t("car_listing_created"),
        status: "success",
        duration: 2000,
      });
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
      router.push("/(tabs)");
    } catch (error: any) {
      showToastable({
        message: t("failed_to_create_car"),
        status: "warning",
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <KeyboardAvoidingView style={styles.form}>
      <Text style={[styles.section_title, rtlStyle]}>{t("add_listing")}</Text>
      <View style={styles.section_divider} />

      {/* Make Input */}
      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("Make")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("make", makeOptions)} // Pass display strings (Arabic or English)
        >
          <Text
            style={[
              styles.picker_text,
              !formData.make && styles.placeholder,
              rtlStyle,
            ]}
          >
            {getDisplayValue("make", formData.make) || t("select_make")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      {/* Model Input */}
      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("model")}</Text>
        <TouchableOpacity
          style={[
            styles.picker,
            { flexDirection: getFlexDirection() },
            !formData.make && styles.picker_disabled,
          ]}
          onPress={() => formData.make && openPicker("model", modelOptions)} // Pass English keys
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
              ? getDisplayValue("model", formData.model) || t("select_model")
              : t("select_make_first")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color={!formData.make ? "#999999" : "#314352"}
          />
        </TouchableOpacity>
      </View>

      {/* Price Input */}
      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("price_usd")}</Text>
        <TextInput
          style={[styles.input, styles.left_align, rtlStyle]}
          value={formData.price_usd}
          onChangeText={(value) => handleInputChange("price_usd", value)}
          placeholder={t("price_year_kilometer_place_holder")}
          placeholderTextColor="#999999"
          keyboardType="numeric"
          textAlign={isRTL ? "right" : "left"}
        />
      </View>

      {/* Year Input */}
      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("year")}</Text>
        <TextInput
          style={[styles.input, styles.left_align, rtlStyle]}
          value={formData.year}
          onChangeText={(value) => handleInputChange("year", value)}
          placeholder={t("price_year_kilometer_place_holder")}
          placeholderTextColor="#999999"
          keyboardType="numeric"
          textAlign={isRTL ? "right" : "left"}
        />
      </View>

      {/* Kilometer Input */}
      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("kilometer")}</Text>
        <TextInput
          style={[styles.input, styles.left_align, rtlStyle]}
          value={formData.kilometer}
          onChangeText={(value) => handleInputChange("kilometer", value)}
          placeholder={t("price_year_kilometer_place_holder")}
          placeholderTextColor="#999999"
          keyboardType="numeric"
          textAlign={isRTL ? "right" : "left"}
        />
      </View>

      {/* Number of Cylinders Input */}
      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("select_cylinders")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() =>
            openPicker("number_of_cylinders", cylinderDisplayOptions)
          } // Pass display strings
        >
          <Text
            style={[
              styles.picker_text,
              !formData.number_of_cylinders && styles.placeholder,
              rtlStyle,
            ]}
          >
            {getDisplayValue(
              "number_of_cylinders",
              formData.number_of_cylinders
            ) || t("select_cylinders")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      {/* Location Input */}
      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("location")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("location", locationDisplayOptions)} // Pass display strings
        >
          <Text
            style={[
              styles.picker_text,
              !formData.location && styles.placeholder,
              rtlStyle,
            ]}
          >
            {getDisplayValue("location", formData.location) ||
              t("select_location")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      {/* Transmission Input */}
      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("transmission")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("transmission", transmissionDisplayOptions)} // Pass display strings
        >
          <Text
            style={[
              styles.picker_text,
              !formData.transmission && styles.placeholder,
              rtlStyle,
            ]}
          >
            {getDisplayValue("transmission", formData.transmission) ||
              t("select_transmission")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      {/* Fuel Type Input */}
      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("fuel_type")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("fuel_type", fuelTypeDisplayOptions)} // Pass display strings
        >
          <Text
            style={[
              styles.picker_text,
              !formData.fuel_type && styles.placeholder,
              rtlStyle,
            ]}
          >
            {getDisplayValue("fuel_type", formData.fuel_type) ||
              t("select_fuel_type")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      {/* Exterior Color Input */}
      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("exterior_color")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("exterior_color", colorDisplayOptions)} // Pass display strings
        >
          <Text
            style={[
              styles.picker_text,
              !formData.exterior_color && styles.placeholder,
              rtlStyle,
            ]}
          >
            {getDisplayValue("exterior_color", formData.exterior_color) ||
              t("select_exterior_color")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      {/* Interior Color Input */}
      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("interior_color")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("interior_color", interiorColorOptions)} // Pass display strings
        >
          <Text
            style={[
              styles.picker_text,
              !formData.interior_color && styles.placeholder,
              rtlStyle,
            ]}
          >
            {getDisplayValue("interior_color", formData.interior_color) ||
              t("select_interior_color")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#314352"
          />
        </TouchableOpacity>
      </View>

      {/* Features Section */}
      <Text style={[styles.section_title, rtlStyle]}>{t("features")}</Text>
      <View style={styles.section_divider} />
      <View style={styles.feature_container}>
        {featureDisplayOptions.map(
          (
            featureDisplayValue // Iterate over display values
          ) => (
            <TouchableOpacity
              key={featureDisplayValue}
              style={[
                styles.feature_item,
                { flexDirection: getFlexDirection() },
                formData.selected_features.includes(
                  getEnglishValueFromDisplayValue(
                    featureDisplayValue,
                    "selected_features"
                  )
                ) && // Check against stored English value
                  styles.feature_item_active,
              ]}
              onPress={() => toggleFeature(featureDisplayValue)} // Pass display value
            >
              <View style={styles.checkbox}>
                {formData.selected_features.includes(
                  getEnglishValueFromDisplayValue(
                    featureDisplayValue,
                    "selected_features"
                  )
                ) && ( // Check against stored English value
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                )}
              </View>
              <Text
                style={[
                  styles.feature_text,
                  rtlStyle,
                  { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
                  formData.selected_features.includes(
                    getEnglishValueFromDisplayValue(
                      featureDisplayValue,
                      "selected_features"
                    )
                  ) && // Check against stored English value
                    styles.feature_text_active,
                ]}
              >
                {featureDisplayValue} {/* Display as is (already localized) */}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Description Input */}
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

      {/* Gallery Section */}
      <View
        style={[
          styles.sectionTitleContainer,
          { flexDirection: getFlexDirection() },
        ]}
      >
        <View style={styles.galleryTitleWrapper}>
          <Text style={[styles.section_titlee]}>{t("gallery")}</Text>
        </View>

        <View style={styles.galleryDescriptionWrapper}>
          <Text style={styles.new_text_style}>{t("gallery_description")}</Text>
        </View>
      </View>
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

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submit_button, loading && styles.submit_button_disabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={[styles.submit_button_text, rtlStyle]}>
            {t("add_listing2")}
          </Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 
      <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
        <Text style={[styles.headerTitle, rtlStyle]}>{t("add_listing")}</Text>
      </View>*/}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* LEFT SPACER VIEW - NOW USES DYNAMIC WIDTH */}
          <View
            style={[styles.headerSpacer, { width: languageSwitcherWidth }]}
          />

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, rtlStyle]}>
              {t("add_listing")}
            </Text>
          </View>
          {/* LANGUAGE SWITCHER CONTAINER - ADD ONLAYOUT PROP HERE */}
          <View
            style={styles.languageSwitcherContainer}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              if (width !== languageSwitcherWidth) {
                // Only update if width changed
                setLanguageSwitcherWidth(width);
              }
            }}
          >
            <LanguageSwitcher compact={true} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={[0]}
          renderItem={renderForm}
          keyExtractor={() => "form"}
          contentContainerStyle={styles.list_content}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Modal for Pickers */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal_container}>
          <View style={styles.modal_content}>
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
                        {option} {/* Display as is (already localized) */}
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
    backgroundColor: "#323332",
  },
  // header: {
  //   backgroundColor: "#323332",
  //   paddingHorizontal: 20,
  //   alignItems: "center",
  //   borderBottomLeftRadius: 20,
  //   borderBottomRightRadius: 20,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  //   elevation: 3,
  //   justifyContent: "center",
  // },
  // headerTitle: {
  //   fontSize: 24,
  //   fontWeight: "700",
  //   color: "#ffffff",
  //   paddingVertical: 15,
  // },
  header: {
    backgroundColor: "#323332",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Stays "space-between"
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerSpacer: {
    // This style will now dynamically get its width from state
    // We keep it empty here, as its width is set inline
  },
  headerTitleContainer: {
    flex: 1, // Remains flex: 1
    alignItems: "center", // Remains centered
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerLogo: {
    width: 150, // Adjust width as needed for your logo
    height: 40, // Adjust height as needed for your logo
  },
  languageSwitcherContainer: {
    // No changes needed here
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
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
    width: "100%",
    height: 50,
  },
  galleryTitleWrapper: {
    flexGrow: 0,
    flexShrink: 0,
  },
  new_text_style: {
    fontSize: 14,
    fontWeight: "200",
    color: "#000000",
    textAlign: "center",
    width: "100%",
  },
  galleryDescriptionWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  section_titlee: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
});

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
// import { showToastable } from "react-native-toastable";
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

//   const cylinderOptions = [
//     t("3"),
//     t("4"),
//     t("5"),
//     t("6"),
//     t("8"),
//     t("Other"),
//     t("Unknown"),
//   ];
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
//       showToastable({
//         message: t("media_library_permission_required"),
//         status: "warning",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
//       });
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ["images"],
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
//       showToastable({
//         message: t("please_login"),
//         status: "warning",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
//       });
//       return;
//     }

//     // console.log("Starting form submission...");
//     // console.log("Form data:", formData);
//     // console.log("Images:", images.length);

//     setLoading(true);
//     try {
//       const data = new FormData();

//       // Map frontend fields to backend fields exactly as expected
//       data.append("make", formData.make);
//       data.append("model", formData.model);
//       data.append("priceUSD", formData.price_usd);
//       data.append("year", formData.year);
//       data.append("kilometer", formData.kilometer);
//       data.append("engineSize", formData.number_of_cylinders); // Backend expects engineSize, not numberOfCylinders
//       data.append("location", formData.location);
//       data.append("transmission", formData.transmission);
//       data.append("fuelType", formData.fuel_type);
//       data.append("exteriorColor", formData.exterior_color);
//       data.append("interiorColor", formData.interior_color);
//       data.append(
//         "selectedFeatures",
//         JSON.stringify(formData.selected_features)
//       );
//       data.append("description", formData.description);

//       // console.log("Adding images to FormData...");

//       // Use EXACTLY the same approach as edit-listing.tsx
//       images.forEach((uri, index) => {
//         const fileType = uri.split(".").pop() || "jpg";
//         const name = `image-${Date.now()}-${index}.${fileType}`;

//         // console.log(`Adding image ${index + 1}:`, name);

//         // Use "images" field name - EXACTLY like edit-listing.tsx
//         data.append("images", {
//           uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
//           type: `image/${fileType}`,
//           name,
//         } as any);
//       });

//       // console.log("Sending request to API...");
//       const response = await addCar(data);
//       // console.log("API Response:", response.data);

//       showToastable({
//         message: t("car_listing_created"),
//         status: "success",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
//       });

//       // Reset form
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
//       // console.error("Error details:", {
//       //   message: error.message,
//       //   response: error.response?.data,
//       //   status: error.response?.status,
//       // });

//       showToastable({
//         message: t("failed_to_create_car"),
//         status: "warning",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderForm = () => (
//     <View style={styles.form}>
//       <Text style={[styles.section_title, rtlStyle]}>{t("add_listing")}</Text>
//       <View style={styles.section_divider} />

//       <View style={styles.input_container}>
//         <Text style={[styles.label, rtlStyle]}>{t("Make")}</Text>
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
//           placeholder={t("price_year_kilometer_place_holder")}
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
//           placeholder={t("price_year_kilometer_place_holder")}
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
//           placeholder={t("price_year_kilometer_place_holder")}
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

//       {/* <Text style={[styles.section_title, rtlStyle]}>{t("gallery")}</Text> */}
//       <View
//         style={[
//           styles.sectionTitleContainer,
//           { flexDirection: getFlexDirection() },
//         ]}
//       >
//         {/* Left/Right Aligned Title */}
//         <View style={styles.galleryTitleWrapper}>
//           <Text style={[styles.section_titlee]}>{t("gallery")}</Text>
//         </View>

//         {/* Absolutely positioned and centered description */}
//         <View style={styles.galleryDescriptionWrapper}>
//           <Text style={styles.new_text_style}>{t("gallery_description")}</Text>
//         </View>
//       </View>
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
//             {t("add_listing2")}
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
//     backgroundColor: "#323332",
//   },
//   header: {
//     backgroundColor: "#323332",
//     paddingHorizontal: 20,
//     // paddingVertical: 15,
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
//     paddingVertical: 15,
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
//   //-----------------------------------
//   sectionTitleContainer: {
//     flexDirection: "row", // Default, will be overridden by getFlexDirection()
//     alignItems: "center", // Vertically center items in the row
//     marginBottom: 10,
//     position: "relative", // IMPORTANT for absolute positioning of description
//     width: "100%", // Ensure it spans full width
//     height: 50, // Give it a fixed height or minHeight to contain content
//   },

//   galleryTitleWrapper: {
//     // This wrapper will hold the gallery title and align it to the start/end
//     // based on RTL. It takes up as little space as possible (auto width).
//     flexGrow: 0, // Don't grow
//     flexShrink: 0, // Don't shrink
//     // The main section_titlee will have its alignment handled by rtlStyle
//   },

//   new_text_style: {
//     fontSize: 14,
//     fontWeight: "200",
//     color: "#000000",
//     // No margins here, as it will be centered independently
//     textAlign: "center", // Center its own text horizontally
//     width: "100%", // Ensure it takes full width of its wrapper to center text
//   },

//   galleryDescriptionWrapper: {
//     position: "absolute", // Position absolutely within sectionTitleContainer
//     left: 0,
//     right: 0,
//     top: 0,
//     bottom: 0,
//     justifyContent: "center", // Vertically center its content
//     alignItems: "center", // Horizontally center its content
//     pointerEvents: "none", // Allow touches to pass through if there are elements behind
//   },

//   section_titlee: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: "#333",
//   },
// });
