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
  car?: Car; // Allow undefined car
  onWishlist: () => void;
  onPress: () => void;
  hideWishlistIcon?: boolean;
}

export default function CarCard({
  car,
  onWishlist,
  onPress,
  hideWishlistIcon,
}: CarCardProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  if (!car) {
    console.log("CarCard: Car is undefined");
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{t("invalidCar")}</Text>
      </View>
    );
  }

  const imageUrl =
    car.images?.[0] || "https://via.placeholder.com/150?text=No+Image";
  console.log("CarCard: Image URL:", car._id, imageUrl);

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
            style={[styles.image, isLoading && { opacity: 0 }]}
            cachePolicy="none"
            onError={(e) => {
              console.log("CarCard: Image load error:", {
                carId: car._id,
                url: imageUrl,
                error: e.error,
              });
              setIsLoading(false);
            }}
            onLoad={() => {
              console.log("CarCard: Image loaded:", car._id, imageUrl);
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
        {!hideWishlistIcon && (
          <TouchableOpacity onPress={onWishlist} style={styles.wishlistIcon}>
            <Ionicons name="heart-outline" size={24} color="#b80200" />
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
  viewDetailsButton: {
    backgroundColor: "#b80200",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: "100%",
    height: 35,
    justifyContent: "center",
    alignItems: "center",
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

// interface CarCardProps {
//   car?: Car; // Allow undefined car
//   onWishlist: () => void;
//   onPress: () => void;
//   hideWishlistIcon?: boolean;
// }

// export default function CarCard({
//   car,
//   onWishlist,
//   onPress,
//   hideWishlistIcon,
// }: CarCardProps) {
//   const { t } = useTranslation();
//   const [isLoading, setIsLoading] = useState(true);

//   if (!car) {
//     console.log("CarCard: Car is undefined");
//     return (
//       <View style={styles.container}>
//         <Text style={styles.text}>{t("invalidCar")}</Text>
//       </View>
//     );
//   }

//   const imageUrl =
//     car.images?.[0] || "https://via.placeholder.com/400x200?text=No+Image"; // Larger placeholder
//   console.log("CarCard: Image URL:", car._id, imageUrl);

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
//               console.log("CarCard: Image load error:", {
//                 carId: car._id,
//                 url: imageUrl,
//                 error: e.error,
//               });
//               setIsLoading(false);
//             }}
//             onLoad={() => {
//               console.log("CarCard: Image loaded:", car._id, imageUrl);
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
//                 size={14} // Slightly smaller icon
//                 color="#757575" // Softer color
//                 style={styles.detailIcon}
//               />
//               <Text style={styles.detailText}>{car.location}</Text>
//             </View>
//             <View style={styles.detailItem}>
//               <Ionicons
//                 name="speedometer"
//                 size={14} // Slightly smaller icon
//                 color="#757575" // Softer color
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
//     marginHorizontal: 16,
//     // Softer shadow
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   card: {
//     flexDirection: "column", // Stack image and info vertically
//     borderRadius: 12,
//     overflow: "hidden",
//   },
//   imageContainer: {
//     width: "100%", // Image takes full width
//     height: 180, // Increased height for better visual impact
//     position: "relative",
//     backgroundColor: "#e0e0e0", // Placeholder background
//   },
//   image: {
//     width: "100%",
//     height: "100%",
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12, // Rounded top corners for the image
//   },
//   loadingIndicator: {
//     position: "absolute",
//     top: "50%",
//     left: "50%",
//     transform: [{ translateX: -15 }, { translateY: -15 }],
//   },
//   info: {
//     padding: 12, // Increased padding
//     justifyContent: "space-between",
//   },
//   title: {
//     fontSize: 20, // Larger title
//     fontWeight: "700", // Bolder title
//     color: "#313332",
//     marginBottom: 4,
//   },
//   price: {
//     fontSize: 18, // Slightly larger price
//     fontWeight: "700", // Bolder price
//     color: "#b80200",
//     marginBottom: 8, // More space below price
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
//     marginBottom: 12, // More space before the button
//     gap: 15, // Increased gap for better spacing
//   },
//   detailItem: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   detailIcon: {
//     marginRight: 6, // Slightly more space for the icon
//   },
//   detailText: {
//     fontSize: 14,
//     color: "#555555", // Softer color for details
//   },
//   viewDetailsButton: {
//     backgroundColor: "#b80200",
//     paddingVertical: 10, // Increased vertical padding
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     width: "100%",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   viewDetailsText: {
//     color: "#ffffff",
//     fontSize: 14, // Slightly larger text
//     fontWeight: "600",
//   },
//   wishlistIcon: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent background
//     borderRadius: 20,
//     padding: 8,
//     zIndex: 10,
//     shadowColor: "#000", // Added shadow for the icon
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 2,
//   },
// });
