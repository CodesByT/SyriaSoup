"use client";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showToastable } from "react-native-toastable";
import ImageCarousel from "../components/ImageCarousel";
import SimpleImageViewer from "../components/SimpleImageViewer";
import CarCard from "../components/car-card";
import { useAuth } from "../contexts/AuthContext";
import { useChatContext } from "../contexts/ChatContext";
import { useRTL } from "../hooks/useRTL";
import type { Car } from "../types";
import {
  addToWishlist,
  checkWishlist,
  getCarById,
  getCars,
  getUserById,
} from "../utils/api";
import { startConversation } from "../utils/chat-api";
import {
  translateCarField,
  translateDescription,
  translateLocation,
  translateMake,
  translateModel,
} from "../utils/translation-helpers";

const { width } = Dimensions.get("window");

export default function CarDetails(): JSX.Element {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { updateUnreadCount } = useChatContext();
  const { isRTL, rtlStyle, getFlexDirection } = useRTL();
  const { carId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isArabic = i18n.language === "ar";

  const [car, setCar] = useState<Car | null>(null);
  const [carOwner, setCarOwner] = useState<any>(null);
  const [relatedCars, setRelatedCars] = useState<Car[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translatedDescription, setTranslatedDescription] =
    useState<string>("");

  // Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportContact, setReportContact] = useState("");
  const [reportPhone, setReportPhone] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Translate car data when car or language changes
  useEffect(() => {
    if (car && car.description) {
      translateDescription(car.description, isArabic).then(
        setTranslatedDescription
      );
    }
  }, [car, isArabic]);

  // Function to translate features
  const translateFeatures = (features: string[]): string => {
    if (!features || features.length === 0) return "N/A";

    const translatedFeatures = features.map((feature) => {
      // Try to get translation, fallback to original if not found
      const translationKey = feature.replace(/\s+/g, "_");
      const translated = t(translationKey);
      return translated !== translationKey ? translated : feature;
    });

    return translatedFeatures.join(isArabic ? "، " : ", ");
  };

  // Get translated car data
  const getTranslatedCarData = () => {
    if (!car) return null;

    return {
      make: translateMake(car.make, isArabic),
      model: translateModel(car.model, car.make, isArabic),
      location: translateLocation(car.location, isArabic),
      transmission: translateCarField(
        "transmission",
        car.transmission,
        isArabic
      ),
      fuelType: translateCarField("fuelType", car.fuelType, isArabic),
      exteriorColor: translateCarField("color", car.exteriorColor, isArabic),
      interiorColor: translateCarField("color", car.interiorColor, isArabic),
      features: translateFeatures(car.features || []),
    };
  };

  const translatedCar = getTranslatedCarData();

  // Update the car title display with proper translation
  const carTitle = translatedCar
    ? `${car?.year} ${translatedCar.make} ${translatedCar.model}`
    : "";

  useEffect(() => {
    if (carId) {
      fetchCarDetails();
      fetchRelatedCars();
      if (isAuthenticated && user?._id) {
        checkCarWishlist();
      }
    }
  }, [carId, isAuthenticated, user?._id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      // console.log("Fetching car details for ID:", carId);

      const response = await getCarById(carId as string);
      const carData = response.data?.data || response.data;

      // console.log("Car data received:", carData);
      // console.log("Car images:", carData.images);

      setCar(carData);

      // Fetch car owner details
      if (carData.user) {
        const userId =
          typeof carData.user === "object" ? carData.user._id : carData.user;
        // console.log("Fetching owner for user ID:", userId);

        try {
          const ownerResponse = await getUserById(userId);
          const ownerData = ownerResponse.data?.data || ownerResponse.data;
          // console.log("Owner data:", ownerData);
          setCarOwner(ownerData);
        } catch (ownerError) {
          console.error("Error fetching owner:", ownerError);
          setCarOwner({
            _id: userId,
            username: "Car Owner",
            phone: "963968888721",
          });
        }
      }

      setError(null);
    } catch (error: any) {
      console.error("CarDetails: Error fetching car:", error);
      setError(error.message || t("failed_to_fetch_car"));

      showToastable({
        message: t("failed_to_fetch_car"),
        status: "warning",
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedCars = async () => {
    try {
      const response = await getCars({ limit: 10 });
      const data = response.data?.data || response.data;
      const carArray = Array.isArray(data)
        ? data.filter((c: Car) => c._id !== carId).slice(0, 6)
        : [];
      setRelatedCars(carArray);
    } catch (error: any) {
      console.error("CarDetails: Error fetching related cars:", error);
    }
  };

  const checkCarWishlist = async () => {
    if (!user?._id) return;
    try {
      const { exists, wishlistId } = await checkWishlist(
        carId as string,
        user._id
      );
      setIsWishlisted(exists);
      setWishlistId(wishlistId);
    } catch (error: any) {
      console.error("CarDetails: Error checking wishlist:", error);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated || !user?._id) {
      showToastable({
        message: t("please_login_to_wishlist"),
        status: "warning",
        duration: 2000,
      });
      router.push("/login");
      return;
    }

    try {
      if (isWishlisted && wishlistId) {
        showToastable({
          message: t("already_in_wishlist"),
          status: "success",
          duration: 2000,
        });
        return;
      }
      const response = await addToWishlist(carId as string);
      const newWishlistItem = response.data?.data;
      if (newWishlistItem?._id) {
        setIsWishlisted(true);
        setWishlistId(newWishlistItem._id);
        showToastable({
          message: t("added_to_wishlist"),
          status: "success",
          duration: 2000,
        });
      }
    } catch (error: any) {
      console.error("CarDetails: Error toggling wishlist:", error);
      if (
        error.response?.status === 400 &&
        error.response?.data?.message === "Car already in wishlist"
      ) {
        showToastable({
          message: t("already_in_wishlist"),
          status: "success",
          duration: 2000,
        });
        checkCarWishlist();
      } else {
        showToastable({
          message: t("failedToAddWishlist"),
          status: "warning",
          duration: 2000,
        });
        Alert.alert(t("error"), t("failed_to_add_wishlist"));
      }
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated || !user?._id) {
      showToastable({
        message: t("please_login_to_chat"),
        status: "warning",
        duration: 2000,
      });
      router.push("/login");
      return;
    }

    if (!car?.user) {
      showToastable({
        message: t("car_owner_not_found"),
        status: "warning",
        duration: 2000,
      });
      return;
    }

    const ownerId = typeof car.user === "object" ? car.user._id : car.user;

    if (ownerId === user._id) {
      showToastable({
        message: t("cannot_chat_with_yourself"),
        status: "warning",
        duration: 2000,
      });
      return;
    }

    setChatLoading(true);
    try {
      // console.log("Starting conversation with user:", ownerId);
      const response = await startConversation(ownerId);
      const conversation = response.data?.data || response.data;
      // console.log("Conversation created/found:", conversation);

      await updateUnreadCount();

      const recipientName = carOwner?.username || "Car Owner";
      router.push(
        `/conversation?conversationId=${conversation._id}&recipientName=${recipientName}`
      );
    } catch (error: any) {
      console.error("CarDetails: Error starting conversation:", error);

      showToastable({
        message: t("failed_to_start_chat"),
        status: "warning",
        duration: 2000,
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleContact = (phone: string, isWhatsApp = false) => {
    const url = isWhatsApp ? `whatsapp://send?phone=${phone}` : `tel:${phone}`;
    Linking.openURL(url).catch((err) =>
      showToastable({
        message: t("failed_to_contact"),
        status: "warning",
        duration: 2000,
      })
    );
  };

  const handleReportAbuse = () => {
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    if (!reportReason) {
      showToastable({
        message: t("please_select_reason"),
        status: "warning",
        duration: 2000,
      });
      return;
    }

    setReportLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            carId: carId,
            reason: reportReason,
            description: reportDescription || "No additional details provided",
            contact: reportContact || "Not provided",
            phone: "Not provided", // Made optional
            language: i18n.language,
          }),
        }
      );

      if (response.ok) {
        showToastable({
          message: t("report_submitted_thanks"),
          status: "success",
          duration: 2000,
        });
        setReportModalVisible(false);
        // Reset form
        setReportReason("");
        setReportDescription("");
        setReportContact("");
        setReportPhone("");
      } else {
        throw new Error("Failed to submit report");
      }
    } catch (error: any) {
      // console.error("Error submitting report:", error);

      showToastable({
        message: t("something_went_wrong"),
        status: "warning",
        duration: 2000,
      });
    } finally {
      setReportLoading(false);
    }
  };

  const handleImagePress = (imageUrl: string, index: number) => {
    // console.log("Image pressed:", imageUrl, "at index:", index);
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

  const formatPrice = (price: number | string | undefined): string => {
    if (!price) return t("priceOnRequest");
    const numericPrice =
      typeof price === "string" ? Number.parseFloat(price) : price;
    return `$${numericPrice.toLocaleString()}`;
  };

  const renderRelatedCarItem = ({ item }: { item: Car }) => (
    <View style={styles.relatedCarItem}>
      <CarCard
        car={item}
        onPress={() => router.push(`/car-details?carId=${item._id}`)}
        onEdit={() => {}}
        onDelete={() => {}}
        showActions={false}
      />
    </View>
  );

  // Updated specifications section to match the screenshot layout
  const renderSpecifications = () => (
    <View style={styles.specsSection}>
      <Text style={[styles.sectionTitle, rtlStyle]}>{t("information")}</Text>
      <View style={styles.specsList}>
        <View
          style={[
            styles.specRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={[styles.specLabel, rtlStyle]}>{t("make")}:</Text>
          <Text
            style={[
              styles.specValue,
              rtlStyle,
              { textAlign: isRTL ? "left" : "right" },
            ]}
          >
            {translatedCar?.make || car?.make}
          </Text>
        </View>
        <View
          style={[
            styles.specRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={[styles.specLabel, rtlStyle]}>{t("model")}:</Text>
          <Text
            style={[
              styles.specValue,
              rtlStyle,
              { textAlign: isRTL ? "left" : "right" },
            ]}
          >
            {translatedCar?.model || car?.model}
          </Text>
        </View>
        <View
          style={[
            styles.specRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={[styles.specLabel, rtlStyle]}>{t("kilometer")}:</Text>
          <Text
            style={[
              styles.specValue,
              rtlStyle,
              { textAlign: isRTL ? "left" : "right" },
            ]}
          >
            {car?.kilometer
              ? `${car.kilometer.toLocaleString()} km`
              : t("notSpecified")}
          </Text>
        </View>
        <View
          style={[
            styles.specRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={[styles.specLabel, rtlStyle]}>{t("price")}:</Text>
          <Text
            style={[
              styles.specValue,
              rtlStyle,
              { textAlign: isRTL ? "left" : "right" },
            ]}
          >
            {formatPrice(car?.priceUSD)}
          </Text>
        </View>
        <View
          style={[
            styles.specRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={[styles.specLabel, rtlStyle]}>
            {t("interior_color")}:
          </Text>
          <Text
            style={[
              styles.specValue,
              rtlStyle,
              { textAlign: isRTL ? "left" : "right" },
            ]}
          >
            {translatedCar?.interiorColor || t("notSpecified")}
          </Text>
        </View>
        <View
          style={[
            styles.specRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={[styles.specLabel, rtlStyle]}>
            {t("exterior_color")}:
          </Text>
          <Text
            style={[
              styles.specValue,
              rtlStyle,
              { textAlign: isRTL ? "left" : "right" },
            ]}
          >
            {translatedCar?.exteriorColor || t("notSpecified")}
          </Text>
        </View>
        <View
          style={[
            styles.specRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={[styles.specLabel, rtlStyle]}>{t("engine_size")}:</Text>
          <Text
            style={[
              styles.specValue,
              rtlStyle,
              { textAlign: isRTL ? "left" : "right" },
            ]}
          >
            {car?.engineSize || t("notSpecified")}
          </Text>
        </View>
        <View
          style={[
            styles.specRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={[styles.specLabel, rtlStyle]}>{t("fuel_type")}:</Text>
          <Text
            style={[
              styles.specValue,
              rtlStyle,
              { textAlign: isRTL ? "left" : "right" },
            ]}
          >
            {translatedCar?.fuelType || t("notSpecified")}
          </Text>
        </View>
        <View
          style={[
            styles.specRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={[styles.specLabel, rtlStyle]}>{t("transmission")}:</Text>
          <Text
            style={[
              styles.specValue,
              rtlStyle,
              { textAlign: isRTL ? "left" : "right" },
            ]}
          >
            {translatedCar?.transmission || t("notSpecified")}
          </Text>
        </View>
        <View
          style={[
            styles.specRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={[styles.specLabel, rtlStyle]}>{t("features")}:</Text>
          <Text
            style={[
              styles.specValue,
              rtlStyle,
              { textAlign: isRTL ? "left" : "right" },
            ]}
          >
            {translatedCar?.features || "N/A"}
          </Text>
        </View>
      </View>
    </View>
  );

  // Update the car title section
  const renderTitleSection = () => (
    <View style={styles.titleSection}>
      <Text style={[styles.carTitle, rtlStyle]}>{carTitle}</Text>
      <Text style={[styles.carPrice, rtlStyle]}>
        {formatPrice(car?.priceUSD)}
      </Text>
      <View
        style={[
          styles.locationContainer,
          { flexDirection: getFlexDirection() },
        ]}
      >
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text
          style={[
            styles.locationText,
            rtlStyle,
            { marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 },
          ]}
        >
          {translatedCar?.location || car?.location}
        </Text>
      </View>
    </View>
  );

  // Update the quick info section
  const renderQuickInfo = () => (
    <View style={styles.quickInfoSection}>
      <View style={styles.quickInfoItem}>
        <Ionicons name="speedometer-outline" size={20} color="#b80200" />
        <Text style={[styles.quickInfoText, rtlStyle]}>
          {car?.kilometer
            ? `${car.kilometer.toLocaleString()} km`
            : t("notSpecified")}
        </Text>
      </View>
      <View style={styles.quickInfoItem}>
        <Ionicons name="car-outline" size={20} color="#b80200" />
        <Text style={[styles.quickInfoText, rtlStyle]}>
          {translatedCar?.transmission || t("notSpecified")}
        </Text>
      </View>
      <View style={styles.quickInfoItem}>
        <Ionicons name="flash-outline" size={20} color="#b80200" />
        <Text style={[styles.quickInfoText, rtlStyle]}>
          {translatedCar?.fuelType || t("notSpecified")}
        </Text>
      </View>
    </View>
  );

  // Update the description section
  const renderDescription = () =>
    car?.description && (
      <View style={styles.descriptionSection}>
        <Text style={[styles.sectionTitle, rtlStyle]}>{t("description")}</Text>
        <Text style={[styles.descriptionText, rtlStyle]}>
          {translatedDescription || car.description}
        </Text>
      </View>
    );

  // Report Modal Component - Mobile Friendly
  const renderReportModal = () => (
    <Modal visible={reportModalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, rtlStyle]}>
              {t("report_listing")}
            </Text>
            <TouchableOpacity onPress={() => setReportModalVisible(false)}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Reason */}
            <Text style={[styles.fieldLabel, rtlStyle]}>
              {t("reason")} <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownContainer}
              onPress={() => setShowReasonDropdown(!showReasonDropdown)}
            >
              <Text style={[styles.dropdownText, rtlStyle]}>
                {reportReason ? t(reportReason) : t("select_a_reason")}
              </Text>
              <Ionicons
                name={showReasonDropdown ? "chevron-up" : "chevron-down"}
                size={16}
                color="#666"
              />
            </TouchableOpacity>

            {/* Reason Options - Only show when dropdown is open */}
            {showReasonDropdown && (
              <View style={styles.reasonOptions}>
                {[
                  "spam",
                  "inappropriate_content",
                  "fraud_scam",
                  "fake_listing",
                  "already_sold",
                  "other_reason",
                ].map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonOption,
                      reportReason === reason && styles.reasonOptionSelected,
                    ]}
                    onPress={() => {
                      setReportReason(reason);
                      setShowReasonDropdown(false);
                    }}
                  >
                    <Text style={[styles.reasonOptionText, rtlStyle]}>
                      {t(reason)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Description */}
            <Text style={[styles.fieldLabel, rtlStyle]}>
              {t("description")} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, rtlStyle]}
              value={reportDescription}
              onChangeText={setReportDescription}
              placeholder={t("please_provide_details_about_issue")}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Contact Email */}
            <Text style={[styles.fieldLabel, rtlStyle]}>
              {t("email")} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, rtlStyle]}
              value={reportContact}
              onChangeText={setReportContact}
              placeholder={t("your_email_for_followup")}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Phone Number */}
            <Text style={[styles.fieldLabel, rtlStyle]}>
              {t("phone_number")} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, rtlStyle]}
              value={reportPhone}
              onChangeText={setReportPhone}
              placeholder={t("your_phone_number")}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
            <View style={styles.emptyBox}></View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setReportModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, rtlStyle]}>
                {t("cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!reportReason ||
                  !reportDescription ||
                  !reportContact ||
                  !reportPhone) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={submitReport}
              disabled={
                reportLoading ||
                !reportReason ||
                !reportDescription ||
                !reportContact ||
                !reportPhone
              }
            >
              {reportLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.submitButtonText, rtlStyle]}>
                  {t("submit_report")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#b80200" />
        <Text style={[styles.loadingText, rtlStyle]}>{t("loading")}</Text>
      </View>
    );
  }

  if (error || !car) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={60} color="#b80200" />
        <Text style={[styles.errorText, rtlStyle]}>
          {error || t("car_not_found")}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCarDetails}>
          <Text style={[styles.retryButtonText, rtlStyle]}>{t("retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with proper Arabic translation */}
      <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtlStyle]} numberOfLines={1}>
          {translatedCar?.make || car.make} {translatedCar?.model || car.model}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel */}
        <ImageCarousel
          images={car.images || []}
          onWishlistPress={handleToggleWishlist}
          isWishlisted={isWishlisted}
          isAuthenticated={isAuthenticated}
          onImagePress={handleImagePress}
        />

        {/* Car Details */}
        <View style={styles.detailsContainer}>
          {/* Title and Price */}
          {renderTitleSection()}

          {/* Quick Info */}
          {renderQuickInfo()}

          {/* Contact Buttons */}
          <View
            style={[
              styles.contactSection,
              { flexDirection: getFlexDirection() },
            ]}
          >
            <TouchableOpacity
              style={styles.chatButton}
              onPress={handleStartChat}
              disabled={chatLoading}
            >
              {chatLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="chatbubble-outline" size={20} color="#ffffff" />
              )}
              <Text style={[styles.chatButtonText, rtlStyle]}>
                {chatLoading ? t("connecting") : t("chat")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleContact(carOwner?.phone || "963968888721")}
            >
              <Ionicons name="call-outline" size={20} color="#ffffff" />
              <Text style={[styles.callButtonText, rtlStyle]}>{t("call")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() =>
                handleContact(carOwner?.phone || "963968888721", true)
              }
            >
              <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
              <Text style={[styles.whatsappButtonText, rtlStyle]}>
                {t("whatsapp")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Seller Info */}
          {carOwner && (
            <View style={styles.sellerSection}>
              <Text style={[styles.sectionTitle, rtlStyle]}>{t("seller")}</Text>
              <View
                style={[
                  styles.sellerInfo,
                  { flexDirection: getFlexDirection() },
                ]}
              >
                <View style={styles.sellerAvatar}>
                  <Ionicons name="person" size={24} color="#666" />
                </View>
                <View
                  style={[
                    styles.sellerDetails,
                    { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 },
                  ]}
                >
                  <Text style={[styles.sellerName, rtlStyle]}>
                    {carOwner.username}
                  </Text>
                  <Text style={[styles.sellerPhone, rtlStyle]}>
                    {carOwner.phone}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Specifications - Updated to match screenshot */}
          {renderSpecifications()}

          {/* Description */}
          {renderDescription()}

          {/* Report Button */}
          <TouchableOpacity
            style={[styles.reportButton, { flexDirection: getFlexDirection() }]}
            onPress={handleReportAbuse}
          >
            <Ionicons name="flag-outline" size={16} color="#dc3545" />
            <Text
              style={[
                styles.reportButtonText,
                rtlStyle,
                { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
              ]}
            >
              {t("report_abuse")}
            </Text>
          </TouchableOpacity>

          {/* Related Cars */}
          {relatedCars.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[styles.sectionTitle, rtlStyle]}>
                {t("you_may_also_like")}
              </Text>
              <FlatList
                data={relatedCars}
                keyExtractor={(item) => item._id}
                renderItem={renderRelatedCarItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedList}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Report Modal */}
      {renderReportModal()}

      {/* Simple Image Viewer Modal */}
      <SimpleImageViewer
        visible={imageViewerVisible}
        images={car.images || []}
        initialIndex={selectedImageIndex}
        onClose={() => setImageViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#323332",
  },
  header: {
    backgroundColor: "##323332",
    paddingHorizontal: 20,
    // paddingVertical: 15,
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginHorizontal: 16,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  shareButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  detailsContainer: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  carTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  carPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#b80200",
    marginBottom: 8,
  },
  locationContainer: {
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 16,
    color: "#666",
  },
  quickInfoSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickInfoItem: {
    alignItems: "center",
    gap: 8,
  },
  quickInfoText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    textAlign: "center",
  },
  contactSection: {
    gap: 12,
    marginBottom: 20,
  },
  chatButton: {
    flex: 1,
    backgroundColor: "#A00709",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#b80200",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chatButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  callButton: {
    flex: 1,
    backgroundColor: "#A00709",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  callButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  whatsappButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  sellerSection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sellerInfo: {
    alignItems: "center",
    gap: 12,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  sellerPhone: {
    fontSize: 14,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  // Updated specifications styles to match screenshot
  specsSection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  specsList: {
    gap: 12,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  specLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    flex: 1,
  },
  specValue: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  descriptionSection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  reportButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dc3545",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 8,
  },
  reportButtonText: {
    color: "#dc3545",
    fontSize: 14,
    fontWeight: "600",
  },
  relatedSection: {
    marginBottom: 20,
  },
  relatedList: {
    paddingHorizontal: 4,
  },
  relatedCarItem: {
    width: 280,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: "#b80200",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Report Modal Styles - Mobile Friendly
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: width - 32,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  modalContent: {
    padding: 16,
    maxHeight: 400,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 12,
  },
  required: {
    color: "#dc3545",
  },
  dropdownContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  reasonOptions: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  reasonOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  reasonOptionSelected: {
    backgroundColor: "#e3f2fd",
  },
  reasonOptionText: {
    fontSize: 14,
    color: "#333",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    height: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyBox: {
    height: 30,
  },
});
