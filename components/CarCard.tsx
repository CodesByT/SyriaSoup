"use client";

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRTL } from "../hooks/useRTL";
import type { Car } from "../types";
import {
  translateLocation,
  translateMake,
  translateModel,
} from "../utils/translation-helpers";

interface CarCardProps {
  car?: Car;
  onWishlist: () => void;
  onPress: () => void;
  hideWishlistIcon?: boolean;
  isWishlisted?: boolean;
  isAuthenticated?: boolean;
}

export default function CarCard({
  car,
  onWishlist,
  onPress,
  hideWishlistIcon,
  isWishlisted = false,
  isAuthenticated = false,
}: CarCardProps) {
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const [isLoading, setIsLoading] = useState(true);
  const isArabic = i18n.language === "ar";

  if (!car) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{t("invalidCar")}</Text>
      </View>
    );
  }

  const imageUrl =
    car.images?.[0] || "https://via.placeholder.com/150?text=No+Image";

  // Get translated values
  const make = translateMake(car.make, isArabic);
  const model = translateModel(car.model, car.make, isArabic);
  const location = translateLocation(car.location, isArabic);

  const handleShare = async () => {
    try {
      const shareUrl = `https://syriasouq.com/car/${car._id}`;
      const message = `Check out this ${car.year} ${car.make} ${car.model} for $${car.priceUSD} on Syria Souq!

${shareUrl}`;

      await Share.share({
        message,
        url: shareUrl,
        title: `${car.year} ${car.make} ${car.model}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert(t("error"), t("failed_to_share"));
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.card, { flexDirection: isRTL ? "row-reverse" : "row" }]}
      >
        <View style={styles.imageContainer}>
          {isLoading && (
            <ActivityIndicator
              size="large"
              color="#b80200"
              style={styles.loadingIndicator}
            />
          )}
          <Image
            key={imageUrl}
            source={{ uri: imageUrl }}
            style={[
              styles.image,
              isLoading && { opacity: 0 },
              isRTL
                ? {
                    borderTopRightRadius: 12,
                    borderBottomRightRadius: 12,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  }
                : {
                    borderTopLeftRadius: 12,
                    borderBottomLeftRadius: 12,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  },
            ]}
            cachePolicy="memory-disk"
            onError={(e) => {
              console.log("CarCard: Image load error:", {
                carId: car._id,
                url: imageUrl,
                error: e.error,
              });
              setIsLoading(false);
            }}
            onLoad={() => {
              setIsLoading(false);
            }}
            contentFit="cover"
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.price, { textAlign: isRTL ? "right" : "left" }]}>
            ${car.priceUSD}
          </Text>
          <Text
            style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {`${make} ${model} ${car.year}`}
          </Text>
          <View
            style={[
              styles.detailsRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <View
              style={[
                styles.detailItem,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Ionicons
                name="location-sharp"
                size={16}
                color="#b80200"
                style={{
                  marginRight: isRTL ? 0 : 4,
                  marginLeft: isRTL ? 4 : 0,
                }}
              />
              <Text
                style={[
                  styles.detailText,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {location}
              </Text>
            </View>
            <View
              style={[
                styles.detailItem,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Ionicons
                name="speedometer"
                size={16}
                color="#b80200"
                style={{
                  marginRight: isRTL ? 0 : 4,
                  marginLeft: isRTL ? 4 : 0,
                }}
              />
              <Text
                style={[
                  styles.detailText,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {car.kilometer}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.buttonRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <TouchableOpacity
              onPress={onPress}
              style={styles.viewDetailsButton}
            >
              <Text style={styles.viewDetailsText}>{t("viewDetails")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Ionicons name="share-outline" size={16} color="#b80200" />
            </TouchableOpacity>
          </View>
        </View>
        {!hideWishlistIcon && (
          <TouchableOpacity
            onPress={onWishlist}
            style={[
              styles.wishlistIcon,
              isWishlisted && isAuthenticated && styles.wishlistIconActive,
              isRTL
                ? { left: 8, right: undefined }
                : { right: 8, left: undefined },
            ]}
          >
            <Ionicons
              name={isWishlisted && isAuthenticated ? "heart" : "heart-outline"}
              size={24}
              color={isWishlisted && isAuthenticated ? "#ffffff" : "#b80200"}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  card: {
    flexDirection: "row",
    height: 150,
    overflow: "hidden",
  },
  imageContainer: {
    width: "40%",
    height: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  loadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  info: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#313332",
    marginBottom: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#b80200",
    marginBottom: 4,
  },
  text: {
    fontSize: 16,
    color: "#313332",
    textAlign: "center",
    padding: 16,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 4,
    gap: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#313332",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewDetailsButton: {
    backgroundColor: "#b80200",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  shareButton: {
    backgroundColor: "rgba(184, 2, 0, 0.1)",
    borderWidth: 1,
    borderColor: "#b80200",
    borderRadius: 8,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  wishlistIconActive: {
    backgroundColor: "#b80200",
  },
});
