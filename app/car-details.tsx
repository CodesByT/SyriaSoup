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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ImageCarousel from "../components/ImageCarousel";
import SimpleImageViewer from "../components/SimpleImageViewer"; // Using the simple version
import CarCard from "../components/car-card";
import { useAuth } from "../contexts/AuthContext";
import { useChatContext } from "../contexts/ChatContext";
import type { Car } from "../types";
import {
  addToWishlist,
  checkWishlist,
  getCarById,
  getCars,
  getUserById,
} from "../utils/api";
import { startConversation } from "../utils/chat-api";

const { width } = Dimensions.get("window");

export default function CarDetails(): JSX.Element {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { updateUnreadCount } = useChatContext();
  const { carId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [car, setCar] = useState<Car | null>(null);
  const [carOwner, setCarOwner] = useState<any>(null);
  const [relatedCars, setRelatedCars] = useState<Car[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
      console.log("Fetching car details for ID:", carId);

      const response = await getCarById(carId as string);
      const carData = response.data?.data || response.data;

      console.log("Car data received:", carData);
      console.log("Car images:", carData.images);

      setCar(carData);

      // Fetch car owner details
      if (carData.user) {
        const userId =
          typeof carData.user === "object" ? carData.user._id : carData.user;
        console.log("Fetching owner for user ID:", userId);

        try {
          const ownerResponse = await getUserById(userId);
          const ownerData = ownerResponse.data?.data || ownerResponse.data;
          console.log("Owner data:", ownerData);
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
      Alert.alert(t("error"), error.message || t("failed_to_fetch_car"));
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
      Alert.alert(t("error"), t("please_login_to_wishlist"));
      router.push("/login");
      return;
    }

    try {
      if (isWishlisted && wishlistId) {
        Alert.alert(t("info"), t("already_in_wishlist"));
        return;
      }
      const response = await addToWishlist(carId as string);
      const newWishlistItem = response.data?.data;
      if (newWishlistItem?._id) {
        setIsWishlisted(true);
        setWishlistId(newWishlistItem._id);
        Alert.alert(t("success"), t("added_to_wishlist"));
      }
    } catch (error: any) {
      console.error("CarDetails: Error toggling wishlist:", error);
      if (
        error.response?.status === 400 &&
        error.response?.data?.message === "Car already in wishlist"
      ) {
        Alert.alert(t("info"), t("already_in_wishlist"));
        checkCarWishlist();
      } else {
        Alert.alert(t("error"), t("failed_to_add_wishlist"));
      }
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated || !user?._id) {
      Alert.alert(t("error"), t("please_login_to_chat"));
      router.push("/login");
      return;
    }

    if (!car?.user) {
      Alert.alert(t("error"), t("car_owner_not_found"));
      return;
    }

    const ownerId = typeof car.user === "object" ? car.user._id : car.user;

    if (ownerId === user._id) {
      Alert.alert(t("error"), t("cannot_chat_with_yourself"));
      return;
    }

    setChatLoading(true);
    try {
      console.log("Starting conversation with user:", ownerId);
      const response = await startConversation(ownerId);
      const conversation = response.data?.data || response.data;
      console.log("Conversation created/found:", conversation);

      await updateUnreadCount();

      const recipientName = carOwner?.username || "Car Owner";
      router.push(
        `/conversation?conversationId=${conversation._id}&recipientName=${recipientName}`
      );
    } catch (error: any) {
      console.error("CarDetails: Error starting conversation:", error);
      Alert.alert(t("error"), t("failed_to_start_chat"));
    } finally {
      setChatLoading(false);
    }
  };

  const handleContact = (phone: string, isWhatsApp = false) => {
    const url = isWhatsApp ? `whatsapp://send?phone=${phone}` : `tel:${phone}`;
    Linking.openURL(url).catch((err) =>
      Alert.alert(t("error"), t("failed_to_contact"))
    );
  };

  const handleReportAbuse = () => {
    Alert.alert(t("report_abuse"), t("report_abuse_message"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("submit"),
        onPress: () => Alert.alert(t("success"), t("report_submitted")),
      },
    ]);
  };

  const handleImagePress = (imageUrl: string, index: number) => {
    console.log("Image pressed:", imageUrl, "at index:", index);
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#b80200" />
        <Text style={styles.loadingText}>{t("loading")}</Text>
      </View>
    );
  }

  if (error || !car) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={60} color="#b80200" />
        <Text style={styles.errorText}>{error || t("car_not_found")}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCarDetails}>
          <Text style={styles.retryButtonText}>{t("retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {car.make} {car.model}
        </Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
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
          <View style={styles.titleSection}>
            <Text style={styles.carTitle}>
              {car.year} {car.make} {car.model}
            </Text>
            <Text style={styles.carPrice}>{formatPrice(car.priceUSD)}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.locationText}>{car.location}</Text>
            </View>
          </View>

          {/* Quick Info */}
          <View style={styles.quickInfoSection}>
            <View style={styles.quickInfoItem}>
              <Ionicons name="speedometer-outline" size={20} color="#b80200" />
              <Text style={styles.quickInfoText}>
                {car.kilometer
                  ? `${car.kilometer.toLocaleString()} km`
                  : t("notSpecified")}
              </Text>
            </View>
            <View style={styles.quickInfoItem}>
              <Ionicons name="car-outline" size={20} color="#b80200" />
              <Text style={styles.quickInfoText}>
                {car.transmission || t("notSpecified")}
              </Text>
            </View>
            <View style={styles.quickInfoItem}>
              <Ionicons name="flash-outline" size={20} color="#b80200" />
              <Text style={styles.quickInfoText}>
                {car.fuelType || t("notSpecified")}
              </Text>
            </View>
          </View>

          {/* Contact Buttons */}
          <View style={styles.contactSection}>
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
              <Text style={styles.chatButtonText}>
                {chatLoading ? t("connecting") : t("chat")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleContact(carOwner?.phone || "963968888721")}
            >
              <Ionicons name="call-outline" size={20} color="#ffffff" />
              <Text style={styles.callButtonText}>{t("call")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() =>
                handleContact(carOwner?.phone || "963968888721", true)
              }
            >
              <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
              <Text style={styles.whatsappButtonText}>{t("whatsapp")}</Text>
            </TouchableOpacity>
          </View>

          {/* Seller Info */}
          {carOwner && (
            <View style={styles.sellerSection}>
              <Text style={styles.sectionTitle}>{t("seller")}</Text>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  <Ionicons name="person" size={24} color="#666" />
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>{carOwner.username}</Text>
                  <Text style={styles.sellerPhone}>{carOwner.phone}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Specifications */}
          <View style={styles.specsSection}>
            <Text style={styles.sectionTitle}>{t("specifications")}</Text>
            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>{t("make")}</Text>
                <Text style={styles.specValue}>{car.make}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>{t("model")}</Text>
                <Text style={styles.specValue}>{car.model}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>{t("year")}</Text>
                <Text style={styles.specValue}>{car.year}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>{t("kilometer")}</Text>
                <Text style={styles.specValue}>
                  {car.kilometer
                    ? `${car.kilometer.toLocaleString()} km`
                    : t("notSpecified")}
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>{t("engine_size")}</Text>
                <Text style={styles.specValue}>
                  {car.engineSize || t("notSpecified")}
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>{t("transmission")}</Text>
                <Text style={styles.specValue}>
                  {car.transmission || t("notSpecified")}
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>{t("fuel_type")}</Text>
                <Text style={styles.specValue}>
                  {car.fuelType || t("notSpecified")}
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>{t("exterior_color")}</Text>
                <Text style={styles.specValue}>
                  {car.exteriorColor || t("notSpecified")}
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>{t("interior_color")}</Text>
                <Text style={styles.specValue}>
                  {car.interiorColor || t("notSpecified")}
                </Text>
              </View>
            </View>
          </View>

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>{t("features")}</Text>
              <View style={styles.featuresGrid}>
                {car.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#28a745"
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {car.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>{t("description")}</Text>
              <Text style={styles.descriptionText}>{car.description}</Text>
            </View>
          )}

          {/* Report Button */}
          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleReportAbuse}
          >
            <Ionicons name="flag-outline" size={16} color="#dc3545" />
            <Text style={styles.reportButtonText}>{t("report_abuse")}</Text>
          </TouchableOpacity>

          {/* Related Cars */}
          {relatedCars.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.sectionTitle}>{t("you_may_also_like")}</Text>
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
    backgroundColor: "#1a1a1a",
  },
  header: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
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
    flexDirection: "row",
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
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  chatButton: {
    flex: 1,
    backgroundColor: "#b80200",
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
    backgroundColor: "#007bff",
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
    flexDirection: "row",
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
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  specItem: {
    width: (width - 80) / 2,
    marginBottom: 12,
  },
  specLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  featuresSection: {
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
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: (width - 80) / 2,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#1a1a1a",
    flex: 1,
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
    flexDirection: "row",
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
});
