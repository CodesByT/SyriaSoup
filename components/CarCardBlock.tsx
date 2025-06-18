"use client";

import { locationOptionsData } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
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

interface CarCardBlockProps {
  car?: Car;
  onWishlist?: () => void;
  onPress: () => void;
  hideWishlistIcon?: boolean;
  onDelete?: () => void;
  showDeleteIcon?: boolean;
}

export default function CarCardBlock({
  car,
  onWishlist,
  onPress,
  hideWishlistIcon,
  onDelete,
  showDeleteIcon,
}: CarCardBlockProps) {
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const [isLoading, setIsLoading] = useState(true);
  const isArabic = i18n.language === "ar";

  if (!car) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}>
          {t("invalidCar")}
        </Text>
      </View>
    );
  }

  // const imageUrl = car.images?.[0]
  //   ? `${car.images[0]}?t=${Date.now()}`
  //   : "https://via.placeholder.com/400x200?text=No+Image";
  const imageUrl = car.images?.[0]
    ? `${car.images[0]}`
    : "https://via.placeholder.com/400x200?text=No+Image";
  // const placeholderUrl = car.images?.[0]
  //   ? `${car.images[0]}?w=50&h=50`
  //   : "https://via.placeholder.com/50x50?text=Loading"; // Low-res placeholder

  // Get translated values
  const make = translateMake(car.make, isArabic);
  const model = translateModel(car.model, car.make, isArabic);
  const location = translateLocation(car.location, isArabic);

  // Helper function to get the localized display value for location
  const getLocalizedLocation = (
    englishLocation: string | undefined
  ): string => {
    if (!englishLocation) {
      return t("notSpecified"); // Use t() for "Not Specified" if it's a translatable string
    }

    const foundItem = locationOptionsData.find(
      (item) => item.en === englishLocation
    );
    if (foundItem) {
      return isArabic ? foundItem.ar : foundItem.en;
    }
    return englishLocation; // Fallback to English if no translation found
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} style={styles.card}>
        <View style={styles.imageContainer}>
          {isLoading && (
            <ActivityIndicator
              size="large"
              color="#b80200"
              style={styles.loadingIndicator}
            />
          )}
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            cachePolicy="none"
            transition={200} // Smooth transition
            onError={(e) => {
              setIsLoading(false);
            }}
            onLoad={() => {
              setIsLoading(false);
            }}
            contentFit="cover"
          />
        </View>
        <View style={styles.info}>
          <Text
            style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {`${make} ${model} ${car.year}`}
          </Text>
          <Text style={[styles.price, { textAlign: isRTL ? "right" : "left" }]}>
            ${car.priceUSD}
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
                size={14}
                color="#757575"
                style={{
                  marginRight: isRTL ? 0 : 6,
                  marginLeft: isRTL ? 6 : 0,
                }}
              />
              <Text
                style={[
                  styles.detailText,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {getLocalizedLocation(car.location)}
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
                size={14}
                color="#757575"
                style={{
                  marginRight: isRTL ? 0 : 6,
                  marginLeft: isRTL ? 6 : 0,
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
          <TouchableOpacity onPress={onPress} style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>{t("viewDetails")}</Text>
          </TouchableOpacity>
        </View>
        {showDeleteIcon && onDelete ? (
          <TouchableOpacity
            onPress={onDelete}
            style={[
              styles.actionIcon,
              isRTL
                ? { left: 10, right: undefined }
                : { right: 10, left: undefined },
            ]}
          >
            <Ionicons name="trash-outline" size={24} color="#b80200" />
          </TouchableOpacity>
        ) : (
          !hideWishlistIcon &&
          onWishlist && (
            <TouchableOpacity
              onPress={onWishlist}
              style={[
                styles.actionIcon,
                isRTL
                  ? { left: 10, right: undefined }
                  : { right: 10, left: undefined },
              ]}
            >
              <Ionicons name="heart-outline" size={24} color="#b80200" />
            </TouchableOpacity>
          )
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    flexDirection: "column",
    borderRadius: 12,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
    backgroundColor: "#e0e0e0",
  },
  image: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    opacity: 0.5,
  },
  loadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  info: {
    padding: 12,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#313332",
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#b80200",
    marginBottom: 8,
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
    marginBottom: 12,
    gap: 15,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#555555",
  },
  viewDetailsButton: {
    backgroundColor: "#b80200",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  actionIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
