"use client";

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface ImageCarouselProps {
  images: string[];
  onWishlistPress: () => void;
  isWishlisted: boolean;
  isAuthenticated: boolean;
  onImagePress?: (imageUrl: string, index: number) => void;
}

export default function ImageCarousel({
  images,
  onWishlistPress,
  isWishlisted,
  isAuthenticated,
  onImagePress,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoadingStates, setImageLoadingStates] = useState<{
    [key: number]: boolean;
  }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>(
    {}
  );

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentIndex(roundIndex);
  };

  const handleImageLoadStart = (index: number) => {
    console.log(`Image ${index} started loading`);
    setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
    setImageErrors((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageLoadEnd = (index: number) => {
    console.log(`Image ${index} finished loading`);
    setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageError = (index: number, error: any) => {
    console.error(`Image ${index} failed to load:`, error);
    setImageErrors((prev) => ({ ...prev, [index]: true }));
    setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
  };

  const constructImageUrl = (imagePath: string): string => {
    const API_BASE_URL = "https://api.syriasouq.com";

    // If it's already a full URL, return as is
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // Construct the full URL
    const fullUrl = `${API_BASE_URL}/Uploads/cars/${imagePath}`;
    console.log(`Constructed image URL: ${fullUrl}`);
    return fullUrl;
  };

  const handleImagePress = (imageUrl: string, index: number) => {
    if (onImagePress) {
      onImagePress(imageUrl, index);
    }
  };

  const renderImage = ({ item, index }: { item: string; index: number }) => {
    const isLoading = imageLoadingStates[index];
    const hasError = imageErrors[index];
    const imageUrl = constructImageUrl(item);

    console.log(`Rendering image ${index}:`, {
      originalPath: item,
      constructedUrl: imageUrl,
      isLoading,
      hasError,
    });

    return (
      <TouchableOpacity
        style={styles.imageSlide}
        onPress={() => handleImagePress(imageUrl, index)}
        activeOpacity={0.9}
      >
        {!hasError ? (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={styles.carouselImage}
              resizeMode="cover"
              onLoadStart={() => handleImageLoadStart(index)}
              onLoadEnd={() => handleImageLoadEnd(index)}
              onError={(error) => handleImageError(index, error)}
            />
            {isLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="large" color="#b80200" />
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.errorImageContainer}>
            <Ionicons name="image-outline" size={60} color="#ccc" />
            <Text style={styles.errorText}>Image not available</Text>
            <Text style={styles.errorUrl}>{imageUrl}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const validImages = images?.filter(Boolean) || [];
  const displayImages = validImages.length > 0 ? validImages : ["placeholder"];

  console.log("ImageCarousel received images:", validImages);

  return (
    <View style={styles.container}>
      <FlatList
        data={displayImages}
        renderItem={renderImage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item, index) => `image-${index}-${item}`}
      />

      {/* Image Counter */}
      {validImages.length > 1 && (
        <View style={styles.imageCounter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {validImages.length}
          </Text>
        </View>
      )}

      {/* Wishlist Button */}
      <TouchableOpacity
        onPress={onWishlistPress}
        style={[
          styles.wishlistButton,
          isWishlisted && isAuthenticated && styles.wishlistButtonActive,
        ]}
      >
        <Ionicons
          name={isWishlisted && isAuthenticated ? "heart" : "heart-outline"}
          size={24}
          color={isWishlisted && isAuthenticated ? "#ffffff" : "#b80200"}
        />
      </TouchableOpacity>

      {/* Dots Indicator */}
      {validImages.length > 1 && (
        <View style={styles.dotsContainer}>
          {validImages.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentIndex && styles.activeDot]}
            />
          ))}
        </View>
      )}

      {/* Tap to view hint */}
      <View style={styles.tapHint}>
        <Text style={styles.tapHintText}>Tap to view full screen</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    height: 250,
  },
  imageSlide: {
    width,
    height: 250,
    position: "relative",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  errorImageContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  errorUrl: {
    marginTop: 5,
    fontSize: 10,
    color: "#ccc",
    textAlign: "center",
  },
  imageCounter: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  counterText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  wishlistButton: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 25,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  wishlistButtonActive: {
    backgroundColor: "#b80200",
  },
  dotsContainer: {
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeDot: {
    backgroundColor: "#ffffff",
    width: 20,
  },
  tapHint: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tapHintText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
