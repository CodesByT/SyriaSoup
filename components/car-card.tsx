"use client";

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Car } from "../types";
import { useRTL } from "../hooks/useRTL";
import {
  translateMake,
  translateModel,
  translateLocation,
  translateCarField,
} from "../utils/translation-helpers";

const { width } = Dimensions.get("window");

interface CarCardProps {
  car: Car;
  onPress: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function CarCard({
  car,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}: CarCardProps) {
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const [imageError, setImageError] = useState(false);
  const isArabic = i18n.language === "ar";

  // Get translated values
  const make = translateMake(car.make, isArabic);
  const model = translateModel(car.model, car.make, isArabic);
  const location = translateLocation(car.location, isArabic);
  const transmission = translateCarField(
    "transmission",
    car.transmission,
    isArabic
  );
  const fuelType = translateCarField("fuelType", car.fuelType, isArabic);
  const status = translateCarField("status", car.status, isArabic);

  const formatPrice = (price: string | undefined): string => {
    if (!price) return t("priceOnRequest");
    return `$${price.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#28a745";
      case "pending":
        return "#ffc107";
      case "sold":
        return "#6c757d";
      case "rejected":
        return "#dc3545";
      default:
        return "#28a745";
    }
  };

  const getStatusText = (status: string) => {
    if (isArabic) {
      switch (status) {
        case "approved":
          return "موافق عليه";
        case "pending":
          return "قيد الانتظار";
        case "sold":
          return "مباع";
        case "rejected":
          return "مرفوض";
        default:
          return "نشط";
      }
    }

    switch (status) {
      case "approved":
        return t("approved");
      case "pending":
        return t("pending");
      case "sold":
        return t("sold");
      case "rejected":
        return t("rejected");
      default:
        return t("active");
    }
  };

  // Adjust border radius based on RTL
  const getImageStyle = () => {
    if (isRTL) {
      return {
        ...styles.image,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      };
    }
    return {
      ...styles.image,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    };
  };

  const getPlaceholderStyle = () => {
    if (isRTL) {
      return {
        ...styles.placeholderImage,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      };
    }
    return {
      ...styles.placeholderImage,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    };
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.card, { flexDirection: isRTL ? "row-reverse" : "row" }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {car.images && car.images.length > 0 && !imageError ? (
            <Image
              source={{ uri: car.images[0] }}
              style={getImageStyle()}
              contentFit="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={getPlaceholderStyle()}>
              <Ionicons name="car-outline" size={40} color="#999" />
            </View>
          )}

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(car.status || "approved") },
              isRTL
                ? { right: 8, left: undefined }
                : { left: 8, right: undefined },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {getStatusText(car.status || "approved")}
            </Text>
          </View>

          {/* Image Count */}
          {car.images && car.images.length > 1 && (
            <View
              style={[
                styles.imageCount,
                isRTL
                  ? { left: 8, right: undefined }
                  : { right: 8, left: undefined },
              ]}
            >
              <Ionicons name="images-outline" size={12} color="#ffffff" />
              <Text style={styles.imageCountText}>{car.images.length}</Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Title */}
          <Text
            style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}
            numberOfLines={1}
          >
            {car.year} {make} {model}
          </Text>

          {/* Price */}
          <Text style={[styles.price, { textAlign: isRTL ? "right" : "left" }]}>
            {formatPrice(car.priceUSD)}
          </Text>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View
              style={[
                styles.detailItem,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Ionicons name="speedometer-outline" size={14} color="#666" />
              <Text
                style={[
                  styles.detailText,
                  {
                    textAlign: isRTL ? "right" : "left",
                    marginLeft: isRTL ? 0 : 4,
                    marginRight: isRTL ? 4 : 0,
                  },
                ]}
              >
                {car.kilometer
                  ? `${car.kilometer.toLocaleString()} km`
                  : t("notSpecified")}
              </Text>
            </View>

            <View
              style={[
                styles.detailItem,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text
                style={[
                  styles.detailText,
                  {
                    textAlign: isRTL ? "right" : "left",
                    marginLeft: isRTL ? 0 : 4,
                    marginRight: isRTL ? 4 : 0,
                  },
                ]}
              >
                {location || t("notSpecified")}
              </Text>
            </View>
          </View>

          {/* Additional Info */}
          <View style={styles.additionalInfo}>
            <View
              style={[
                styles.infoItem,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Text
                style={[
                  styles.infoLabel,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("transmission")}:
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    textAlign: isRTL ? "right" : "left",
                    marginLeft: isRTL ? 0 : 4,
                    marginRight: isRTL ? 4 : 0,
                  },
                ]}
              >
                {transmission || t("notSpecified")}
              </Text>
            </View>
            <View
              style={[
                styles.infoItem,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Text
                style={[
                  styles.infoLabel,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("fuelType")}:
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    textAlign: isRTL ? "right" : "left",
                    marginLeft: isRTL ? 0 : 4,
                    marginRight: isRTL ? 4 : 0,
                  },
                ]}
              >
                {fuelType || t("notSpecified")}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      {showActions && (
        <View
          style={[
            styles.actionContainer,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.editButton,
              isRTL
                ? { borderBottomRightRadius: 12, borderBottomLeftRadius: 0 }
                : { borderBottomLeftRadius: 12, borderBottomRightRadius: 0 },
            ]}
            onPress={onEdit}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color="#ffffff" />
            <Text
              style={[
                styles.actionButtonText,
                { marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 },
              ]}
            >
              {t("edit")}
            </Text>
          </TouchableOpacity>

          {onDelete && (
            <TouchableOpacity
              style={[
                styles.deleteButton,
                isRTL
                  ? { borderBottomLeftRadius: 12, borderBottomRightRadius: 0 }
                  : { borderBottomRightRadius: 12, borderBottomLeftRadius: 0 },
              ]}
              onPress={onDelete}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#ffffff" />
              <Text
                style={[
                  styles.actionButtonText,
                  { marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 },
                ]}
              >
                {t("delete")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Remove overflow: "hidden" to show action buttons
  },
  card: {
    flexDirection: "row",
    minHeight: 120, // Set minimum height instead of fixed height
  },
  imageContainer: {
    position: "relative",
    width: 120,
    height: 120, // Fixed height for image container
  },
  image: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  imageCount: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  imageCountText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
    minHeight: 120, // Ensure content has minimum height
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B80200",
    marginBottom: 8,
  },
  detailsContainer: {
    gap: 4,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  additionalInfo: {
    gap: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
  },
  actionContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#ffffff", // Ensure background color
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14, // Increased padding for better visibility
    backgroundColor: "#B80200",
    gap: 6,
    borderBottomLeftRadius: 12,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14, // Increased padding for better visibility
    backgroundColor: "#dc3545",
    gap: 6,
    borderBottomRightRadius: 12,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 13, // Slightly larger font
    fontWeight: "600",
  },
});

// "use client";

// import { Ionicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
// import { useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   Dimensions,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import type { Car } from "../types";

// const { width } = Dimensions.get("window");

// interface CarCardProps {
//   car: Car;
//   onPress: () => void;
//   onEdit: () => void;
//   onDelete?: () => void;
//   showActions?: boolean;
// }

// export default function CarCard({
//   car,
//   onPress,
//   onEdit,
//   onDelete,
//   showActions = true,
// }: CarCardProps) {
//   const { t } = useTranslation();
//   const [imageError, setImageError] = useState(false);

//   const formatPrice = (price: string | undefined): string => {
//     if (!price) return t("priceOnRequest");
//     return `$${price.toLocaleString()}`;
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "approved":
//         return "#28a745";
//       case "pending":
//         return "#ffc107";
//       case "sold":
//         return "#6c757d";
//       case "rejected":
//         return "#dc3545";
//       default:
//         return "#28a745";
//     }
//   };

//   const getStatusText = (status: string) => {
//     switch (status) {
//       case "approved":
//         return t("approved");
//       case "pending":
//         return t("pending");
//       case "sold":
//         return t("sold");
//       case "rejected":
//         return t("rejected");
//       default:
//         return t("active");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity
//         style={styles.card}
//         onPress={onPress}
//         activeOpacity={0.8}
//       >
//         {/* Image Section */}
//         <View style={styles.imageContainer}>
//           {car.images && car.images.length > 0 && !imageError ? (
//             <Image
//               source={{ uri: car.images[0] }}
//               style={styles.image}
//               contentFit="cover"
//               onError={() => setImageError(true)}
//             />
//           ) : (
//             <View style={styles.placeholderImage}>
//               <Ionicons name="car-outline" size={40} color="#999" />
//             </View>
//           )}

//           {/* Status Badge */}
//           <View
//             style={[
//               styles.statusBadge,
//               { backgroundColor: getStatusColor(car.status || "approved") },
//             ]}
//           >
//             <Text style={styles.statusText}>
//               {getStatusText(car.status || "approved")}
//             </Text>
//           </View>

//           {/* Image Count */}
//           {car.images && car.images.length > 1 && (
//             <View style={styles.imageCount}>
//               <Ionicons name="images-outline" size={12} color="#ffffff" />
//               <Text style={styles.imageCountText}>{car.images.length}</Text>
//             </View>
//           )}
//         </View>

//         {/* Content Section */}
//         <View style={styles.content}>
//           {/* Title */}
//           <Text style={styles.title} numberOfLines={1}>
//             {car.year} {car.make} {car.model}
//           </Text>

//           {/* Price */}
//           <Text style={styles.price}>{formatPrice(car.priceUSD)}</Text>

//           {/* Details */}
//           <View style={styles.detailsContainer}>
//             <View style={styles.detailItem}>
//               <Ionicons name="speedometer-outline" size={14} color="#666" />
//               <Text style={styles.detailText}>
//                 {car.kilometer
//                   ? `${car.kilometer.toLocaleString()} km`
//                   : t("notSpecified")}
//               </Text>
//             </View>

//             <View style={styles.detailItem}>
//               <Ionicons name="location-outline" size={14} color="#666" />
//               <Text style={styles.detailText}>
//                 {car.location || t("notSpecified")}
//               </Text>
//             </View>
//           </View>

//           {/* Additional Info */}
//           <View style={styles.additionalInfo}>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>{t("transmission")}:</Text>
//               <Text style={styles.infoValue}>
//                 {car.transmission || t("notSpecified")}
//               </Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>{t("fuelType")}:</Text>
//               <Text style={styles.infoValue}>
//                 {car.fuelType || t("notSpecified")}
//               </Text>
//             </View>
//           </View>
//         </View>
//       </TouchableOpacity>

//       {/* Action Buttons */}
//       {showActions && (
//         <View style={styles.actionContainer}>
//           <TouchableOpacity
//             style={styles.editButton}
//             onPress={onEdit}
//             activeOpacity={0.8}
//           >
//             <Ionicons name="create-outline" size={16} color="#ffffff" />
//             <Text style={styles.actionButtonText}>{t("edit")}</Text>
//           </TouchableOpacity>

//           {onDelete && (
//             <TouchableOpacity
//               style={styles.deleteButton}
//               onPress={onDelete}
//               activeOpacity={0.8}
//             >
//               <Ionicons name="trash-outline" size={16} color="#ffffff" />
//               <Text style={styles.actionButtonText}>{t("delete")}</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     marginBottom: 16,
//     backgroundColor: "#ffffff",
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     // Remove overflow: "hidden" to show action buttons
//   },
//   card: {
//     flexDirection: "row",
//     minHeight: 120, // Set minimum height instead of fixed height
//   },
//   imageContainer: {
//     position: "relative",
//     width: 120,
//     height: 120, // Fixed height for image container
//   },
//   image: {
//     width: "100%",
//     height: "100%",
//     borderTopLeftRadius: 12,
//     borderBottomLeftRadius: 12,
//   },
//   placeholderImage: {
//     width: "100%",
//     height: "100%",
//     backgroundColor: "#f0f0f0",
//     justifyContent: "center",
//     alignItems: "center",
//     borderTopLeftRadius: 12,
//     borderBottomLeftRadius: 12,
//   },
//   statusBadge: {
//     position: "absolute",
//     top: 8,
//     left: 8,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   statusText: {
//     fontSize: 10,
//     color: "#ffffff",
//     fontWeight: "600",
//     textTransform: "uppercase",
//   },
//   imageCount: {
//     position: "absolute",
//     bottom: 8,
//     right: 8,
//     backgroundColor: "rgba(0,0,0,0.7)",
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//     gap: 2,
//   },
//   imageCountText: {
//     fontSize: 10,
//     color: "#ffffff",
//     fontWeight: "600",
//   },
//   content: {
//     flex: 1,
//     padding: 12,
//     justifyContent: "space-between",
//     minHeight: 120, // Ensure content has minimum height
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#1a1a1a",
//     marginBottom: 4,
//   },
//   price: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#B80200",
//     marginBottom: 8,
//   },
//   detailsContainer: {
//     gap: 4,
//     marginBottom: 8,
//   },
//   detailItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   detailText: {
//     fontSize: 12,
//     color: "#666",
//     fontWeight: "500",
//   },
//   additionalInfo: {
//     gap: 2,
//   },
//   infoItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   infoLabel: {
//     fontSize: 11,
//     color: "#999",
//     fontWeight: "500",
//   },
//   infoValue: {
//     fontSize: 11,
//     color: "#666",
//     fontWeight: "600",
//   },
//   actionContainer: {
//     flexDirection: "row",
//     borderTopWidth: 1,
//     borderTopColor: "#f0f0f0",
//     backgroundColor: "#ffffff", // Ensure background color
//     borderBottomLeftRadius: 12,
//     borderBottomRightRadius: 12,
//   },
//   editButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 14, // Increased padding for better visibility
//     backgroundColor: "#B80200",
//     gap: 6,
//     borderBottomLeftRadius: 12,
//   },
//   deleteButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 14, // Increased padding for better visibility
//     backgroundColor: "#dc3545",
//     gap: 6,
//     borderBottomRightRadius: 12,
//   },
//   actionButtonText: {
//     color: "#ffffff",
//     fontSize: 13, // Slightly larger font
//     fontWeight: "600",
//   },
// });
