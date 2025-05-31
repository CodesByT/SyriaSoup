import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Car } from "../types";

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
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  if (!car) {
    console.log("CarCardBlock: Car is undefined");
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{t("invalidCar")}</Text>
      </View>
    );
  }

  const imageUrl = car.images?.[0]
    ? `${car.images[0]}?t=${Date.now()}`
    : "https://via.placeholder.com/400x200?text=No+Image";
  const placeholderUrl = car.images?.[0]
    ? `${car.images[0]}?w=50&h=50`
    : "https://via.placeholder.com/50x50?text=Loading"; // Low-res placeholder
  console.log(
    "CarCardBlock: Image URL:",
    car._id,
    imageUrl,
    "Placeholder:",
    placeholderUrl
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} style={styles.card}>
        <View style={styles.imageContainer}>
          {isLoading && (
            <Image
              source={{ uri: placeholderUrl }}
              style={styles.placeholderImage}
              contentFit="cover"
              onLoad={() =>
                console.log("CarCardBlock: Placeholder loaded:", car._id)
              }
              onError={() =>
                console.log("CarCardBlock: Placeholder error:", car._id)
              }
            />
          )}
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            cachePolicy="none"
            transition={200} // Smooth transition
            onProgress={({ loaded, total }) => {
              console.log(
                "CarCardBlock: Image progress:",
                car._id,
                `${((loaded / total) * 100).toFixed(2)}%`
              );
            }}
            onError={(e) => {
              console.log("CarCardBlock: Image load error:", {
                carId: car._id,
                url: imageUrl,
                error: e.error,
              });
              setIsLoading(false);
            }}
            onLoad={() => {
              console.log("CarCardBlock: Image loaded:", car._id, imageUrl);
              setIsLoading(false);
            }}
            contentFit="cover"
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {`${car.make} ${car.model} ${car.year}`}
          </Text>
          <Text style={styles.price}>${car.priceUSD}</Text>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons
                name="location-sharp"
                size={14}
                color="#757575"
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>{car.location}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons
                name="speedometer"
                size={14}
                color="#757575"
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>{car.kilometer}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onPress} style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>{t("viewDetails")}</Text>
          </TouchableOpacity>
        </View>
        {showDeleteIcon && onDelete ? (
          <TouchableOpacity onPress={onDelete} style={styles.actionIcon}>
            <Ionicons name="trash-outline" size={24} color="#b80200" />
          </TouchableOpacity>
        ) : (
          !hideWishlistIcon &&
          onWishlist && (
            <TouchableOpacity onPress={onWishlist} style={styles.actionIcon}>
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
