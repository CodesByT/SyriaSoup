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

interface CarCardGridProps {
  car?: Car;
  onWishlist: () => void;
  onPress: () => void;
  hideWishlistIcon?: boolean;
  isWishlisted?: boolean;
  wishlistId?: string;
  isAuthenticated: boolean;
}

export default function CarCardGrid({
  car,
  onWishlist,
  onPress,
  hideWishlistIcon,
  isWishlisted = false,
  isAuthenticated,
}: CarCardGridProps) {
  const { t, i18n } = useTranslation();
  const { isRTL, rtlStyle, rtlViewStyle, getFlexDirection } = useRTL();
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const isArabic = i18n.language === "ar";

  if (!car) {
    return (
      <View style={[styles.container, rtlViewStyle]}>
        <Text style={[styles.text, rtlStyle]}>{t("invalid_car")}</Text>
      </View>
    );
  }

  const imageUrl =
    car.images?.[0] || "https://via.placeholder.com/400x200?text=No+Image";

  // Translate car data
  const translatedMake = translateMake(car.make, isArabic);
  const translatedModel = translateModel(car.model, car.make, isArabic);
  const translatedLocation = translateLocation(car.location, isArabic);

  const handleImageError = (e: any) => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setImageError(false);
    setReloadKey(reloadKey + 1);
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://syriasouq.com/car/${car._id}`;
      const message = `Check out this ${car.year} ${translatedMake} ${translatedModel} for $${car.priceUSD} on Syria Souq!\n\n${shareUrl}`;

      await Share.share({
        message,
        url: shareUrl,
        title: `${car.year} ${translatedMake} ${translatedModel}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert(t("error"), t("failed_to_share"));
    }
  };

  return (
    <View style={[styles.container, rtlViewStyle]}>
      <TouchableOpacity onPress={onPress} style={styles.card}>
        <View style={styles.imageContainer}>
          {isLoading && !imageError && (
            <ActivityIndicator
              size="large"
              color="#b80200"
              style={styles.loadingIndicator}
            />
          )}
          {imageError ? (
            <View style={styles.errorContainer}>
              <Image
                source={{
                  uri: "https://via.placeholder.com/400x200?text=Image+Failed",
                }}
                style={styles.image}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
              >
                <Ionicons name="refresh" size={25} color="grey" />
              </TouchableOpacity>
            </View>
          ) : (
            <Image
              key={`${imageUrl}-${reloadKey}`}
              source={{ uri: imageUrl }}
              style={[styles.image, isLoading && { opacity: 0 }]}
              cachePolicy="none"
              onError={handleImageError}
              onLoad={() => {
                setIsLoading(false);
              }}
              contentFit="cover"
            />
          )}
        </View>
        <View style={styles.info}>
          <Text
            style={[styles.title, rtlStyle]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {`${translatedMake} ${translatedModel} ${car.year}`}
          </Text>
          <Text style={[styles.price, rtlStyle]}>${car.priceUSD}</Text>
          <View
            style={[styles.detailsRow, { flexDirection: getFlexDirection() }]}
          >
            <View
              style={[styles.detailItem, { flexDirection: getFlexDirection() }]}
            >
              <Ionicons
                name="location-sharp"
                size={14}
                color="#757575"
                style={[
                  styles.detailIcon,
                  { marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 },
                ]}
              />
              <Text style={[styles.detailText, rtlStyle]}>
                {translatedLocation}
              </Text>
            </View>
            <View
              style={[styles.detailItem, { flexDirection: getFlexDirection() }]}
            >
              <Ionicons
                name="speedometer"
                size={14}
                color="#757575"
                style={[
                  styles.detailIcon,
                  { marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 },
                ]}
              />
              <Text style={[styles.detailText, rtlStyle]}>{car.kilometer}</Text>
            </View>
          </View>
          <View
            style={[styles.buttonRow, { flexDirection: getFlexDirection() }]}
          >
            <TouchableOpacity
              onPress={onPress}
              style={styles.viewDetailsButton}
            >
              <Text style={[styles.viewDetailsText, rtlStyle]}>
                {t("view_details")}
              </Text>
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
              {
                top: 8,
                right: isRTL ? undefined : 8,
                left: isRTL ? 8 : undefined,
              },
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
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    flex: 1,
    maxWidth: "48%",
  },
  card: {
    flexDirection: "column",
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
  },
  imageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
    backgroundColor: "#e0e0e0",
  },
  image: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
  },
  loadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  errorContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  retryButton: {
    position: "absolute",
    transform: [{ rotate: "30deg" }],
  },
  info: {
    padding: 10,
    justifyContent: "space-between",
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#314352",
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#b80200",
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: "#314352",
    textAlign: "center",
    padding: 16,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 8,
    gap: 10,
    flexWrap: "wrap",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#555555",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: "auto",
  },
  viewDetailsButton: {
    backgroundColor: "#b80200",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#ffffff",
    fontSize: 11,
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
    backgroundColor: "rgba(255, 255, 255, 0.8)",
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
