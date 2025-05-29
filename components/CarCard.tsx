import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Car } from "../types";

interface CarCardProps {
  car: Car;
  onWishlist: () => void;
  onPress: () => void; // Added onPress prop
}

export default function CarCard({ car, onWishlist, onPress }: CarCardProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // console.log("CarCard: Rendering car:", car._id, { image: car.images[0] });

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
            source={{
              uri: hasError
                ? "https://via.placeholder.com/150?text=Image+Failed"
                : car.images[0] ||
                  "https://via.placeholder.com/150?text=No+Image",
            }}
            style={[styles.image, isLoading && { opacity: 0 }]}
            placeholder={{ blurhash: "L5H2EC=PM+yV0g9mRj%M~qkRx%" }}
            cachePolicy="memory-disk"
            onError={(e) => {
              // console.log("CarCard: Image load error:", {
              //   carId: car._id,
              //   url: car.images[0],
              //   error: e.error,
              // });
              setHasError(true);
              setIsLoading(false);
            }}
            onLoad={() => {
              console.log("CarCard: Image loaded:", car._id, car.images[0]);
              setIsLoading(false);
            }}
            contentFit="cover"
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.price}>${car.priceUSD}</Text>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {`${car.make} ${car.model} ${car.year}`}
          </Text>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons
                name="location-sharp"
                size={16}
                color="#b80200"
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>{car.location}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons
                name="speedometer"
                size={16}
                color="#b80200"
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>{car.kilometer}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onPress} style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>{t("viewDetails")}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onWishlist} style={styles.wishlistIcon}>
          <Ionicons name="heart-outline" size={24} color="#b80200" />
        </TouchableOpacity>
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
  viewDetailsButton: {
    backgroundColor: "#b80200",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: "100%",
    height: 35,
    justifyContent: "center", // Added to vertically center the text
    alignItems: "center", // Added to horizontally center the text
  },
  viewDetailsText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  wishlistIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 10,
  },
});
