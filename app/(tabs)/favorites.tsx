import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Snackbar from "react-native-snackbar"; // This is the Snackbar library you're using
import CarCardBlock from "../../components/CarCardBlock";
import { useAuth } from "../../contexts/AuthContext";
import { Wishlist } from "../../types";
import { getWishlistByUserId, removeFromWishlist } from "../../utils/api";

export default function Favorites() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const router = useRouter();
  const isFetching = useRef(false);

  const fetchWishlist = useCallback(async () => {
    if (!user?._id || isFetching.current) {
      console.log("Favorites: Skipping fetch, already fetching or no user ID");
      return;
    }
    isFetching.current = true;
    try {
      setLoading(true);
      const response = await getWishlistByUserId(user._id);
      const data = response.data?.data || [];
      const validWishlists = data.filter(
        (item: Wishlist) => item.car && item.car._id
      );
      console.log(
        "Favorites: Wishlist data:",
        JSON.stringify(validWishlists, null, 2)
      );
      setWishlists(validWishlists);
      setError(null);
    } catch (error: any) {
      console.log(
        "Favorites: Fetch error:",
        error.response?.status,
        error.response?.data
      );
      if (error.response?.status === 404) {
        setWishlists([]);
        setError(null);
      } else {
        setError(error.message || t("failedToFetchWishlist"));
        setWishlists([]);
      }
    } finally {
      setLoading(false);
      setIsReloading(false);
      isFetching.current = false;
    }
  }, [user, t]);

  useEffect(() => {
    console.log("Favorites: useEffect triggered");
    if (isAuthenticated && user?._id) {
      fetchWishlist();
    } else {
      setLoading(false);
      setError(t("pleaseLogin"));
    }
  }, [isAuthenticated, user]);

  const handleReload = () => {
    if (!isFetching.current) {
      setIsReloading(true);
      fetchWishlist();
    }
  };

  const handleRemoveFromWishlist = (wishlistId: string) => {
    Alert.alert(
      t("confirmRemoveTitle"),
      t("confirmRemoveMessage"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromWishlist(wishlistId);
              const updatedWishlists = wishlists.filter(
                (item) => item._id !== wishlistId
              );
              setWishlists(updatedWishlists);
              Snackbar.show({
                text: t("removedFromWishlist"),
                duration: 1500,
                action: {
                  text: t("undo"),
                  onPress: () => {
                    // Optionally handle undo action
                    setWishlists((prev) => [
                      ...prev,
                      wishlists.find((item) => item._id === wishlistId)!,
                    ]);
                  },
                },
                backgroundColor: "#B80200",
                textColor: "#FFFFFF",
              });
              if (updatedWishlists.length === 0) {
                setWishlists([]);
                setError(null);
              } else {
                fetchWishlist();
              }
            } catch (error: any) {
              console.error("Favorites: Error removing from wishlist:", error);
              Alert.alert(t("error"), t("failedToRemoveWishlist"));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  console.log(
    "Favorites: Rendering, loading:",
    loading,
    "wishlists:",
    wishlists.length
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{t("pleaseLogin")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t("favorites")}</Text>
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={handleReload}
          disabled={isReloading}
          accessible
          accessibilityLabel={t("reloadWishlist")}
        >
          {isReloading ? (
            <ActivityIndicator size="small" color="#b80200" />
          ) : (
            <Ionicons name="refresh-outline" size={24} color="#b80200" />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.emptyBox}></View>
      {loading && !wishlists.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b80200" />
          <Text style={styles.text}>{t("loading")}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.text}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchWishlist}>
            <Text style={styles.retryButtonText}>{t("retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : wishlists.length === 0 ? (
        <Text style={styles.text}>{t("noWishlists")}</Text>
      ) : (
        <FlatList
          data={wishlists}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <CarCardBlock
              car={item.car}
              onPress={() => router.push(`/car-details?carId=${item.car._id}`)}
              hideWishlistIcon={true}
              showDeleteIcon={true}
              onDelete={() => handleRemoveFromWishlist(item._id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#313332",
    padding: 20,
    paddingTop: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  reloadButton: {
    padding: 8,
  },
  text: {
    fontSize: 16,
    color: "#313332",
    textAlign: "center",
    marginTop: 20,
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
  retryButton: {
    backgroundColor: "#b80200",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  emptyBox: {
    height: 20,
  },
});
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import CarCard from "../../components/CarCard";
// import { useAuth } from "../../contexts/AuthContext";
// import { Wishlist } from "../../types";
// import { getWishlistByUserId, removeFromWishlist } from "../../utils/api";

// export default function Favorites() {
//   const { t } = useTranslation();
//   const { user, isAuthenticated } = useAuth();
//   const [wishlists, setWishlists] = useState<Wishlist[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isReloading, setIsReloading] = useState(false);
//   const router = useRouter();
//   const isFetching = useRef(false);

//   const fetchWishlist = useCallback(async () => {
//     if (!user?._id || isFetching.current) {
//       console.log("Favorites: Skipping fetch, already fetching or no user ID");
//       return;
//     }
//     isFetching.current = true;
//     try {
//       setLoading(true);
//       const response = await getWishlistByUserId(user._id);
//       const data = response.data?.data || [];
//       const validWishlists = data.filter(
//         (item: Wishlist) => item.car && item.car._id
//       );
//       console.log(
//         "Favorites: Wishlist data:",
//         JSON.stringify(validWishlists, null, 2)
//       );
//       setWishlists(validWishlists);
//       setError(null);
//     } catch (error: any) {
//       console.error("Favorites: Error fetching wishlist:", error);
//       setError(error.message || t("failedToFetchWishlist"));
//       setWishlists([]);
//     } finally {
//       setLoading(false);
//       setIsReloading(false);
//       isFetching.current = false;
//     }
//   }, [user, t]);

//   useEffect(() => {
//     console.log("Favorites: useEffect triggered");
//     if (isAuthenticated && user?._id) {
//       fetchWishlist();
//     } else {
//       setLoading(false);
//       setError(t("pleaseLogin"));
//     }
//   }, [isAuthenticated, user]);

//   const handleReload = () => {
//     if (!isFetching.current) {
//       setIsReloading(true);
//       fetchWishlist();
//     }
//   };

//   const handleRemoveFromWishlist = (wishlistId: string) => {
//     Alert.alert(
//       t("confirmRemoveTitle"),
//       t("confirmRemoveMessage"),
//       [
//         { text: t("cancel"), style: "cancel" },
//         {
//           text: t("remove"),
//           style: "destructive",
//           onPress: async () => {
//             try {
//               await removeFromWishlist(wishlistId);
//               setWishlists(wishlists.filter((item) => item._id !== wishlistId));
//               Alert.alert(t("success"), t("removedFromWishlist"));
//               fetchWishlist();
//             } catch (error: any) {
//               console.error("Favorites: Error removing from wishlist:", error);
//               Alert.alert(t("error"), t("failedToRemoveWishlist"));
//             }
//           },
//         },
//       ],
//       { cancelable: true }
//     );
//   };

//   const handleWishlistToggle = (carId: string) => {
//     const wishlistItem = wishlists.find((item) => item.car._id === carId);
//     if (wishlistItem) {
//       handleRemoveFromWishlist(wishlistItem._id);
//     }
//   };

//   console.log(
//     "Favorites: Rendering, loading:",
//     loading,
//     "wishlists:",
//     wishlists.length
//   );

//   if (!isAuthenticated) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.text}>{t("pleaseLogin")}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerText}>{t("Favorites")}</Text>
//         <TouchableOpacity
//           style={styles.reloadButton}
//           onPress={handleReload}
//           disabled={isReloading}
//           accessible
//           accessibilityLabel={t("reloadWishlist")}
//         >
//           {isReloading ? (
//             <ActivityIndicator size="small" color="#b80200" />
//           ) : (
//             <Ionicons name="refresh-outline" size={24} color="#b80200" />
//           )}
//         </TouchableOpacity>
//       </View>
//       <View style={styles.emptyBox}></View>
//       {loading && !wishlists.length ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#b80200" />
//           <Text style={styles.text}>{t("loading")}</Text>
//         </View>
//       ) : error ? (
//         <View style={styles.errorContainer}>
//           <Text style={styles.text}>{error}</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={fetchWishlist}>
//             <Text style={styles.retryButtonText}>{t("retry")}</Text>
//           </TouchableOpacity>
//         </View>
//       ) : wishlists.length === 0 ? (
//         <Text style={styles.text}>{t("noWishlists")}</Text>
//       ) : (
//         <FlatList
//           data={wishlists}
//           keyExtractor={(item) => item._id}
//           renderItem={({ item }) => (
//             <View style={styles.cardContainer}>
//               <CarCard
//                 car={item.car}
//                 onPress={() =>
//                   router.push(`/car-details?carId=${item.car._id}`)
//                 }
//                 onWishlist={() => handleWishlistToggle(item.car._id)}
//                 hideWishlistIcon={true}
//               />
//               <TouchableOpacity
//                 style={styles.removeButton}
//                 onPress={() => handleRemoveFromWishlist(item._id)}
//               >
//                 <Ionicons name="trash-outline" size={20} color="#b80200" />
//               </TouchableOpacity>
//             </View>
//           )}
//           contentContainerStyle={styles.listContent}
//           initialNumToRender={8}
//           maxToRenderPerBatch={4}
//           windowSize={5}
//           removeClippedSubviews={true}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#ffffff",
//   },
//   header: {
//     backgroundColor: "#313332",
//     padding: 20,
//     paddingTop: 40,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   headerText: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#ffffff",
//   },
//   reloadButton: {
//     padding: 8,
//   },
//   text: {
//     fontSize: 16,
//     color: "#313332",
//     textAlign: "center",
//     marginTop: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   retryButton: {
//     backgroundColor: "#b80200",
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     marginTop: 10,
//   },
//   retryButtonText: {
//     color: "#ffffff",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   listContent: {
//     paddingBottom: 20,
//     paddingHorizontal: 0,
//   },
//   cardContainer: {
//     position: "relative",
//   },
//   removeButton: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     backgroundColor: "#ffffff",
//     borderRadius: 20,
//     padding: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   emptyBox: {
//     height: 20,
//   },
// });
