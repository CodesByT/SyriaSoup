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
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // Key to force image reload

  const imageUrl =
    car?.images?.[0] || "https://via.placeholder.com/400x200?text=No+Image";

  const handleImageError = (e: any) => {
    console.log("CarCardGrid: Image load error:", {
      carId: car?._id,
      url: imageUrl,
      error: e.error,
    });
    setImageError(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    console.log("CarCardGrid: Retry initiated for:", car?._id);
    setIsLoading(true);
    setImageError(false);
    setReloadKey(reloadKey + 1); // Force reload by changing key
  };

  if (!car) {
    console.log("CarCardGrid: Car is undefined");
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{t("invalid_car")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
                {/* <Text style={styles.retryButtonText}>{t("retry_image")}</Text> */}
                <Ionicons name="refresh" size={25} color="grey" />
              </TouchableOpacity>
            </View>
          ) : (
            <Image
              key={`${imageUrl}-${reloadKey}`} // Force reload on retry
              source={{ uri: imageUrl }}
              style={[styles.image, isLoading && { opacity: 0 }]}
              cachePolicy="none"
              onError={handleImageError}
              onLoad={() => {
                console.log("CarCardGrid: Image loaded:", car._id, imageUrl);
                setIsLoading(false);
              }}
              contentFit="cover"
            />
          )}
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
            <Text style={styles.viewDetailsText}>{t("view_details")}</Text>
          </TouchableOpacity>
        </View>
        {!hideWishlistIcon && (
          <TouchableOpacity
            onPress={onWishlist}
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
    // height: 10,
    // width: 10,
    transform: [{ rotate: "30deg" }],
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
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
  viewDetailsButton: {
    backgroundColor: "#b80200",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
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
    opacity: 1,
  },
});
//--------------------2nd---------------------------
// import { Ionicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { Car } from "../types";

// interface CarCardGridProps {
//   car?: Car;
//   onWishlist: () => void;
//   onPress: () => void;
//   hideWishlistIcon?: boolean;
//   isWishlisted?: boolean;
//   wishlistId?: string;
//   isAuthenticated: boolean;
// }

// export default function CarCardGrid({
//   car,
//   onWishlist,
//   onPress,
//   hideWishlistIcon,
//   isWishlisted = false,
//   isAuthenticated,
// }: CarCardGridProps) {
//   const { t } = useTranslation();
//   const [isLoading, setIsLoading] = useState(true);

//   if (!car) {
//     console.log("CarCardGrid: Car is undefined");
//     return (
//       <View style={styles.container}>
//         <Text style={styles.text}>{t("invalid_car")}</Text>
//       </View>
//     );
//   }

//   const imageUrl =
//     car.images?.[0] || "https://via.placeholder.com/400x200?text=No+Image";
//   // console.log("CarCardGrid: Image URL:", car._id, imageUrl);

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity onPress={onPress} style={styles.card}>
//         <View style={styles.imageContainer}>
//           {isLoading && (
//             <ActivityIndicator
//               size="large"
//               color="#b80200"
//               style={styles.loadingIndicator}
//             />
//           )}
//           <Image
//             source={{ uri: imageUrl }}
//             style={[styles.image, isLoading && { opacity: 0 }]}
//             cachePolicy="none"
//             onError={(e) => {
//               console.log("CarCardGrid: Image load error:", {
//                 carId: car._id,
//                 url: imageUrl,
//                 error: e.error,
//               });
//               setIsLoading(false);
//             }}
//             onLoad={() => {
//               // console.log("CarCardGrid: Image loaded:", car._id, imageUrl);
//               setIsLoading(false);
//             }}
//             contentFit="cover"
//           />
//         </View>
//         <View style={styles.info}>
//           <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
//             {`${car.make} ${car.model} ${car.year}`}
//           </Text>
//           <Text style={styles.price}>${car.priceUSD}</Text>
//           <View style={styles.detailsRow}>
//             <View style={styles.detailItem}>
//               <Ionicons
//                 name="location-sharp"
//                 size={14}
//                 color="#757575"
//                 style={styles.detailIcon}
//               />
//               <Text style={styles.detailText}>{car.location}</Text>
//             </View>
//             <View style={styles.detailItem}>
//               <Ionicons
//                 name="speedometer"
//                 size={14}
//                 color="#757575"
//                 style={styles.detailIcon}
//               />
//               <Text style={styles.detailText}>{car.kilometer}</Text>
//             </View>
//           </View>
//           <TouchableOpacity onPress={onPress} style={styles.viewDetailsButton}>
//             <Text style={styles.viewDetailsText}>{t("view_details")}</Text>
//           </TouchableOpacity>
//         </View>
//         {!hideWishlistIcon && (
//           <TouchableOpacity
//             onPress={onWishlist}
//             style={[
//               styles.wishlistIcon,
//               isWishlisted && isAuthenticated && styles.wishlistIconActive,
//             ]}
//           >
//             <Ionicons
//               name={isWishlisted && isAuthenticated ? "heart" : "heart-outline"}
//               size={24}
//               color="#b80200"
//             />
//           </TouchableOpacity>
//         )}
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#ffffff",
//     borderRadius: 12,
//     marginVertical: 8,
//     marginHorizontal: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//     flex: 1,
//     maxWidth: "48%",
//   },
//   card: {
//     flexDirection: "column",
//     borderRadius: 12,
//     overflow: "hidden",
//     width: "100%",
//   },
//   imageContainer: {
//     width: "100%",
//     height: 120,
//     position: "relative",
//     backgroundColor: "#e0e0e0",
//   },
//   image: {
//     width: "100%",
//     height: "100%",
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12,
//     borderBottomLeftRadius: 0,
//   },
//   loadingIndicator: {
//     position: "absolute",
//     top: "50%",
//     left: "50%",
//     transform: [{ translateX: -15 }, { translateY: -15 }],
//   },
//   info: {
//     padding: 10,
//     justifyContent: "space-between",
//     flex: 1,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#314352",
//     marginBottom: 4,
//   },
//   price: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#b80200",
//     marginBottom: 8,
//   },
//   text: {
//     fontSize: 16,
//     color: "#314352",
//     textAlign: "center",
//     padding: 16,
//   },
//   detailsRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "flex-start",
//     marginBottom: 8,
//     gap: 10,
//     flexWrap: "wrap",
//   },
//   detailItem: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   detailIcon: {
//     marginRight: 4,
//   },
//   detailText: {
//     fontSize: 12,
//     color: "#555555",
//   },
//   viewDetailsButton: {
//     backgroundColor: "#b80200",
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     width: "100%",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: "auto",
//   },
//   viewDetailsText: {
//     color: "#ffffff",
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   wishlistIcon: {
//     position: "absolute",
//     top: 8,
//     right: 8,
//     backgroundColor: "rgba(255, 255, 255, 0.8)",
//     borderRadius: 20,
//     padding: 6,
//     zIndex: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   wishlistIconActive: {
//     opacity: 1,
//   },
// });
//----------------------------1st---------------------------
// import { Ionicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { Car } from "../types";

// interface CarCardGridProps {
//   // Renamed interface
//   car?: Car; // Allow undefined car
//   onWishlist: () => void;
//   onPress: () => void;
//   hideWishlistIcon?: boolean;
// }

// export default function CarCardGrid({
//   // Renamed component
//   car,
//   onWishlist,
//   onPress,
//   hideWishlistIcon,
// }: CarCardGridProps) {
//   // Renamed interface usage
//   const { t } = useTranslation();
//   const [isLoading, setIsLoading] = useState(true);

//   if (!car) {
//     console.log("CarCardGrid: Car is undefined"); // Renamed log
//     return (
//       <View style={styles.container}>
//         <Text style={styles.text}>{t("invalidCar")}</Text>
//       </View>
//     );
//   }

//   const imageUrl =
//     car.images?.[0] || "https://via.placeholder.com/400x200?text=No+Image";
//   console.log("CarCardGrid: Image URL:", car._id, imageUrl); // Renamed log

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity onPress={onPress} style={styles.card}>
//         <View style={styles.imageContainer}>
//           {isLoading && (
//             <ActivityIndicator
//               size="large"
//               color="#b80200"
//               style={styles.loadingIndicator}
//             />
//           )}
//           <Image
//             source={{ uri: imageUrl }}
//             style={[styles.image, isLoading && { opacity: 0 }]}
//             cachePolicy="none"
//             onError={(e) => {
//               console.log("CarCardGrid: Image load error:", {
//                 // Renamed log
//                 carId: car._id,
//                 url: imageUrl,
//                 error: e.error,
//               });
//               setIsLoading(false);
//             }}
//             onLoad={() => {
//               console.log("CarCardGrid: Image loaded:", car._id, imageUrl); // Renamed log
//               setIsLoading(false);
//             }}
//             contentFit="cover"
//           />
//         </View>
//         <View style={styles.info}>
//           <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
//             {`${car.make} ${car.model} ${car.year}`}
//           </Text>
//           <Text style={styles.price}>${car.priceUSD}</Text>
//           <View style={styles.detailsRow}>
//             <View style={styles.detailItem}>
//               <Ionicons
//                 name="location-sharp"
//                 size={14}
//                 color="#757575"
//                 style={styles.detailIcon}
//               />
//               <Text style={styles.detailText}>{car.location}</Text>
//             </View>
//             <View style={styles.detailItem}>
//               <Ionicons
//                 name="speedometer"
//                 size={14}
//                 color="#757575"
//                 style={styles.detailIcon}
//               />
//               <Text style={styles.detailText}>{car.kilometer}</Text>
//             </View>
//           </View>
//           <TouchableOpacity onPress={onPress} style={styles.viewDetailsButton}>
//             <Text style={styles.viewDetailsText}>{t("viewDetails")}</Text>
//           </TouchableOpacity>
//         </View>
//         {!hideWishlistIcon && (
//           <TouchableOpacity onPress={onWishlist} style={styles.wishlistIcon}>
//             <Ionicons name="heart-outline" size={24} color="#b80200" />
//           </TouchableOpacity>
//         )}
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#ffffff",
//     borderRadius: 12,
//     marginVertical: 8,
//     marginHorizontal: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//     flex: 1,
//     maxWidth: "48%",
//   },
//   card: {
//     flexDirection: "column",
//     borderRadius: 12,
//     overflow: "hidden",
//     width: "100%",
//   },
//   imageContainer: {
//     width: "100%",
//     height: 120,
//     position: "relative",
//     backgroundColor: "#e0e0e0",
//   },
//   image: {
//     width: "100%",
//     height: "100%",
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12,
//     borderBottomLeftRadius: 0,
//   },
//   loadingIndicator: {
//     position: "absolute",
//     top: "50%",
//     left: "50%",
//     transform: [{ translateX: -15 }, { translateY: -15 }],
//   },
//   info: {
//     padding: 10,
//     justifyContent: "space-between",
//     flex: 1,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#313332",
//     marginBottom: 4,
//   },
//   price: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#b80200",
//     marginBottom: 8,
//   },
//   text: {
//     fontSize: 16,
//     color: "#313332",
//     textAlign: "center",
//     padding: 16,
//   },
//   detailsRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "flex-start",
//     marginBottom: 8,
//     gap: 10,
//     flexWrap: "wrap",
//   },
//   detailItem: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   detailIcon: {
//     marginRight: 4,
//   },
//   detailText: {
//     fontSize: 12,
//     color: "#555555",
//   },
//   viewDetailsButton: {
//     backgroundColor: "#b80200",
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     width: "100%",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: "auto",
//   },
//   viewDetailsText: {
//     color: "#ffffff",
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   wishlistIcon: {
//     position: "absolute",
//     top: 8,
//     right: 8,
//     backgroundColor: "rgba(255, 255, 255, 0.8)",
//     borderRadius: 20,
//     padding: 6,
//     zIndex: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 2,
//   },
// });
