//-----------------------------------------------------------------------------------
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system"; // Import expo-file-system
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
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
import { showToastable } from "react-native-toastable"; // Assuming this is correct import, if not, adjust path
import { useAuth } from "../contexts/AuthContext";
import { useRTL } from "../hooks/useRTL";
import type { Car } from "../types";
import { getCarById, updateCar } from "../utils/api";
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
} from "../utils/constants"; // Import new data structures

// Define a type for our image objects
interface ImageItem {
  uri: string;
  type?: string; // MIME type for new files, optional for existing ones
  name?: string; // Filename for new files, optional for existing ones
}

export default function EditListing(): JSX.Element {
  const BASE_API_URL = "https://api.syriasouq.com";
  const BASE_IMAGE_UPLOAD_PATH = "/Uploads/cars/";
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { isRTL, rtlStyle, getFlexDirection } = useRTL();
  const router = useRouter();
  const { carId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentField, setCurrentField] = useState<string>("");
  const [modalOptions, setModalOptions] = useState<string[]>([]); // These will hold the *display values* (en or ar)
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    make: "", // Stores English key (e.g., "Toyota")
    model: "", // Stores English key (e.g., "Camry")
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
  // `images` state now holds full URLs for existing images and `file://` URIs for new ones.
  const [images, setImages] = useState<ImageItem[]>([]);

  /**
   * Helper to get the English value from a translated display value.
   * This is crucial when the user selects an option from the UI (which might be in Arabic)
   * and we need to store its English equivalent in `formData`.
   * @param translatedValue The string displayed to the user (can be Arabic or English).
   * @param field The field name (e.g., 'make', 'cylinder', 'location', 'feature').
   * @returns The English value to be stored in formData.
   */
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
          const arabicModelForEnglishKey = arabicMakes
            .find((am) => am.enValue === selectedEnglishMake)
            ?.models.find((m) => m === translatedValue);
          if (
            arabicModelForEnglishKey &&
            modelKey === i18n.t(arabicModelForEnglishKey, { lng: "en" })
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

  /**
   * Helper to get the display value (English or Arabic) from an English value stored in formData.
   * This is used when rendering the selected value in the UI.
   * @param field The field name.
   * @param englishValue The English value stored in formData.
   * @returns The string to display to the user.
   */
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

  // --- Options Arrays for Display (These are the values passed to `openPicker`) ---
  // These arrays will now contain the *actual strings to be displayed* in the modal.

  // Make options: display `label` (which is already localized by `makes` and `arabicMakes`)
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (carId) {
      fetchCarDetails();
    }
  }, [carId, isAuthenticated]);

  const fetchCarDetails = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await getCarById(carId as string);
      const car: Car = response.data?.data || response.data;

      // Map backend fields to form fields with proper English value storage
      // Make & Model: Backend likely stores English labels/keys for make and model.
      // We directly use these as they are meant to be English in formData.
      const fetchedMake = car.make || "";
      const fetchedModel = car.model || "";

      // For other fields, convert the stored value (which might be Arabic from older records)
      // to its English 'en' equivalent for formData.
      const cylindersEn = getEnglishValueFromDisplayValue(
        car.engineSize?.toString() || "",
        "number_of_cylinders"
      );
      const locationEn = getEnglishValueFromDisplayValue(
        car.location || "",
        "location"
      );
      const transmissionEn = getEnglishValueFromDisplayValue(
        car.transmission || "",
        "transmission"
      );
      const fuelTypeEn = getEnglishValueFromDisplayValue(
        car.fuelType || "",
        "fuel_type"
      );
      const exteriorColorEn = getEnglishValueFromDisplayValue(
        car.exteriorColor || "",
        "exterior_color"
      );
      const interiorColorEn = getEnglishValueFromDisplayValue(
        car.interiorColor || "",
        "interior_color"
      );

      // For features, ensure we map any Arabic stored features to their English 'en' values
      const dbFeatures = car.features || [];
      const selectedFeaturesEn: string[] = dbFeatures
        .map((dbFeature) =>
          getEnglishValueFromDisplayValue(dbFeature, "selected_features")
        )
        .filter(Boolean); // Filter out any null/undefined results

      setFormData({
        make: fetchedMake,
        model: fetchedModel,
        price_usd: car.priceUSD?.toString() || "",
        year: car.year?.toString() || "",
        kilometer: car.kilometer?.toString() || "",
        number_of_cylinders: cylindersEn,
        location: locationEn,
        transmission: transmissionEn,
        fuel_type: fuelTypeEn,
        exterior_color: exteriorColorEn,
        interior_color: interiorColorEn,
        selected_features: selectedFeaturesEn, // Store English 'en' values
        description: car.description || "",
      });

      // --- FIX FOR IMAGE URL CONSTRUCTION ---
      const fullImageUrls: ImageItem[] = (car.images || []).map(
        (filename: string) => {
          // If filename is already a full URL (e.g., from Cloudflare), use it directly.
          if (
            filename.startsWith("http://") ||
            filename.startsWith("https://")
          ) {
            return { uri: filename };
          }
          // Otherwise, construct the full URL using base paths.
          return { uri: `${BASE_API_URL}${BASE_IMAGE_UPLOAD_PATH}${filename}` };
        }
      );
      setImages(fullImageUrls); // Set the state with correctly formed URLs for display
      console.log("Full Image URIs loaded:", fullImageUrls);
      // --- END FIX FOR IMAGE URL CONSTRUCTION ---
    } catch (error: any) {
      console.error("EditListing: Error fetching car details:", error);
      Alert.alert(t("error"), t("failedToFetchCarDetails"));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles changes for all form inputs.
   * It is responsible for converting the displayed value to its English value if necessary,
   * before updating the `formData` state.
   * @param field The field name being updated.
   * @param value The raw value from the input/picker (which is a display string).
   */
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
      ].includes(field)
    ) {
      valueToStore = getEnglishValueFromDisplayValue(value as string, field);
    }
    // For text inputs (price_usd, year, kilometer, description), the `value` is already what needs to be stored.
    // For selected_features, the value is already handled by toggleFeature.

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

  /**
   * Checks if a feature is selected based on its display value.
   * @param featureDisplayValue The display value of the feature (Arabic or English).
   * @returns True if the corresponding English value is in formData.selected_features, false otherwise.
   */
  const isFeatureSelected = (featureDisplayValue: string): boolean => {
    const englishValue = getEnglishValueFromDisplayValue(
      featureDisplayValue,
      "selected_features"
    );
    return formData.selected_features.includes(englishValue);
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
    setSearchQuery("");
    // Reset search when opening picker
    setModalVisible(true);
  };
  const selectOption = (value: string) => {
    // value here is the display value
    handleInputChange(currentField as keyof typeof formData, value);
    setSearchQuery("");
    // Clear search when selecting
    setModalVisible(false);
  };
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("error"), t("media_library_permission_required"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Specify media type
      allowsMultipleSelection: true,
      selectionLimit: 20 - images.length, // Limit selection based on current images count
      quality: 0.7,
    });
    if (!result.canceled) {
      const newImageItems: ImageItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.mimeType, // Use the correct MIME type from asset
        name: asset.fileName || `image_${Date.now()}.jpg`, // Use asset.fileName or generate a name
      }));
      // Append new local URIs to the existing list (which might contain full http/https URLs)
      setImages((prevImages) => [...prevImages, ...newImageItems]);
      console.log("New image items added:", newImageItems);
    }
  };

  const removeImage = (index: number) => {
    // This only removes the image from the frontend `images` state.
    // The actual "deletion" on the backend occurs because this image's URI
    // will not be included in the `filesToUpload` for `handleSubmit`,
    // causing the backend to effectively "forget" it when `car.images` is overwritten.
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert(t("error"), t("please_login"));
      return;
    }

    setUpdating(true);
    try {
      const data = new FormData();
      // Convert display values back to backend values (which are now consistently English 'en' values from formData)
      const makeValue = formData.make; // formData.make is already English label
      const modelValue = formData.model; // formData.model is already English key/value

      // `formData.selected_features` already contains English 'en' values
      const englishFeatures = formData.selected_features;

      const fieldMapping: { [key: string]: string } = {
        make: "make",
        model: "model",
        price_usd: "priceUSD",
        year: "year",
        kilometer: "kilometer",
        number_of_cylinders: "engineSize",
        location: "location",
        transmission: "transmission",
        fuel_type: "fuelType",
        exterior_color: "exteriorColor",
        interior_color: "interiorColor",
        selected_features: "features",
        description: "description",
      };
      Object.entries(formData).forEach(([key, value]) => {
        const backendKey = fieldMapping[key] || key;
        if (key === "selected_features") {
          // Reverted to sending as a JSON string, as the backend explicitly handles JSON.parse
          data.append("selectedFeatures", JSON.stringify(englishFeatures));
        } else if (key === "make") {
          data.append(backendKey, makeValue);
        } else if (key === "model") {
          data.append(backendKey, modelValue);
        } else {
          // This else block handles all other fields where formData already has the English 'en' value
          data.append(backendKey, value as string);
        }
      });
      // --- SOLUTION FOR IMAGE DELETION AND PREVENTING REPLACEMENT ISSUES ---
      // This implements the "re-download and re-upload all images" strategy
      // to work with the backend's behavior of overwriting the 'images' array.
      const filesToUpload: { uri: string; type: string; name: string }[] = [];
      for (const imageItem of images) {
        // Iterate over ImageItem objects
        if (imageItem.uri.startsWith("file://")) {
          // This is a newly picked image from the device's local storage
          const fileUri =
            Platform.OS === "android"
              ? imageItem.uri
              : imageItem.uri.replace("file://", "");
          // Ensure imageItem.type is always a valid MIME type for new images.
          const determinedType = imageItem.type || "image/jpeg";
          // Fallback to image/jpeg if type is missing from ImagePicker
          filesToUpload.push({
            uri: fileUri,
            type: determinedType,
            name: imageItem.name || `new_image_${Date.now()}.jpg`, // Use stored name, fallback
          });
        } else if (
          imageItem.uri.startsWith("http://") ||
          imageItem.uri.startsWith("https://")
        ) {
          // This is an existing image from the server.
          // We need to download it to a temporary local file to re-upload it.
          // This is necessary because the backend replaces the entire image array
          // if any new files are included in the FormData.
          try {
            // NEW improved logic for extracting a clean filename
            let filename = imageItem.uri.substring(
              imageItem.uri.lastIndexOf("/") + 1
            );
            const queryParamIndex = filename.indexOf("?");
            if (queryParamIndex !== -1) {
              filename = filename.substring(0, queryParamIndex);
            }
            const hashIndex = filename.indexOf("#");
            if (hashIndex !== -1) {
              filename = filename.substring(0, hashIndex);
            }
            // Decode URI components (e.g., %20 for space)
            filename = decodeURIComponent(filename);
            // Replace any characters that are generally invalid in file names on most OSes
            filename = filename.replace(/[/\\?%*:|"<>]/g, "_");

            // Using FileSystem.cacheDirectory for temporary storage
            const tempFilePath = FileSystem.cacheDirectory + filename;

            console.log(
              `Downloading existing image for re-upload: ${imageItem.uri}`
            );
            console.log(`Saving to temporary path: ${tempFilePath}`);

            const { uri: downloadedUri, status } =
              await FileSystem.downloadAsync(imageItem.uri, tempFilePath);

            if (status === 200) {
              // If there's a file extension, try to infer type; otherwise, default
              const fileExtension = filename.split(".").pop()?.toLowerCase();
              let inferredType = "image/jpeg";
              if (fileExtension === "png") {
                inferredType = "image/png";
              } else if (fileExtension === "gif") {
                inferredType = "image/gif";
              } else if (fileExtension === "jpg" || fileExtension === "jpeg") {
                inferredType = "image/jpeg";
              } else if (fileExtension === "webp") {
                inferredType = "image/webp";
              }

              filesToUpload.push({
                uri: downloadedUri,
                type: inferredType, // Use inferred type
                name: filename, // Use original filename to potentially help backend
              });
            } else {
              console.warn(
                `Failed to re-download existing image ${imageItem.uri}. Status: ${status}`
              );
              // If a download fails, we skip this image to prevent the upload from failing entirely.
              // Consider adding a user alert here if this is critical.
            }
          } catch (downloadError) {
            console.error(
              "Error re-downloading existing image:",
              downloadError
            );
            // Skip this image if an error occurs during download.
          }
        }
      }

      // Append all collected files (newly picked and re-downloaded existing) to FormData
      filesToUpload.forEach((file) => {
        console.log(
          `Appending file: Name=${file.name}, URI=${file.uri}, Type=${file.type}`
        ); // Add this log
        data.append("images", {
          // 'images' is the field name your backend expects
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any); // Type assertion for FormData.append in React Native
      });
      // --- END SOLUTION FOR IMAGE DELETION AND REPLACEMENT ISSUES ---

      // Log FormData content for debugging
      console.log("FormData to be sent:", data);
      await updateCar(carId as string, data);

      showToastable({
        message: t("listing_updated"),
        status: "success",
        duration: 2000,
      });
      router.back();
    } catch (error: any) {
      setUpdating(false);
      // Ensure updating state is reset on error
      console.error("EditListing: Error updating listing:", error);
      let errorMessage = t("failed_to_update_listing");
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status) {
          errorMessage = `${t("failed_to_update_listing")} (Status: ${
            error.response.status
          })`;
        }
      } else if (error.request) {
        // The request was made but no response received
        console.error("Error request:", error.request);
        errorMessage = t("no_response_from_server");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
        errorMessage = error.message || t("failed_to_update_listing");
      }

      Alert.alert(t("error"), errorMessage);
    } finally {
      setUpdating(false);
    }
  };
  const renderForm = () => (
    <KeyboardAvoidingView style={styles.form}>
      <Text style={[styles.section_title, rtlStyle]}>{t("general_info")}</Text>
      <View style={styles.section_divider} />

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("Make")}</Text>
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
            {getDisplayValue("make", formData.make) || t("select_make")}
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

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("price_usd")}</Text>
        <TextInput
          style={[styles.input, styles.left_align, rtlStyle]}
          value={formData.price_usd}
          onChangeText={(value) => handleInputChange("price_usd", value)}
          placeholder={t("price_place_holder")}
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
          placeholder={t("price_year_kilometer_place_holder")}
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
          placeholder={t("price_year_kilometer_place_holder")}
          placeholderTextColor="#999999"
          keyboardType="numeric"
          textAlign={isRTL ? "right" : "left"}
        />
      </View>

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("select_cylinders")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() =>
            openPicker("number_of_cylinders", cylinderDisplayOptions)
          }
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

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("location")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("location", locationDisplayOptions)}
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

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("transmission")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("transmission", transmissionDisplayOptions)}
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

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("fuel_type")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("fuel_type", fuelTypeDisplayOptions)}
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

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("exterior_color")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("exterior_color", colorDisplayOptions)}
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

      <View style={styles.input_container}>
        <Text style={[styles.label, rtlStyle]}>{t("interior_color")}</Text>
        <TouchableOpacity
          style={[styles.picker, { flexDirection: getFlexDirection() }]}
          onPress={() => openPicker("interior_color", interiorColorOptions)}
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

      <Text style={[styles.section_title, rtlStyle]}>{t("features")}</Text>
      <View style={styles.section_divider} />
      <View style={styles.feature_container}>
        {featureDisplayOptions.map((featureDisplayValue) => (
          <TouchableOpacity
            key={featureDisplayValue}
            style={[
              styles.feature_item,
              { flexDirection: getFlexDirection() },
              isFeatureSelected(featureDisplayValue) &&
                styles.feature_item_active,
            ]}
            onPress={() => toggleFeature(featureDisplayValue)}
          >
            <View style={styles.checkbox}>
              {isFeatureSelected(featureDisplayValue) && (
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              )}
            </View>
            <Text
              style={[
                styles.feature_text,
                rtlStyle,
                { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
                isFeatureSelected(featureDisplayValue) &&
                  styles.feature_text_active,
              ]}
            >
              {featureDisplayValue}
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
        {images.map(
          (
            imageItem,
            index // Use imageItem
          ) => (
            <View key={index} style={styles.image_item}>
              <Image
                source={{ uri: imageItem.uri }} // Use imageItem.uri
                style={styles.preview_image}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              <TouchableOpacity
                style={styles.remove_image_button}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={20} color="#B80200" />
              </TouchableOpacity>
            </View>
          )
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.submit_button,
          updating && styles.submit_button_disabled,
        ]}
        onPress={handleSubmit}
        disabled={updating}
      >
        {updating ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={[styles.submit_button_text, rtlStyle]}>
            {t("update_listing")}
          </Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  if (loading) {
    return (
      <View style={[styles.loading_container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#B80200" />
        <Text style={[styles.loading_text, rtlStyle]}>{t("loading")}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
        <TouchableOpacity
          style={styles.back_button}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
        <Text style={[styles.header_text, rtlStyle]}>{t("edit_listing")}</Text>
        <View style={styles.header_spacer} />
      </View>

      <FlatList
        data={[0]}
        renderItem={renderForm}
        keyExtractor={() => "form"}
        contentContainerStyle={styles.list_content}
        showsVerticalScrollIndicator={false}
      />

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
    backgroundColor: "#323332",
  },
  loading_container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loading_text: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  header: {
    backgroundColor: "#323332",
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  back_button: {
    padding: 8,
  },
  header_text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  header_spacer: {
    width: 40,
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
  picker_disabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#d0d0d0",
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
    backgroundColor: "#f5f5f5",
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
    fontWeight: "600",
    color: "#B80200",
  },
  search_container: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  search_input_container: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  search_input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#314352",
  },
  search_icon_ltr: {
    marginRight: 8,
  },
  search_icon_rtl: {
    marginLeft: 8,
  },
  clear_search: {
    padding: 5,
  },
  no_results_container: {
    padding: 20,
    alignItems: "center",
  },
  no_results_text: {
    fontSize: 16,
    color: "#666",
  },
  modal_scroll: {
    maxHeight: "80%", // Limit scroll view height
  },
  sectionTitleContainer: {
    flexDirection: "row", // Default, will be overridden by getFlexDirection()
    alignItems: "center", // Vertically center items in the row
    marginBottom: 10,
    position: "relative", // IMPORTANT for absolute positioning of description
    width: "100%", // Ensure it spans full width
    height: 50, // Give it a fixed height or minHeight to contain content
  },
  galleryTitleWrapper: {
    // This wrapper will hold the gallery title and align it to the start/end
    // based on RTL. It takes up as little space as possible (auto width).
    flexGrow: 0, // Don't grow
    flexShrink: 0, // Don't shrink
    // The main section_titlee will have its alignment handled by rtlStyle
  },
  new_text_style: {
    fontSize: 14,
    fontWeight: "200",
    color: "#000000",
    // No margins here, as it will be centered independently
    textAlign: "center", // Center its own text horizontally
    width: "100%", // Ensure it takes full width of its wrapper to center text
  },
  galleryDescriptionWrapper: {
    position: "absolute", // Position absolutely within sectionTitleContainer
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center", // Vertically center its content
    alignItems: "center", // Horizontally center its content
    pointerEvents: "none", // Allow touches to pass through if there are elements behind
  },
  section_titlee: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
});

//----------------------------------------------------------------------------------
// import { Ionicons } from "@expo/vector-icons";
// import * as FileSystem from "expo-file-system"; // Import expo-file-system
// import { Image } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import type { JSX } from "react";
// import { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   Alert,
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
// import { useAuth } from "../contexts/AuthContext";
// import { useRTL } from "../hooks/useRTL";
// import type { Car } from "../types";
// import { getCarById, updateCar } from "../utils/api";
// import { arabicMakes, makes } from "../utils/constants";

// // Define a type for our image objects
// interface ImageItem {
//   uri: string;
//   type?: string; // MIME type for new files, optional for existing ones
//   name?: string; // Filename for new files, optional for existing ones
// }

// export default function EditListing(): JSX.Element {
//   const BASE_API_URL = "https://api.syriasouq.com";
//   const BASE_IMAGE_UPLOAD_PATH = "/Uploads/cars/";
//   const { t, i18n } = useTranslation();
//   const { isAuthenticated } = useAuth();
//   const { isRTL, rtlStyle, getFlexDirection } = useRTL();
//   const router = useRouter();
//   const { carId } = useLocalSearchParams();
//   const insets = useSafeAreaInsets();
//   const isArabic = i18n.language === "ar";

//   const [loading, setLoading] = useState<boolean>(true);
//   const [updating, setUpdating] = useState<boolean>(false);
//   const [modalVisible, setModalVisible] = useState<boolean>(false);
//   const [currentField, setCurrentField] = useState<string>("");
//   const [modalOptions, setModalOptions] = useState<string[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
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
//     selected_features: [] as string[], // This will store the translation keys (English keys)
//     description: "",
//   });
//   // `images` state now holds full URLs for existing images and `file://` URIs for new ones.
//   const [images, setImages] = useState<ImageItem[]>([]);

//   // Feature translation keys - these are the keys used in i18n
//   const featureKeys = [
//     "ThreeSixty_degree_camera",
//     "Adaptive_headlights",
//     "Blind_spot_warning",
//     "Cooled_Seats",
//     "Heated_seats",
//     "LED_headlights",
//     "Performance_tyres",
//     "Sound_system",
//     "ABS",
//     "Bluetooth",
//     "Extensive_tool_kit",
//     "Keyless_start",
//     "Memory_seat",
//     "Reversing_camera",
//     "Traction_control",
//     "Active_head_restraints",
//     "Blind_spot_alert",
//     "Forward_collision_warning",
//     "Leather_seats",
//     "Navigation_system",
//     "Side_airbags",
//     "USB_port",
//   ];
//   // Get translated feature options for display
//   const featureOptions = featureKeys.map((key) => t(key));
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
//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.replace("/login");
//       return;
//     }

//     if (carId) {
//       fetchCarDetails();
//     }
//   }, [carId, isAuthenticated]);
//   const fetchCarDetails = async (): Promise<void> => {
//     try {
//       setLoading(true);
//       const response = await getCarById(carId as string);
//       const car: Car = response.data?.data || response.data;
//       // Map backend fields to form fields with proper translation handling
//       const translatedMake = isArabic
//         ? arabicMakes.find((m) => m.label === car.make)?.label || car.make
//         : makes.find((m) => m.value === car.make)?.label || car.make;

//       const translatedModel = car.model; // Keep as is for now, will be handled by model options

//       // Convert database feature names to translation keys
//       const dbFeatures = car.features || [];
//       console.log("DB Features from backend:", dbFeatures); // For debugging: See what names come from your API
//       const selectedFeatureKeys = dbFeatures
//         .map((dbFeature) => {
//           // Find the translation key that matches this database feature
//           const matchingKey = featureKeys.find((key) => {
//             const englishTranslation = t(key, { lng: "en" }); // Get the English translation of our internal key
//             // Compare it (case-insensitively) to the feature name from the database
//             return englishTranslation.toLowerCase() === dbFeature.toLowerCase();
//           });
//           return matchingKey || null; // If a match is found, return the key; otherwise, return null
//         })
//         .filter(Boolean) as string[];
//       // Explicitly assert that after filtering, it's an array of strings
//       console.log("Mapped selectedFeatureKeys:", selectedFeatureKeys);
//       // For debugging: See which keys are selected

//       setFormData({
//         make: translatedMake,
//         model: translatedModel,
//         price_usd: car.priceUSD?.toString() || "",
//         year: car.year?.toString() || "",
//         kilometer: car.kilometer?.toString() || "",
//         number_of_cylinders: car.engineSize?.toString() || "",
//         location: car.location || "",
//         transmission: car.transmission || "",
//         fuel_type: car.fuelType || "",
//         exterior_color: car.exteriorColor || "",
//         interior_color: car.interiorColor || "",
//         selected_features: selectedFeatureKeys, // Store translation keys
//         description: car.description || "",
//       });
//       // --- FIX FOR IMAGE URL CONSTRUCTION ---
//       const fullImageUrls: ImageItem[] = (car.images || []).map(
//         (filename: string) => {
//           // If filename is already a full URL (e.g., from Cloudflare), use it directly.
//           if (
//             filename.startsWith("http://") ||
//             filename.startsWith("https://")
//           ) {
//             return { uri: filename };
//           }
//           // Otherwise, construct the full URL using base paths.
//           return { uri: `${BASE_API_URL}${BASE_IMAGE_UPLOAD_PATH}${filename}` };
//         }
//       );
//       setImages(fullImageUrls); // Set the state with correctly formed URLs for display
//       console.log("Full Image URIs loaded:", fullImageUrls);
//       // --- END FIX FOR IMAGE URL CONSTRUCTION ---
//     } catch (error: any) {
//       console.error("EditListing: Error fetching car details:", error);
//       Alert.alert(t("error"), t("failedToFetchCarDetails"));
//       router.back();
//     } finally {
//       setLoading(false);
//     }
//   };
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
//     // Find the translation key for this feature
//     const featureIndex = featureOptions.indexOf(feature);
//     const featureKey = featureKeys[featureIndex];

//     if (!featureKey) return;

//     const newFeatures = formData.selected_features.includes(featureKey)
//       ? formData.selected_features.filter((f) => f !== featureKey)
//       : [...formData.selected_features, featureKey];
//     handleInputChange("selected_features", newFeatures);
//   };
//   const isFeatureSelected = (feature: string): boolean => {
//     // Find the translation key for this feature
//     const featureIndex = featureOptions.indexOf(feature);
//     const featureKey = featureKeys[featureIndex];
//     return featureKey ? formData.selected_features.includes(featureKey) : false;
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
//     setSearchQuery("");
//     // Reset search when opening picker
//     setModalVisible(true);
//   };
//   const selectOption = (value: string) => {
//     handleInputChange(currentField as keyof typeof formData, value);
//     setSearchQuery("");
//     // Clear search when selecting
//     setModalVisible(false);
//   };
//   const pickImages = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert(t("error"), t("media_library_permission_required"));
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images, // Specify media type
//       allowsMultipleSelection: true,
//       selectionLimit: 20 - images.length, // Limit selection based on current images count
//       quality: 0.7,
//     });
//     if (!result.canceled) {
//       const newImageItems: ImageItem[] = result.assets.map((asset) => ({
//         uri: asset.uri,
//         type: asset.mimeType, // Use the correct MIME type from asset
//         name: asset.fileName || `image_${Date.now()}.jpg`, // Use asset.fileName or generate a name
//       }));
//       // Append new local URIs to the existing list (which might contain full http/https URLs)
//       setImages((prevImages) => [...prevImages, ...newImageItems]);
//       console.log("New image items added:", newImageItems);
//     }
//   };

//   const removeImage = (index: number) => {
//     // This only removes the image from the frontend `images` state.
//     // The actual "deletion" on the backend occurs because this image's URI
//     // will not be included in the `filesToUpload` for `handleSubmit`,
//     // causing the backend to effectively "forget" it when `car.images` is overwritten.
//     setImages(images.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async () => {
//     if (!isAuthenticated) {
//       Alert.alert(t("error"), t("please_login"));
//       return;
//     }

//     setUpdating(true);
//     try {
//       const data = new FormData();
//       // Convert display values back to backend values
//       const makeValue = isArabic
//         ? arabicMakes.find((m) => m.label === formData.make)?.value ||
//           formData.make
//         : makes.find((m) => m.label === formData.make)?.value || formData.make;

//       // Convert feature keys back to English feature names for database
//       const englishFeatures = formData.selected_features.map((key) => {
//         return t(key, { lng: "en" }); // Get English translation of the key
//       });
//       const fieldMapping: { [key: string]: string } = {
//         make: "make",
//         model: "model",
//         price_usd: "priceUSD",
//         year: "year",
//         kilometer: "kilometer",
//         number_of_cylinders: "engineSize",
//         location: "location",
//         transmission: "transmission",
//         fuel_type: "fuelType",
//         exterior_color: "exteriorColor",
//         interior_color: "interiorColor",
//         selected_features: "features", // THIS LINE ENSURES 'selected_features' IS MAPPED TO 'features'
//         description: "description",
//       };
//       Object.entries(formData).forEach(([key, value]) => {
//         const backendKey = fieldMapping[key] || key;
//         if (key === "selected_features") {
//           // Use 'key' here to match the formData key directly
//           data.append("features", JSON.stringify(englishFeatures)); // MODIFIED: Reverted to JSON.stringify
//         } else if (key === "make") {
//           data.append(backendKey, makeValue);
//         } else {
//           // This else block handles all other fields except selected_features and make
//           data.append(backendKey, value as string);
//         }
//       });
//       // --- SOLUTION FOR IMAGE DELETION AND PREVENTING REPLACEMENT ISSUES ---
//       // This implements the "re-download and re-upload all images" strategy
//       // to work with the backend's behavior of overwriting the 'images' array.
//       const filesToUpload: { uri: string; type: string; name: string }[] = [];
//       for (const imageItem of images) {
//         // Iterate over ImageItem objects
//         if (imageItem.uri.startsWith("file://")) {
//           // This is a newly picked image from the device's local storage
//           const fileUri =
//             Platform.OS === "android"
//               ? imageItem.uri
//               : imageItem.uri.replace("file://", "");
//           // Ensure imageItem.type is always a valid MIME type for new images.
//           const determinedType = imageItem.type || "image/jpeg";
//           // Fallback to image/jpeg if type is missing from ImagePicker
//           filesToUpload.push({
//             uri: fileUri,
//             type: determinedType,
//             name: imageItem.name || `new_image_${Date.now()}.jpg`, // Use stored name, fallback
//           });
//         } else if (
//           imageItem.uri.startsWith("http://") ||
//           imageItem.uri.startsWith("https://")
//         ) {
//           // This is an existing image from the server.
//           // We need to download it to a temporary local file to re-upload it.
//           // This is necessary because the backend replaces the entire image array
//           // if any new files are included in the FormData.
//           try {
//             // NEW improved logic for extracting a clean filename
//             let filename = imageItem.uri.substring(
//               imageItem.uri.lastIndexOf("/") + 1
//             );
//             const queryParamIndex = filename.indexOf("?");
//             if (queryParamIndex !== -1) {
//               filename = filename.substring(0, queryParamIndex);
//             }
//             const hashIndex = filename.indexOf("#");
//             if (hashIndex !== -1) {
//               filename = filename.substring(0, hashIndex);
//             }
//             // Decode URI components (e.g., %20 for space)
//             filename = decodeURIComponent(filename);
//             // Replace any characters that are generally invalid in file names on most OSes
//             filename = filename.replace(/[/\\?%*:|"<>]/g, "_");

//             // Using FileSystem.cacheDirectory for temporary storage
//             const tempFilePath = FileSystem.cacheDirectory + filename;

//             console.log(
//               `Downloading existing image for re-upload: ${imageItem.uri}`
//             );
//             console.log(`Saving to temporary path: ${tempFilePath}`);

//             const { uri: downloadedUri, status } =
//               await FileSystem.downloadAsync(imageItem.uri, tempFilePath);

//             if (status === 200) {
//               // If there's a file extension, try to infer type; otherwise, default
//               const fileExtension = filename.split(".").pop()?.toLowerCase();
//               let inferredType = "image/jpeg";
//               if (fileExtension === "png") {
//                 inferredType = "image/png";
//               } else if (fileExtension === "gif") {
//                 inferredType = "image/gif";
//               } else if (fileExtension === "jpg" || fileExtension === "jpeg") {
//                 inferredType = "image/jpeg";
//               } else if (fileExtension === "webp") {
//                 inferredType = "image/webp";
//               }

//               filesToUpload.push({
//                 uri: downloadedUri,
//                 type: inferredType, // Use inferred type
//                 name: filename, // Use original filename to potentially help backend
//               });
//             } else {
//               console.warn(
//                 `Failed to re-download existing image ${imageItem.uri}. Status: ${status}`
//               );
//               // If a download fails, we skip this image to prevent the upload from failing entirely.
//               // Consider adding a user alert here if this is critical.
//             }
//           } catch (downloadError) {
//             console.error(
//               "Error re-downloading existing image:",
//               downloadError
//             );
//             // Skip this image if an error occurs during download.
//           }
//         }
//       }

//       // Append all collected files (newly picked and re-downloaded existing) to FormData
//       filesToUpload.forEach((file) => {
//         console.log(
//           `Appending file: Name=${file.name}, URI=${file.uri}, Type=${file.type}`
//         ); // Add this log
//         data.append("images", {
//           // 'images' is the field name your backend expects
//           uri: file.uri,
//           type: file.type,
//           name: file.name,
//         } as any); // Type assertion for FormData.append in React Native
//       });
//       // --- END SOLUTION FOR IMAGE DELETION AND REPLACEMENT ISSUES ---

//       // Log FormData content for debugging
//       console.log("FormData to be sent:", data);
//       await updateCar(carId as string, data);

//       showToastable({
//         message: t("listing_updated"),
//         status: "success",
//         duration: 2000,
//       });
//       router.back();
//     } catch (error: any) {
//       setUpdating(false);
//       // Ensure updating state is reset on error
//       console.error("EditListing: Error updating listing:", error);
//       let errorMessage = t("failed_to_update_listing");
//       if (error.response) {
//         // The request was made and the server responded with a status code
//         // that falls out of the range of 2xx
//         console.error("Error response data:", error.response.data);
//         console.error("Error response status:", error.response.status);
//         console.error("Error response headers:", error.response.headers);
//         if (error.response.data && error.response.data.message) {
//           errorMessage = error.response.data.message;
//         } else if (error.response.status) {
//           errorMessage = `${t("failed_to_update_listing")} (Status: ${
//             error.response.status
//           })`;
//         }
//       } else if (error.request) {
//         // The request was made but no response was received
//         console.error("Error request:", error.request);
//         errorMessage = t("no_response_from_server");
//       } else {
//         // Something happened in setting up the request that triggered an Error
//         console.error("Error message:", error.message);
//         errorMessage = error.message || t("failed_to_update_listing");
//       }

//       Alert.alert(t("error"), errorMessage);
//     } finally {
//       setUpdating(false);
//     }
//   };
//   const renderForm = () => (
//     <View style={styles.form}>
//       <Text style={[styles.section_title, rtlStyle]}>{t("general_info")}</Text>
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
//           placeholder={t("price_place_holder")}
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
//         <Text style={[styles.label, rtlStyle]}>{t("select_cylinders")}</Text>
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
//         {featureOptions.map((feature, index) => (
//           <TouchableOpacity
//             key={`${feature}-${index}`}
//             style={[
//               styles.feature_item,
//               { flexDirection: getFlexDirection() },
//               isFeatureSelected(feature) && styles.feature_item_active,
//             ]}
//             onPress={() => toggleFeature(feature)}
//           >
//             <View style={styles.checkbox}>
//               {isFeatureSelected(feature) && (
//                 <Ionicons name="checkmark" size={14} color="#ffffff" />
//               )}
//             </View>
//             <Text
//               style={[
//                 styles.feature_text,
//                 rtlStyle,
//                 { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
//                 isFeatureSelected(feature) && styles.feature_text_active,
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

//       <View
//         style={[
//           styles.sectionTitleContainer,
//           { flexDirection: getFlexDirection() },
//         ]}
//       >
//         <View style={styles.galleryTitleWrapper}>
//           <Text style={[styles.section_titlee]}>{t("gallery")}</Text>
//         </View>
//         <View style={styles.galleryDescriptionWrapper}>
//           <Text style={styles.new_text_style}>{t("gallery_description")}</Text>
//         </View>
//       </View>

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
//         {images.map(
//           (
//             imageItem,
//             index // Use imageItem
//           ) => (
//             <View key={index} style={styles.image_item}>
//               <Image
//                 source={{ uri: imageItem.uri }} // Use imageItem.uri
//                 style={styles.preview_image}
//                 contentFit="cover"
//                 cachePolicy="memory-disk"
//               />
//               <TouchableOpacity
//                 style={styles.remove_image_button}
//                 onPress={() => removeImage(index)}
//               >
//                 <Ionicons name="close-circle" size={20} color="#B80200" />
//               </TouchableOpacity>
//             </View>
//           )
//         )}
//       </View>

//       <TouchableOpacity
//         style={[
//           styles.submit_button,
//           updating && styles.submit_button_disabled,
//         ]}
//         onPress={handleSubmit}
//         disabled={updating}
//       >
//         {updating ? (
//           <ActivityIndicator size="small" color="#ffffff" />
//         ) : (
//           <Text style={[styles.submit_button_text, rtlStyle]}>
//             {t("update_listing")}
//           </Text>
//         )}
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={[styles.loading_container, { paddingTop: insets.top }]}>
//         <ActivityIndicator size="large" color="#B80200" />
//         <Text style={[styles.loading_text, rtlStyle]}>{t("loading")}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
//         <TouchableOpacity
//           style={styles.back_button}
//           onPress={() => router.back()}
//           activeOpacity={0.7}
//         >
//           <Ionicons
//             name={isRTL ? "arrow-forward" : "arrow-back"}
//             size={24}
//             color="#ffffff"
//           />
//         </TouchableOpacity>
//         <Text style={[styles.header_text, rtlStyle]}>{t("edit_listing")}</Text>
//         <View style={styles.header_spacer} />
//       </View>

//       <FlatList
//         data={[0]}
//         renderItem={renderForm}
//         keyExtractor={() => "form"}
//         contentContainerStyle={styles.list_content}
//         showsVerticalScrollIndicator={false}
//       />

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
//   loading_container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//   },
//   loading_text: {
//     fontSize: 16,
//     color: "#666",
//     marginTop: 10,
//   },
//   header: {
//     backgroundColor: "#323332",
//     paddingHorizontal: 20,
//     alignItems: "center",
//     justifyContent: "space-between",
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   back_button: {
//     padding: 8,
//   },
//   header_text: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#ffffff",
//     paddingVertical: 15,
//     paddingHorizontal: 15,
//   },
//   header_spacer: {
//     width: 40,
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
//   picker_disabled: {
//     backgroundColor: "#f0f0f0",
//     borderColor: "#d0d0d0",
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
//     backgroundColor: "#f5f5f5",
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
//     fontWeight: "600",
//     color: "#B80200",
//   },
//   search_container: {
//     marginBottom: 16,
//     paddingHorizontal: 8,
//   },
//   search_input_container: {
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   search_input: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: "#314352",
//   },
//   search_icon_ltr: {
//     marginRight: 8,
//   },
//   search_icon_rtl: {
//     marginLeft: 8,
//   },
//   clear_search: {
//     padding: 5,
//   },
//   no_results_container: {
//     padding: 20,
//     alignItems: "center",
//   },
//   no_results_text: {
//     fontSize: 16,
//     color: "#666",
//   },
//   modal_scroll: {
//     maxHeight: "80%", // Limit scroll view height
//   },
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
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
// import { Ionicons } from "@expo/vector-icons";
// import * as FileSystem from "expo-file-system"; // Import expo-file-system
// import { Image } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import type { JSX } from "react";
// import { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   Alert,
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
// import { useAuth } from "../contexts/AuthContext";
// import { useRTL } from "../hooks/useRTL";
// import type { Car } from "../types";
// import { getCarById, updateCar } from "../utils/api";
// import { arabicMakes, makes } from "../utils/constants";

// // Define a type for our image objects
// interface ImageItem {
//   uri: string;
//   type?: string; // MIME type for new files, optional for existing ones
//   name?: string; // Filename for new files, optional for existing ones
// }

// export default function EditListing(): JSX.Element {
//   const BASE_API_URL = "https://api.syriasouq.com";
//   const BASE_IMAGE_UPLOAD_PATH = "/Uploads/cars/";
//   const { t, i18n } = useTranslation();
//   const { isAuthenticated } = useAuth();
//   const { isRTL, rtlStyle, getFlexDirection } = useRTL();
//   const router = useRouter();
//   const { carId } = useLocalSearchParams();
//   const insets = useSafeAreaInsets();
//   const isArabic = i18n.language === "ar";

//   const [loading, setLoading] = useState<boolean>(true);
//   const [updating, setUpdating] = useState<boolean>(false);
//   const [modalVisible, setModalVisible] = useState<boolean>(false);
//   const [currentField, setCurrentField] = useState<string>("");
//   const [modalOptions, setModalOptions] = useState<string[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");

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
//     selected_features: [] as string[], // This will store the translation keys (English keys)
//     description: "",
//   });
//   // `images` state now holds full URLs for existing images and `file://` URIs for new ones.
//   const [images, setImages] = useState<ImageItem[]>([]);

//   // Feature translation keys - these are the keys used in i18n
//   const featureKeys = [
//     "ThreeSixty_degree_camera",
//     "Adaptive_headlights",
//     "Blind_spot_warning",
//     "Cooled_Seats",
//     "Heated_seats",
//     "LED_headlights",
//     "Performance_tyres",
//     "Sound_system",
//     "ABS",
//     "Bluetooth",
//     "Extensive_tool_kit",
//     "Keyless_start",
//     "Memory_seat",
//     "Reversing_camera",
//     "Traction_control",
//     "Active_head_restraints",
//     "Blind_spot_alert",
//     "Forward_collision_warning",
//     "Leather_seats",
//     "Navigation_system",
//     "Side_airbags",
//     "USB_port",
//   ];

//   // Get translated feature options for display
//   const featureOptions = featureKeys.map((key) => t(key));

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

//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.replace("/login");
//       return;
//     }

//     if (carId) {
//       fetchCarDetails();
//     }
//   }, [carId, isAuthenticated]);

//   const fetchCarDetails = async (): Promise<void> => {
//     try {
//       setLoading(true);
//       const response = await getCarById(carId as string);
//       const car: Car = response.data?.data || response.data;

//       // Map backend fields to form fields with proper translation handling
//       const translatedMake = isArabic
//         ? arabicMakes.find((m) => m.value === car.make)?.label || car.make
//         : makes.find((m) => m.value === car.make)?.label || car.make;

//       const translatedModel = car.model; // Keep as is for now, will be handled by model options

//       // Convert database feature names to translation keys
//       const dbFeatures = car.features || [];
//       console.log("DB Features from backend:", dbFeatures); // For debugging: See what names come from your API
//       const selectedFeatureKeys = dbFeatures
//         .map((dbFeature) => {
//           // Find the translation key that matches this database feature
//           const matchingKey = featureKeys.find((key) => {
//             const englishTranslation = t(key, { lng: "en" }); // Get the English translation of our internal key
//             // Compare it (case-insensitively) to the feature name from the database
//             return englishTranslation.toLowerCase() === dbFeature.toLowerCase();
//           });
//           return matchingKey || null; // If a match is found, return the key; otherwise, return null
//         })
//         .filter(Boolean) as string[]; // Explicitly assert that after filtering, it's an array of strings
//       console.log("Mapped selectedFeatureKeys:", selectedFeatureKeys); // For debugging: See which keys are selected

//       setFormData({
//         make: translatedMake,
//         model: translatedModel,
//         price_usd: car.priceUSD?.toString() || "",
//         year: car.year?.toString() || "",
//         kilometer: car.kilometer?.toString() || "",
//         number_of_cylinders: car.engineSize?.toString() || "",
//         location: car.location || "",
//         transmission: car.transmission || "",
//         fuel_type: car.fuelType || "",
//         exterior_color: car.exteriorColor || "",
//         interior_color: car.interiorColor || "",
//         selected_features: selectedFeatureKeys, // Store translation keys
//         description: car.description || "",
//       });

//       // --- FIX FOR IMAGE URL CONSTRUCTION ---
//       const fullImageUrls: ImageItem[] = (car.images || []).map(
//         (filename: string) => {
//           // If filename is already a full URL (e.g., from Cloudflare), use it directly.
//           if (
//             filename.startsWith("http://") ||
//             filename.startsWith("https://")
//           ) {
//             return { uri: filename };
//           }
//           // Otherwise, construct the full URL using base paths.
//           return { uri: `${BASE_API_URL}${BASE_IMAGE_UPLOAD_PATH}${filename}` };
//         }
//       );
//       setImages(fullImageUrls); // Set the state with correctly formed URLs for display
//       console.log("Full Image URIs loaded:", fullImageUrls);
//       // --- END FIX FOR IMAGE URL CONSTRUCTION ---
//     } catch (error: any) {
//       console.error("EditListing: Error fetching car details:", error);
//       Alert.alert(t("error"), t("failedToFetchCarDetails"));
//       router.back();
//     } finally {
//       setLoading(false);
//     }
//   };

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
//     // Find the translation key for this feature
//     const featureIndex = featureOptions.indexOf(feature);
//     const featureKey = featureKeys[featureIndex];

//     if (!featureKey) return;

//     const newFeatures = formData.selected_features.includes(featureKey)
//       ? formData.selected_features.filter((f) => f !== featureKey)
//       : [...formData.selected_features, featureKey];
//     handleInputChange("selected_features", newFeatures);
//   };

//   const isFeatureSelected = (feature: string): boolean => {
//     // Find the translation key for this feature
//     const featureIndex = featureOptions.indexOf(feature);
//     const featureKey = featureKeys[featureIndex];
//     return featureKey ? formData.selected_features.includes(featureKey) : false;
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
//     handleInputChange(currentField as keyof typeof formData, value);
//     setSearchQuery(""); // Clear search when selecting
//     setModalVisible(false);
//   };

//   const pickImages = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert(t("error"), t("media_library_permission_required"));
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images, // Specify media type
//       allowsMultipleSelection: true,
//       selectionLimit: 20 - images.length, // Limit selection based on current images count
//       quality: 0.7,
//     });

//     if (!result.canceled) {
//       const newImageItems: ImageItem[] = result.assets.map((asset) => ({
//         uri: asset.uri,
//         type: asset.mimeType, // Use the correct MIME type from asset
//         name: asset.fileName || `image_${Date.now()}.jpg`, // Use asset.fileName or generate a name
//       }));
//       // Append new local URIs to the existing list (which might contain full http/https URLs)
//       setImages((prevImages) => [...prevImages, ...newImageItems]);
//       console.log("New image items added:", newImageItems);
//     }
//   };

//   const removeImage = (index: number) => {
//     // This only removes the image from the frontend `images` state.
//     // The actual "deletion" on the backend occurs because this image's URI
//     // will not be included in the `filesToUpload` for `handleSubmit`,
//     // causing the backend to effectively "forget" it when `car.images` is overwritten.
//     setImages(images.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async () => {
//     if (!isAuthenticated) {
//       Alert.alert(t("error"), t("please_login"));
//       return;
//     }

//     setUpdating(true);
//     try {
//       const data = new FormData();

//       // Convert display values back to backend values
//       const makeValue = isArabic
//         ? arabicMakes.find((m) => m.label === formData.make)?.value ||
//           formData.make
//         : makes.find((m) => m.label === formData.make)?.value || formData.make;

//       // Convert feature keys back to English feature names for database
//       const englishFeatures = formData.selected_features.map((key) => {
//         return t(key, { lng: "en" }); // Get English translation of the key
//       });

//       const fieldMapping: { [key: string]: string } = {
//         make: "make",
//         model: "model",
//         price_usd: "priceUSD",
//         year: "year",
//         kilometer: "kilometer",
//         number_of_cylinders: "engineSize",
//         location: "location",
//         transmission: "transmission",
//         fuel_type: "fuelType",
//         exterior_color: "exteriorColor",
//         interior_color: "interiorColor",
//         // 'selected_features' will be handled separately as an array
//         description: "description",
//       };

//       Object.entries(formData).forEach(([key, value]) => {
//         const backendKey = fieldMapping[key] || key;
//         if (backendKey === "features") {
//           // DO NOT JSON.stringify an array for FormData, append each item separately
//           englishFeatures.forEach((feature) => {
//             data.append("features", feature);
//           });
//         } else if (key === "make") {
//           data.append(backendKey, makeValue);
//         } else if (key !== "selected_features") {
//           // Exclude selected_features as it's handled above
//           data.append(backendKey, value as string);
//         }
//       });

//       // --- SOLUTION FOR IMAGE DELETION AND PREVENTING REPLACEMENT ISSUES ---
//       // This implements the "re-download and re-upload all images" strategy
//       // to work with the backend's behavior of overwriting the 'images' array.
//       const filesToUpload: { uri: string; type: string; name: string }[] = [];

//       for (const imageItem of images) {
//         // Iterate over ImageItem objects
//         if (imageItem.uri.startsWith("file://")) {
//           // This is a newly picked image from the device's local storage
//           const fileUri =
//             Platform.OS === "android"
//               ? imageItem.uri
//               : imageItem.uri.replace("file://", "");
//           // Ensure imageItem.type is always a valid MIME type for new images.
//           const determinedType = imageItem.type || "image/jpeg"; // Fallback to image/jpeg if type is missing from ImagePicker
//           filesToUpload.push({
//             uri: fileUri,
//             type: determinedType,
//             name: imageItem.name || `new_image_${Date.now()}.jpg`, // Use stored name, fallback
//           });
//         } else if (
//           imageItem.uri.startsWith("http://") ||
//           imageItem.uri.startsWith("https://")
//         ) {
//           // This is an existing image from the server.
//           // We need to download it to a temporary local file to re-upload it.
//           // This is necessary because the backend replaces the entire image array
//           // if any new files are included in the FormData.
//           try {
//             // Extract filename, removing any query parameters for a valid local path
//             const url = new URL(imageItem.uri);
//             const pathSegments = url.pathname.split("/");
//             let filename = pathSegments[pathSegments.length - 1]; // Get last segment after path
//             filename = decodeURIComponent(filename); // Decode URI components just in case

//             // If there's a file extension, try to infer type; otherwise, default
//             const fileExtension = filename.split(".").pop()?.toLowerCase();
//             let inferredType = "image/jpeg";
//             if (fileExtension === "png") {
//               inferredType = "image/png";
//             } else if (fileExtension === "gif") {
//               inferredType = "image/gif";
//             } else if (fileExtension === "jpg" || fileExtension === "jpeg") {
//               inferredType = "image/jpeg";
//             } else if (fileExtension === "webp") {
//               inferredType = "image/webp";
//             }

//             // Using FileSystem.cacheDirectory for temporary storage
//             const tempFilePath = FileSystem.cacheDirectory + filename;

//             console.log(
//               `Downloading existing image for re-upload: ${imageItem.uri}`
//             );
//             console.log(`Saving to temporary path: ${tempFilePath}`);

//             const { uri: downloadedUri, status } =
//               await FileSystem.downloadAsync(imageItem.uri, tempFilePath);

//             if (status === 200) {
//               filesToUpload.push({
//                 uri: downloadedUri,
//                 type: inferredType, // Use inferred type
//                 name: filename, // Use original filename to potentially help backend
//               });
//             } else {
//               console.warn(
//                 `Failed to re-download existing image ${imageItem.uri}. Status: ${status}`
//               );
//               // If a download fails, we skip this image to prevent the upload from failing entirely.
//               // Consider adding a user alert here if this is critical.
//             }
//           } catch (downloadError) {
//             console.error(
//               "Error re-downloading existing image:",
//               downloadError
//             );
//             // Skip this image if an error occurs during download.
//           }
//         }
//       }

//       // Append all collected files (newly picked and re-downloaded existing) to FormData
//       filesToUpload.forEach((file) => {
//         console.log(
//           `Appending file: Name=${file.name}, URI=${file.uri}, Type=${file.type}`
//         ); // Add this log
//         data.append("images", {
//           // 'images' is the field name your backend expects
//           uri: file.uri,
//           type: file.type,
//           name: file.name,
//         } as any); // Type assertion for FormData.append in React Native
//       });
//       // --- END SOLUTION FOR IMAGE DELETION AND REPLACEMENT ISSUES ---

//       // Log FormData content for debugging
//       console.log("FormData to be sent:", data);

//       await updateCar(carId as string, data);

//       showToastable({
//         message: t("listing_updated"),
//         status: "success",
//         duration: 2000,
//       });
//       router.back();
//     } catch (error: any) {
//       setUpdating(false); // Ensure updating state is reset on error
//       console.error("EditListing: Error updating listing:", error);

//       let errorMessage = t("failed_to_update_listing");
//       if (error.response) {
//         // The request was made and the server responded with a status code
//         // that falls out of the range of 2xx
//         console.error("Error response data:", error.response.data);
//         console.error("Error response status:", error.response.status);
//         console.error("Error response headers:", error.response.headers);
//         if (error.response.data && error.response.data.message) {
//           errorMessage = error.response.data.message;
//         } else if (error.response.status) {
//           errorMessage = `${t("failed_to_update_listing")} (Status: ${
//             error.response.status
//           })`;
//         }
//       } else if (error.request) {
//         // The request was made but no response was received
//         console.error("Error request:", error.request);
//         errorMessage = t("no_response_from_server");
//       } else {
//         // Something happened in setting up the request that triggered an Error
//         console.error("Error message:", error.message);
//         errorMessage = error.message || t("failed_to_update_listing");
//       }

//       Alert.alert(t("error"), errorMessage);
//     } finally {
//       setUpdating(false);
//     }
//   };

//   const renderForm = () => (
//     <View style={styles.form}>
//       <Text style={[styles.section_title, rtlStyle]}>{t("general_info")}</Text>
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
//           placeholder={t("price_place_holder")}
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
//         <Text style={[styles.label, rtlStyle]}>{t("select_cylinders")}</Text>
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
//         {featureOptions.map((feature, index) => (
//           <TouchableOpacity
//             key={`${feature}-${index}`}
//             style={[
//               styles.feature_item,
//               { flexDirection: getFlexDirection() },
//               isFeatureSelected(feature) && styles.feature_item_active,
//             ]}
//             onPress={() => toggleFeature(feature)}
//           >
//             <View style={styles.checkbox}>
//               {isFeatureSelected(feature) && (
//                 <Ionicons name="checkmark" size={14} color="#ffffff" />
//               )}
//             </View>
//             <Text
//               style={[
//                 styles.feature_text,
//                 rtlStyle,
//                 { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
//                 isFeatureSelected(feature) && styles.feature_text_active,
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

//       <View
//         style={[
//           styles.sectionTitleContainer,
//           { flexDirection: getFlexDirection() },
//         ]}
//       >
//         <View style={styles.galleryTitleWrapper}>
//           <Text style={[styles.section_titlee]}>{t("gallery")}</Text>
//         </View>

//         <View style={styles.galleryDescriptionWrapper}>
//           <Text style={styles.new_text_style}>{t("gallery_description")}</Text>
//         </View>
//       </View>
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
//         {images.map(
//           (
//             imageItem,
//             index // Use imageItem
//           ) => (
//             <View key={index} style={styles.image_item}>
//               <Image
//                 source={{ uri: imageItem.uri }} // Use imageItem.uri
//                 style={styles.preview_image}
//                 contentFit="cover"
//                 cachePolicy="memory-disk"
//               />
//               <TouchableOpacity
//                 style={styles.remove_image_button}
//                 onPress={() => removeImage(index)}
//               >
//                 <Ionicons name="close-circle" size={20} color="#B80200" />
//               </TouchableOpacity>
//             </View>
//           )
//         )}
//       </View>

//       <TouchableOpacity
//         style={[
//           styles.submit_button,
//           updating && styles.submit_button_disabled,
//         ]}
//         onPress={handleSubmit}
//         disabled={updating}
//       >
//         {updating ? (
//           <ActivityIndicator size="small" color="#ffffff" />
//         ) : (
//           <Text style={[styles.submit_button_text, rtlStyle]}>
//             {t("update_listing")}
//           </Text>
//         )}
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={[styles.loading_container, { paddingTop: insets.top }]}>
//         <ActivityIndicator size="large" color="#B80200" />
//         <Text style={[styles.loading_text, rtlStyle]}>{t("loading")}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
//         <TouchableOpacity
//           style={styles.back_button}
//           onPress={() => router.back()}
//           activeOpacity={0.7}
//         >
//           <Ionicons
//             name={isRTL ? "arrow-forward" : "arrow-back"}
//             size={24}
//             color="#ffffff"
//           />
//         </TouchableOpacity>
//         <Text style={[styles.header_text, rtlStyle]}>{t("edit_listing")}</Text>
//         <View style={styles.header_spacer} />
//       </View>

//       <FlatList
//         data={[0]}
//         renderItem={renderForm}
//         keyExtractor={() => "form"}
//         contentContainerStyle={styles.list_content}
//         showsVerticalScrollIndicator={false}
//       />

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
//   loading_container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//   },
//   loading_text: {
//     fontSize: 16,
//     color: "#666",
//     marginTop: 10,
//   },
//   header: {
//     backgroundColor: "#323332",
//     paddingHorizontal: 20,
//     alignItems: "center",
//     justifyContent: "space-between",
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   back_button: {
//     padding: 8,
//   },
//   header_text: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#ffffff",
//     paddingVertical: 15,
//     paddingHorizontal: 15,
//   },
//   header_spacer: {
//     width: 40,
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
//   picker_disabled: {
//     backgroundColor: "#f0f0f0",
//     borderColor: "#d0d0d0",
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
//     backgroundColor: "#f5f5f5",
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
//     fontWeight: "600",
//     color: "#B80200",
//   },
//   search_container: {
//     marginBottom: 16,
//     paddingHorizontal: 8,
//   },
//   search_input_container: {
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   search_input: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: "#314352",
//   },
//   search_icon_ltr: {
//     marginRight: 8,
//   },
//   search_icon_rtl: {
//     marginLeft: 8,
//   },
//   clear_search: {
//     padding: 5,
//   },
//   no_results_container: {
//     padding: 20,
//     alignItems: "center",
//   },
//   no_results_text: {
//     fontSize: 16,
//     color: "#666",
//   },
//   modal_scroll: {
//     maxHeight: "80%", // Limit scroll view height
//   },
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

//----------------------------------------
// import { Ionicons } from "@expo/vector-icons";
// import * as FileSystem from "expo-file-system"; // Import expo-file-system
// import { Image } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import type { JSX } from "react";
// import { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   Alert,
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
// import { useAuth } from "../contexts/AuthContext";
// import { useRTL } from "../hooks/useRTL";
// import type { Car } from "../types";
// import { getCarById, updateCar } from "../utils/api";
// import { arabicMakes, makes } from "../utils/constants";

// export default function EditListing(): JSX.Element {
//   const BASE_API_URL = "https://api.syriasouq.com";
//   const BASE_IMAGE_UPLOAD_PATH = "/Uploads/cars/";
//   const { t, i18n } = useTranslation();
//   const { isAuthenticated } = useAuth();
//   const { isRTL, rtlStyle, getFlexDirection } = useRTL();
//   const router = useRouter();
//   const { carId } = useLocalSearchParams();
//   const insets = useSafeAreaInsets();
//   const isArabic = i18n.language === "ar";

//   const [loading, setLoading] = useState<boolean>(true);
//   const [updating, setUpdating] = useState<boolean>(false);
//   const [modalVisible, setModalVisible] = useState<boolean>(false);
//   const [currentField, setCurrentField] = useState<string>("");
//   const [modalOptions, setModalOptions] = useState<string[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");

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
//     selected_features: [] as string[], // This will store the translation keys (English keys)
//     description: "",
//   });
//   // `images` state now holds full URLs for existing images and `file://` URIs for new ones.
//   const [images, setImages] = useState<string[]>([]);

//   // Feature translation keys - these are the keys used in i18n
//   const featureKeys = [
//     "ThreeSixty_degree_camera",
//     "Adaptive_headlights",
//     "Blind_spot_warning",
//     "Cooled_Seats",
//     "Heated_seats",
//     "LED_headlights",
//     "Performance_tyres",
//     "Sound_system",
//     "ABS",
//     "Bluetooth",
//     "Extensive_tool_kit",
//     "Keyless_start",
//     "Memory_seat",
//     "Reversing_camera",
//     "Traction_control",
//     "Active_head_restraints",
//     "Blind_spot_alert",
//     "Forward_collision_warning",
//     "Leather_seats",
//     "Navigation_system",
//     "Side_airbags",
//     "USB_port",
//   ];

//   // Get translated feature options for display
//   const featureOptions = featureKeys.map((key) => t(key));

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

//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.replace("/login");
//       return;
//     }

//     if (carId) {
//       fetchCarDetails();
//     }
//   }, [carId, isAuthenticated]);

//   const fetchCarDetails = async (): Promise<void> => {
//     try {
//       setLoading(true);
//       const response = await getCarById(carId as string);
//       const car: Car = response.data?.data || response.data;

//       // Map backend fields to form fields with proper translation handling
//       const translatedMake = isArabic
//         ? arabicMakes.find((m) => m.value === car.make)?.label || car.make
//         : makes.find((m) => m.value === car.make)?.label || car.make;

//       const translatedModel = car.model; // Keep as is for now, will be handled by model options

//       // Convert database feature names to translation keys
//       const dbFeatures = car.features || [];
//       const selectedFeatureKeys = dbFeatures.map((dbFeature) => {
//         // Find the translation key that matches this database feature
//         const matchingKey = featureKeys.find((key) => {
//           const englishTranslation = t(key, { lng: "en" }); // Get English translation
//           return (
//             englishTranslation.toLowerCase() === dbFeature.toLowerCase() ||
//             key.toLowerCase() === dbFeature.toLowerCase()
//           );
//         });
//         return matchingKey || dbFeature;
//       });

//       setFormData({
//         make: translatedMake,
//         model: translatedModel,
//         price_usd: car.priceUSD?.toString() || "",
//         year: car.year?.toString() || "",
//         kilometer: car.kilometer?.toString() || "",
//         number_of_cylinders: car.engineSize?.toString() || "",
//         location: car.location || "",
//         transmission: car.transmission || "",
//         fuel_type: car.fuelType || "",
//         exterior_color: car.exteriorColor || "",
//         interior_color: car.interiorColor || "",
//         selected_features: selectedFeatureKeys, // Store translation keys
//         description: car.description || "",
//       });

//       // --- SOLUTION FOR WHITE SQUARES: Construct full URLs for existing images ---
//       const fullImageUrls = (car.images || []).map((filename: string) => {
//         // Ensure BASE_API_URL and BASE_IMAGE_UPLOAD_PATH are correctly defined in utils/config.ts
//         return `${BASE_API_URL}${BASE_IMAGE_UPLOAD_PATH}${filename}`;
//       });
//       setImages(fullImageUrls); // Set the state with full URLs for display
//       console.log("Full Image URIs loaded:", fullImageUrls);
//       // --- END SOLUTION FOR WHITE SQUARES ---
//     } catch (error: any) {
//       console.error("EditListing: Error fetching car details:", error);
//       Alert.alert(t("error"), t("failedToFetchCarDetails"));
//       router.back();
//     } finally {
//       setLoading(false);
//     }
//   };

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
//     // Find the translation key for this feature
//     const featureIndex = featureOptions.indexOf(feature);
//     const featureKey = featureKeys[featureIndex];

//     if (!featureKey) return;

//     const newFeatures = formData.selected_features.includes(featureKey)
//       ? formData.selected_features.filter((f) => f !== featureKey)
//       : [...formData.selected_features, featureKey];
//     handleInputChange("selected_features", newFeatures);
//   };

//   const isFeatureSelected = (feature: string): boolean => {
//     // Find the translation key for this feature
//     const featureIndex = featureOptions.indexOf(feature);
//     const featureKey = featureKeys[featureIndex];
//     return featureKey ? formData.selected_features.includes(featureKey) : false;
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
//     handleInputChange(currentField as keyof typeof formData, value);
//     setSearchQuery(""); // Clear search when selecting
//     setModalVisible(false);
//   };

//   const pickImages = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert(t("error"), t("media_library_permission_required"));
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ["images"], // Specify media type
//       allowsMultipleSelection: true,
//       selectionLimit: 20 - images.length, // Limit selection based on current images count
//       quality: 0.7,
//     });

//     if (!result.canceled) {
//       const newUris = result.assets.map((asset) => asset.uri);
//       // Append new local URIs to the existing list (which might contain full http/https URLs)
//       setImages((prevImages) => [...prevImages, ...newUris]);
//     }
//   };

//   const removeImage = (index: number) => {
//     // This only removes the image from the frontend `images` state.
//     // The actual "deletion" on the backend occurs because this image's URI
//     // will not be included in the `filesToUpload` for `handleSubmit`,
//     // causing the backend to effectively "forget" it when `car.images` is overwritten.
//     setImages(images.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async () => {
//     if (!isAuthenticated) {
//       Alert.alert(t("error"), t("please_login"));
//       return;
//     }

//     setUpdating(true);
//     try {
//       const data = new FormData();

//       // Convert display values back to backend values
//       const makeValue = isArabic
//         ? arabicMakes.find((m) => m.label === formData.make)?.value ||
//           formData.make
//         : makes.find((m) => m.label === formData.make)?.value || formData.make;

//       // Convert feature keys back to English feature names for database
//       const englishFeatures = formData.selected_features.map((key) => {
//         return t(key, { lng: "en" }); // Get English translation of the key
//       });

//       const fieldMapping: { [key: string]: string } = {
//         make: "make",
//         model: "model",
//         price_usd: "priceUSD",
//         year: "year",
//         kilometer: "kilometer",
//         number_of_cylinders: "engineSize",
//         location: "location",
//         transmission: "transmission",
//         fuel_type: "fuelType",
//         exterior_color: "exteriorColor",
//         interior_color: "interiorColor",
//         selected_features: "features",
//         description: "description",
//       };

//       Object.entries(formData).forEach(([key, value]) => {
//         const backendKey = fieldMapping[key] || key;
//         if (backendKey === "features") {
//           data.append(backendKey, JSON.stringify(englishFeatures)); // Use English features for database
//         } else if (key === "make") {
//           data.append(backendKey, makeValue);
//         } else {
//           data.append(backendKey, value as string);
//         }
//       });

//       // --- SOLUTION FOR IMAGE DELETION AND PREVENTING REPLACEMENT ISSUES ---
//       // This implements the "re-download and re-upload all images" strategy
//       // to work with the backend's behavior of overwriting the 'images' array.
//       const filesToUpload: { uri: string; type: string; name: string }[] = [];

//       for (const uri of images) {
//         if (uri.startsWith("file://")) {
//           // This is a newly picked image from the device's local storage
//           const fileType = uri.split(".").pop() || "jpg";
//           const name = `new_image_${Date.now()}_${Math.random()
//             .toString(36)
//             .substring(7)}.${fileType}`;
//           filesToUpload.push({
//             uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
//             type: `image/${fileType}`,
//             name: name,
//           });
//         } else if (uri.startsWith("http://") || uri.startsWith("https://")) {
//           // This is an existing image from the server.
//           // We need to download it to a temporary local file to re-upload it.
//           // This is necessary because the backend replaces the entire image array
//           // if any new files are included in the FormData.
//           try {
//             const filename = uri.substring(uri.lastIndexOf("/") + 1);
//             // Using FileSystem.cacheDirectory for temporary storage
//             const tempFilePath = FileSystem.cacheDirectory + filename;

//             console.log(`Downloading existing image for re-upload: ${uri}`);
//             const { uri: downloadedUri, status } =
//               await FileSystem.downloadAsync(uri, tempFilePath);

//             if (status === 200) {
//               const fileType = filename.split(".").pop() || "jpg";
//               filesToUpload.push({
//                 uri: downloadedUri,
//                 type: `image/${fileType}`, // Mime type might need to be more specific (e.g., 'image/jpeg')
//                 name: filename, // Use original filename to potentially help backend
//               });
//             } else {
//               console.warn(
//                 `Failed to re-download existing image ${uri}. Status: ${status}`
//               );
//               // If a download fails, we skip this image to prevent the upload from failing entirely.
//               // Consider adding a user alert here if this is critical.
//             }
//           } catch (downloadError) {
//             console.error(
//               "Error re-downloading existing image:",
//               downloadError
//             );
//             // Skip this image if an error occurs during download.
//           }
//         }
//       }

//       // Append all collected files (newly picked and re-downloaded existing) to FormData
//       filesToUpload.forEach((file) => {
//         data.append("images", {
//           // 'images' is the field name your backend expects
//           uri: file.uri,
//           type: file.type,
//           name: file.name,
//         } as any); // Type assertion for FormData.append in React Native
//       });
//       // --- END SOLUTION FOR IMAGE DELETION AND REPLACEMENT ISSUES ---

//       await updateCar(carId as string, data);

//       showToastable({
//         message: t("listing_updated"),
//         status: "success",
//         duration: 2000,
//       });
//       router.back();
//     } catch (error: any) {
//       console.error("EditListing: Error updating listing:", error);
//       // Provide more specific error message if image re-upload fails
//       Alert.alert(t("error"), error.message || t("failed_to_update_listing"));
//     } finally {
//       setUpdating(false);
//     }
//   };

//   const renderForm = () => (
//     <View style={styles.form}>
//       <Text style={[styles.section_title, rtlStyle]}>{t("general_info")}</Text>
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
//           placeholder={t("price_place_holder")}
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
//         <Text style={[styles.label, rtlStyle]}>{t("select_cylinders")}</Text>
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
//         {featureOptions.map((feature, index) => (
//           <TouchableOpacity
//             key={`${feature}-${index}`}
//             style={[
//               styles.feature_item,
//               { flexDirection: getFlexDirection() },
//               isFeatureSelected(feature) && styles.feature_item_active,
//             ]}
//             onPress={() => toggleFeature(feature)}
//           >
//             <View style={styles.checkbox}>
//               {isFeatureSelected(feature) && (
//                 <Ionicons name="checkmark" size={14} color="#ffffff" />
//               )}
//             </View>
//             <Text
//               style={[
//                 styles.feature_text,
//                 rtlStyle,
//                 { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
//                 isFeatureSelected(feature) && styles.feature_text_active,
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
//               cachePolicy="memory-disk"
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
//         style={[
//           styles.submit_button,
//           updating && styles.submit_button_disabled,
//         ]}
//         onPress={handleSubmit}
//         disabled={updating}
//       >
//         {updating ? (
//           <ActivityIndicator size="small" color="#ffffff" />
//         ) : (
//           <Text style={[styles.submit_button_text, rtlStyle]}>
//             {t("update_listing")}
//           </Text>
//         )}
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={[styles.loading_container, { paddingTop: insets.top }]}>
//         <ActivityIndicator size="large" color="#B80200" />
//         <Text style={[styles.loading_text, rtlStyle]}>{t("loading")}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
//         <TouchableOpacity
//           style={styles.back_button}
//           onPress={() => router.back()}
//           activeOpacity={0.7}
//         >
//           <Ionicons
//             name={isRTL ? "arrow-forward" : "arrow-back"}
//             size={24}
//             color="#ffffff"
//           />
//         </TouchableOpacity>
//         <Text style={[styles.header_text, rtlStyle]}>{t("edit_listing")}</Text>
//         <View style={styles.header_spacer} />
//       </View>

//       <FlatList
//         data={[0]}
//         renderItem={renderForm}
//         keyExtractor={() => "form"}
//         contentContainerStyle={styles.list_content}
//         showsVerticalScrollIndicator={false}
//       />

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
//   loading_container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//   },
//   loading_text: {
//     fontSize: 16,
//     color: "#666",
//     marginTop: 10,
//   },
//   header: {
//     backgroundColor: "#323332",
//     paddingHorizontal: 20,
//     alignItems: "center",
//     justifyContent: "space-between",
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   back_button: {
//     padding: 8,
//   },
//   header_text: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#ffffff",
//     paddingVertical: 15,
//     paddingHorizontal: 15,
//   },
//   header_spacer: {
//     width: 40,
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
//   picker_disabled: {
//     backgroundColor: "#f0f0f0",
//     borderColor: "#d0d0d0",
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
//     backgroundColor: "#f5f5f5",
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
//     fontWeight: "600",
//     color: "#B80200",
//   },
//   search_container: {
//     marginBottom: 16,
//     paddingHorizontal: 8,
//   },
//   search_input_container: {
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   search_input: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: "#314352",
//   },
//   search_icon_ltr: {
//     marginRight: 8,
//   },
//   search_icon_rtl: {
//     marginLeft: 8,
//   },
//   clear_search: {
//     padding: 5,
//   },
//   no_results_container: {
//     padding: 20,
//     alignItems: "center",
//   },
//   no_results_text: {
//     fontSize: 16,
//     color: "#666",
//   },
//   modal_scroll: {
//     maxHeight: "80%", // Limit scroll view height
//   },
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
//-----------------------------------------------------------------------------------------------------
// import { Ionicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import type { JSX } from "react";
// import { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   Alert,
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
// import { useAuth } from "../contexts/AuthContext";
// import { useRTL } from "../hooks/useRTL";
// import type { Car } from "../types";
// import { getCarById, updateCar } from "../utils/api";
// import { arabicMakes, makes } from "../utils/constants";

// export default function EditListing(): JSX.Element {
//   const { t, i18n } = useTranslation();
//   const { isAuthenticated } = useAuth();
//   const { isRTL, rtlStyle, getFlexDirection } = useRTL();
//   const router = useRouter();
//   const { carId } = useLocalSearchParams();
//   const insets = useSafeAreaInsets();
//   const isArabic = i18n.language === "ar";

//   const [loading, setLoading] = useState<boolean>(true);
//   const [updating, setUpdating] = useState<boolean>(false);
//   const [modalVisible, setModalVisible] = useState<boolean>(false);
//   const [currentField, setCurrentField] = useState<string>("");
//   const [modalOptions, setModalOptions] = useState<string[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");

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
//     selected_features: [] as string[], // This will store the translation keys (English keys)
//     description: "",
//   });
//   const [images, setImages] = useState<string[]>([]);

//   // Feature translation keys - these are the keys used in i18n
//   const featureKeys = [
//     "ThreeSixty_degree_camera",
//     "Adaptive_headlights",
//     "Blind_spot_warning",
//     "Cooled_Seats",
//     "Heated_seats",
//     "LED_headlights",
//     "Performance_tyres",
//     "Sound_system",
//     "ABS",
//     "Bluetooth",
//     "Extensive_tool_kit",
//     "Keyless_start",
//     "Memory_seat",
//     "Reversing_camera",
//     "Traction_control",
//     "Active_head_restraints",
//     "Blind_spot_alert",
//     "Forward_collision_warning",
//     "Leather_seats",
//     "Navigation_system",
//     "Side_airbags",
//     "USB_port",
//   ];

//   // Get translated feature options for display
//   const featureOptions = featureKeys.map((key) => t(key));

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

//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.replace("/login");
//       return;
//     }

//     if (carId) {
//       fetchCarDetails();
//     }
//   }, [carId, isAuthenticated]);

//   const fetchCarDetails = async (): Promise<void> => {
//     try {
//       setLoading(true);
//       const response = await getCarById(carId as string);
//       const car: Car = response.data?.data || response.data;

//       // Map backend fields to form fields with proper translation handling
//       const translatedMake = isArabic
//         ? arabicMakes.find((m) => m.value === car.make)?.label || car.make
//         : makes.find((m) => m.value === car.make)?.label || car.make;

//       const translatedModel = car.model; // Keep as is for now, will be handled by model options

//       // Convert database feature names to translation keys
//       const dbFeatures = car.features || [];
//       const selectedFeatureKeys = dbFeatures.map((dbFeature) => {
//         // Find the translation key that matches this database feature
//         const matchingKey = featureKeys.find((key) => {
//           const englishTranslation = t(key, { lng: "en" }); // Get English translation
//           return (
//             englishTranslation.toLowerCase() === dbFeature.toLowerCase() ||
//             key.toLowerCase() === dbFeature.toLowerCase()
//           );
//         });
//         return matchingKey || dbFeature;
//       });

//       setFormData({
//         make: translatedMake,
//         model: translatedModel,
//         price_usd: car.priceUSD?.toString() || "",
//         year: car.year?.toString() || "",
//         kilometer: car.kilometer?.toString() || "",
//         number_of_cylinders: car.engineSize?.toString() || "",
//         location: car.location || "",
//         transmission: car.transmission || "",
//         fuel_type: car.fuelType || "",
//         exterior_color: car.exteriorColor || "",
//         interior_color: car.interiorColor || "",
//         selected_features: selectedFeatureKeys, // Store translation keys
//         description: car.description || "",
//       });

//       setImages(car.images || []);
//     } catch (error: any) {
//       console.error("EditListing: Error fetching car details:", error);
//       Alert.alert(t("error"), t("failedToFetchCarDetails"));
//       router.back();
//     } finally {
//       setLoading(false);
//     }
//   };

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
//     // Find the translation key for this feature
//     const featureIndex = featureOptions.indexOf(feature);
//     const featureKey = featureKeys[featureIndex];

//     if (!featureKey) return;

//     const newFeatures = formData.selected_features.includes(featureKey)
//       ? formData.selected_features.filter((f) => f !== featureKey)
//       : [...formData.selected_features, featureKey];
//     handleInputChange("selected_features", newFeatures);
//   };

//   const isFeatureSelected = (feature: string): boolean => {
//     // Find the translation key for this feature
//     const featureIndex = featureOptions.indexOf(feature);
//     const featureKey = featureKeys[featureIndex];
//     return featureKey ? formData.selected_features.includes(featureKey) : false;
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
//     handleInputChange(currentField as keyof typeof formData, value);
//     setSearchQuery(""); // Clear search when selecting
//     setModalVisible(false);
//   };

//   const pickImages = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert(t("error"), t("media_library_permission_required"));
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
//       Alert.alert(t("error"), t("please_login"));
//       return;
//     }

//     setUpdating(true);
//     try {
//       const data = new FormData();

//       // Convert display values back to backend values
//       const makeValue = isArabic
//         ? arabicMakes.find((m) => m.label === formData.make)?.value ||
//           formData.make
//         : makes.find((m) => m.label === formData.make)?.value || formData.make;

//       // Convert feature keys back to English feature names for database
//       const englishFeatures = formData.selected_features.map((key) => {
//         return t(key, { lng: "en" }); // Get English translation of the key
//       });

//       const fieldMapping: { [key: string]: string } = {
//         make: "make",
//         model: "model",
//         price_usd: "priceUSD",
//         year: "year",
//         kilometer: "kilometer",
//         number_of_cylinders: "engineSize",
//         location: "location",
//         transmission: "transmission",
//         fuel_type: "fuelType",
//         exterior_color: "exteriorColor",
//         interior_color: "interiorColor",
//         selected_features: "features",
//         description: "description",
//       };

//       Object.entries(formData).forEach(([key, value]) => {
//         const backendKey = fieldMapping[key] || key;
//         if (backendKey === "features") {
//           data.append(backendKey, JSON.stringify(englishFeatures)); // Use English features for database
//         } else if (key === "make") {
//           data.append(backendKey, makeValue);
//         } else {
//           data.append(backendKey, value as string);
//         }
//       });

//       // Only append new images (those starting with file://)
//       const newImages = images.filter((uri) => uri.startsWith("file://"));
//       newImages.forEach((uri, index) => {
//         const fileType = uri.split(".").pop() || "jpg";
//         const name = `image-${Date.now()}-${index}.${fileType}`;
//         data.append("images", {
//           uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
//           type: `image/${fileType}`,
//           name,
//         } as any);
//       });

//       await updateCar(carId as string, data);

//       showToastable({
//         message: t("listing_updated"),
//         status: "success",
//         duration: 2000,
//       });
//       // Alert.alert(t("success"), t("listing_updated"));
//       router.back();
//     } catch (error: any) {
//       console.error("EditListing: Error updating listing:", error);
//       Alert.alert(t("error"), error.message || t("failed_to_update_listing"));
//     } finally {
//       setUpdating(false);
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
//         {featureOptions.map((feature, index) => (
//           <TouchableOpacity
//             key={`${feature}-${index}`}
//             style={[
//               styles.feature_item,
//               { flexDirection: getFlexDirection() },
//               isFeatureSelected(feature) && styles.feature_item_active,
//             ]}
//             onPress={() => toggleFeature(feature)}
//           >
//             <View style={styles.checkbox}>
//               {isFeatureSelected(feature) && (
//                 <Ionicons name="checkmark" size={14} color="#ffffff" />
//               )}
//             </View>
//             <Text
//               style={[
//                 styles.feature_text,
//                 rtlStyle,
//                 { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
//                 isFeatureSelected(feature) && styles.feature_text_active,
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
//               cachePolicy="memory-disk"
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
//         style={[
//           styles.submit_button,
//           updating && styles.submit_button_disabled,
//         ]}
//         onPress={handleSubmit}
//         disabled={updating}
//       >
//         {updating ? (
//           <ActivityIndicator size="small" color="#ffffff" />
//         ) : (
//           <Text style={[styles.submit_button_text, rtlStyle]}>
//             {t("update_listing")}
//           </Text>
//         )}
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={[styles.loading_container, { paddingTop: insets.top }]}>
//         <ActivityIndicator size="large" color="#B80200" />
//         <Text style={[styles.loading_text, rtlStyle]}>{t("loading")}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
//         <TouchableOpacity
//           style={styles.back_button}
//           onPress={() => router.back()}
//           activeOpacity={0.7}
//         >
//           <Ionicons
//             name={isRTL ? "arrow-forward" : "arrow-back"}
//             size={24}
//             color="#ffffff"
//           />
//         </TouchableOpacity>
//         <Text style={[styles.header_text, rtlStyle]}>{t("edit_listing")}</Text>
//         <View style={styles.header_spacer} />
//       </View>

//       <FlatList
//         data={[0]}
//         renderItem={renderForm}
//         keyExtractor={() => "form"}
//         contentContainerStyle={styles.list_content}
//         showsVerticalScrollIndicator={false}
//       />

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
//   loading_container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//   },
//   loading_text: {
//     fontSize: 16,
//     color: "#666",
//     marginTop: 10,
//   },
//   header: {
//     backgroundColor: "#323332",
//     paddingHorizontal: 20,
//     alignItems: "center",
//     justifyContent: "space-between",
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   back_button: {
//     padding: 8,
//   },
//   header_text: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#ffffff",
//     paddingVertical: 15,
//     paddingHorizontal: 15,
//   },
//   header_spacer: {
//     width: 40,
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
//   picker_disabled: {
//     backgroundColor: "#f0f0f0",
//     borderColor: "#d0d0d0",
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
//     backgroundColor: "#f5f5f5",
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
