import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CarCardGrid from "../components/CarCardGrid";
import { useAuth } from "../contexts/AuthContext";
import { Car } from "../types";
import {
  addToWishlist,
  checkWishlist,
  getCarById,
  getCars,
} from "../utils/api";

export default function CarDetails() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { carId } = useLocalSearchParams();
  const [car, setCar] = useState<Car | null>(null);
  const [relatedCars, setRelatedCars] = useState<Car[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      const response = await getCarById(carId as string);
      const carData = response.data?.data || response.data;
      console.log("CarDetails: Car data:", carData);
      setCar(carData);
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
      const response = await getCars({ limit: 6 });
      const data = response.data?.data || response.data;
      const carArray = Array.isArray(data)
        ? data.filter((c: Car) => c._id !== carId).slice(0, 6)
        : [];
      console.log("CarDetails: Related cars:", carArray);
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
      console.log("CarDetails: Wishlist check:", { exists, wishlistId });
      setIsWishlisted(exists);
      setWishlistId(wishlistId);
    } catch (error: any) {
      console.error("CarDetails: Error checking wishlist:", error);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated || !user?._id) {
      Alert.alert(t("error"), t("please_login_to_wishlist"));
      router.push("/(auth)/login");
      return;
    }

    try {
      if (isWishlisted && wishlistId) {
        console.log("CarDetails: Car already in wishlist:", carId, wishlistId);
        Alert.alert(t("info"), t("already_in_wishlist"));
        return;
      }
      const response = await addToWishlist(carId as string);
      const newWishlistItem = response.data?.data;
      if (newWishlistItem?._id) {
        console.log(
          "CarDetails: Added car to wishlist:",
          carId,
          newWishlistItem._id
        );
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

  const handleContact = (phone: string, isWhatsApp: boolean = false) => {
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

  const checkRelatedCarWishlist = async (
    carId: string
  ): Promise<{ isWishlisted: boolean; wishlistId?: string }> => {
    if (!isAuthenticated || !user?._id) {
      return { isWishlisted: false };
    }
    try {
      const { exists, wishlistId } = await checkWishlist(carId, user._id);
      return { isWishlisted: exists, wishlistId };
    } catch (error: any) {
      console.error("CarDetails: Error checking related car wishlist:", error);
      return { isWishlisted: false };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b80200" />
        <Text style={styles.noResults}>{t("loading")}</Text>
      </View>
    );
  }

  if (error || !car) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.noResults}>{error || t("car_not_found")}</Text>
        <Button title={t("retry")} onPress={fetchCarDetails} color="#b80200" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{t("car_details")}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              car.images?.[0] ||
              "https://via.placeholder.com/400x200?text=No+Image",
          }}
          style={styles.mainImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          onPress={handleToggleWishlist}
          style={[
            styles.wishlistIcon,
            isWishlisted && isAuthenticated && styles.wishlistIconActive,
          ]}
        >
          <Ionicons
            name={isWishlisted && isAuthenticated ? "heart" : "heart-outline"}
            size={24}
            color="#b80200"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.title}>
          {car.make} {car.model} {car.year}
        </Text>
        <Text style={styles.price}>${car.priceUSD}</Text>
        <Text style={styles.location}>{car.location}</Text>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>{t("information")}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("make")}:</Text>
            <Text style={styles.infoValue}>{car.make}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("model")}:</Text>
            <Text style={styles.infoValue}>{car.model}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("kilometer")}:</Text>
            <Text style={styles.infoValue}>{car.kilometer} km</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("price")}:</Text>
            <Text style={styles.infoValue}>${car.priceUSD}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("interior_color")}:</Text>
            <Text style={styles.infoValue}>{car.interiorColor}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("exterior_color")}:</Text>
            <Text style={styles.infoValue}>{car.exteriorColor}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("engine_size")}:</Text>
            <Text style={styles.infoValue}>{car.engineSize}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("fuel_type")}:</Text>
            <Text style={styles.infoValue}>{car.fuelType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("transmission")}:</Text>
            <Text style={styles.infoValue}>{car.transmission}</Text>
          </View>
          {car.features && car.features.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("features")}:</Text>
              <Text style={styles.infoValue}>{car.features.join(", ")}</Text>
            </View>
          )}
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>{t("description")}</Text>
          <Text style={styles.description}>
            {car.description || t("no_description")}
          </Text>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>{t("contact_seller")}</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContact("963968888721")}
            >
              <Text style={styles.contactButtonText}>{t("call")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactButton, styles.whatsappButton]}
              onPress={() => handleContact("963968888721", true)}
            >
              <Text style={styles.contactButtonText}>{t("whatsapp")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={handleReportAbuse}
        >
          <Text style={styles.reportButtonText}>{t("report_abuse")}</Text>
        </TouchableOpacity>

        {relatedCars.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>{t("you_may_also_like")}</Text>
            <FlatList
              data={relatedCars}
              keyExtractor={(item) => item._id}
              renderItem={({ item }: { item: Car }) => (
                <CarCardGrid
                  car={item}
                  onPress={() => router.push(`/car-details?carId=${item._id}`)}
                  onWishlist={async () => {
                    const { isWishlisted, wishlistId } =
                      await checkRelatedCarWishlist(item._id);
                    if (!isWishlisted) {
                      await handleToggleWishlist();
                    } else {
                      Alert.alert(t("info"), t("already_in_wishlist"));
                    }
                  }}
                  isWishlisted={false} // Determined dynamically
                  wishlistId={undefined} // Determined dynamically
                  isAuthenticated={isAuthenticated}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedList}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#323232",
    padding: 20,
    paddingTop: 40,
    flexDirection: "row",
    alignItems: "center",
    position: "fixed",
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  imageContainer: {
    position: "relative",
    height: 200,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  wishlistIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  wishlistIconActive: {
    opacity: 1,
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#314352",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#b80200",
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: "#555555",
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#314352",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#314352",
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: "#555555",
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: "#555555",
  },
  contactSection: {
    marginBottom: 16,
  },
  contactButtons: {
    flexDirection: "row",
    gap: 10,
  },
  contactButton: {
    backgroundColor: "#b80200",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  whatsappButton: {
    backgroundColor: "#25D366",
  },
  contactButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  reportButton: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  reportButtonText: {
    color: "#b80200",
    fontSize: 14,
    fontWeight: "600",
  },
  relatedSection: {
    marginBottom: 16,
  },
  relatedList: {
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#314352",
  },
});
