"use client";

import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showToastable } from "react-native-toastable";
import CarCardBlock from "../../components/CarCardBlock";
import { useAuth } from "../../contexts/AuthContext";
import type { Wishlist } from "../../types";
import { getWishlistByUserId, removeFromWishlist } from "../../utils/api";

export default function Favorites() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const isFetching = useRef(false);
  const insets = useSafeAreaInsets();

  const fetchWishlist = useCallback(async () => {
    if (!user?._id || isFetching.current) {
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
      setWishlists(validWishlists);
      setError(null);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setWishlists([]);
        setError(null);
      } else {
        setError(error.message || t("failedToFetchWishlist"));
        setWishlists([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetching.current = false;
    }
  }, [user?._id, t]);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      fetchWishlist();
    } else {
      setLoading(false);
      setError(t("pleaseLogin"));
    }
  }, [isAuthenticated, user?._id, fetchWishlist, t]); // Added fetchWishlist and t to dependencies

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchWishlist();
    } catch (error: any) {
      showToastable({
        message: t("failed_to_refresh"),
        status: "warning",
        duration: 2000,
      });
    }
  }, [fetchWishlist, t]);

  // Direct removal without confirmation modal
  const handleRemoveFromWishlist = useCallback(
    async (wishlistId: string) => {
      try {
        await removeFromWishlist(wishlistId);
        const updatedWishlists = wishlists.filter(
          (item) => item._id !== wishlistId
        );
        setWishlists(updatedWishlists);

        showToastable({
          message: t("removedFromWishlist"),
          status: "success",
          duration: 2000,
        });

        // If all items are removed, explicitly set error to null (no more "noWishlists" error)
        if (updatedWishlists.length === 0) {
          setError(null);
        } else {
          // Re-fetch if there are still items, to ensure list consistency (optional, but good practice)
          fetchWishlist();
        }
      } catch (error: any) {
        showToastable({
          message: t("failedToRemoveWishlist"),
          status: "warning",
          duration: 2000,
        });
      }
    },
    [wishlists, fetchWishlist, t]
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("favorites")}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.text}>{t("pleaseLogin")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("favorites")}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && !wishlists.length ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#b80200" />
            <Text style={styles.text}>{t("loading")}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.text}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchWishlist}
            >
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
                onPress={() =>
                  router.push(`/car-details?carId=${item.car._id}`)
                }
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#b80200"]}
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#323332",
  },
  header: {
    backgroundColor: "#323332",
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    paddingVertical: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    backgroundColor: "#ffffff",
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
});

// import { useRouter } from "expo-router";
// import { useCallback, useEffect, useRef, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   FlatList,
//   Modal,
//   RefreshControl,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { showToastable } from "react-native-toastable";
// import CarCardBlock from "../../components/CarCardBlock";
// import { useAuth } from "../../contexts/AuthContext";
// import type { Wishlist } from "../../types";
// import { getWishlistByUserId, removeFromWishlist } from "../../utils/api";

// export default function Favorites() {
//   const { t } = useTranslation();
//   const { user, isAuthenticated } = useAuth();
//   const [wishlists, setWishlists] = useState<Wishlist[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [refreshing, setRefreshing] = useState(false);
//   const router = useRouter();
//   const isFetching = useRef(false);
//   const insets = useSafeAreaInsets();

//   // New state for the custom confirmation modal
//   const [confirmationModalVisible, setConfirmationModalVisible] =
//     useState(false);
//   const [modalContent, setModalContent] = useState({
//     title: "",
//     message: "",
//     onConfirm: () => {},
//   });

//   const fetchWishlist = useCallback(async () => {
//     if (!user?._id || isFetching.current) {
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
//       setWishlists(validWishlists);
//       setError(null);
//     } catch (error: any) {
//       if (error.response?.status === 404) {
//         setWishlists([]);
//         setError(null);
//       } else {
//         setError(error.message || t("failedToFetchWishlist"));
//         setWishlists([]);
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//       isFetching.current = false;
//     }
//   }, [user?._id, t]); // Remove fetchWishlist from dependencies to prevent infinite loop

//   useEffect(() => {
//     if (isAuthenticated && user?._id) {
//       fetchWishlist();
//     } else {
//       setLoading(false);
//       setError(t("pleaseLogin"));
//     }
//   }, [isAuthenticated, user?._id]); // Removed fetchWishlist from dependencies

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       await fetchWishlist();
//     } catch (error: any) {
//       // console.error("Favorites: Error during refresh:", error);

//       showToastable({
//         message: t("failed_to_refresh"),
//         status: "warning",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
//       });
//     }
//   }, [fetchWishlist, t]);

//   // Helper function to show the custom modal
//   const showConfirmationModal = (
//     title: string,
//     message: string,
//     onConfirm: () => void
//   ) => {
//     setModalContent({ title, message, onConfirm });
//     setConfirmationModalVisible(true);
//   };

//   const handleRemoveFromWishlist = (wishlistId: string) => {
//     showConfirmationModal(
//       t("confirmRemoveTitle"),
//       t("confirmRemoveMessage"),
//       async () => {
//         // This is the original onPress logic from the Alert.alert
//         try {
//           await removeFromWishlist(wishlistId);
//           const updatedWishlists = wishlists.filter(
//             (item) => item._id !== wishlistId
//           );
//           setWishlists(updatedWishlists);

//           showToastable({
//             message: t("removedFromWishlist"),
//             status: "success",
//             duration: 2000, // Matches Snackbar.LENGTH_LONG
//           });
//           if (updatedWishlists.length === 0) {
//             setWishlists([]);
//             setError(null);
//           } else {
//             fetchWishlist();
//           }
//         } catch (error: any) {
//           showToastable({
//             message: t("failedToRemoveWishlist"),
//             status: "warning",
//             duration: 2000, // Matches Snackbar.LENGTH_LONG
//           });
//         } finally {
//           setConfirmationModalVisible(false); // Close modal after action
//         }
//       }
//     );
//   };

//   if (!isAuthenticated) {
//     return (
//       <View style={[styles.container, { paddingTop: insets.top }]}>
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>{t("favorites")}</Text>
//         </View>
//         <View style={styles.content}>
//           <Text style={styles.text}>{t("pleaseLogin")}</Text>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>{t("favorites")}</Text>
//       </View>

//       {/* Content */}
//       <View style={styles.content}>
//         {loading && !wishlists.length ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#b80200" />
//             <Text style={styles.text}>{t("loading")}</Text>
//           </View>
//         ) : error ? (
//           <View style={styles.errorContainer}>
//             <Text style={styles.text}>{error}</Text>
//             <TouchableOpacity
//               style={styles.retryButton}
//               onPress={fetchWishlist}
//             >
//               <Text style={styles.retryButtonText}>{t("retry")}</Text>
//             </TouchableOpacity>
//           </View>
//         ) : wishlists.length === 0 ? (
//           <Text style={styles.text}>{t("noWishlists")}</Text>
//         ) : (
//           <FlatList
//             data={wishlists}
//             keyExtractor={(item) => item._id}
//             renderItem={({ item }) => (
//               <CarCardBlock
//                 car={item.car}
//                 onPress={() =>
//                   router.push(`/car-details?carId=${item.car._id}`)
//                 }
//                 hideWishlistIcon={true}
//                 showDeleteIcon={true}
//                 onDelete={() => handleRemoveFromWishlist(item._id)}
//               />
//             )}
//             contentContainerStyle={styles.listContent}
//             initialNumToRender={8}
//             maxToRenderPerBatch={4}
//             windowSize={5}
//             removeClippedSubviews={true}
//             refreshControl={
//               <RefreshControl
//                 refreshing={refreshing}
//                 onRefresh={onRefresh}
//                 colors={["#b80200"]}
//               />
//             }
//           />
//         )}
//       </View>

//       {/* --- Custom Confirmation Modal --- */}
//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={confirmationModalVisible}
//         onRequestClose={() => setConfirmationModalVisible(false)} // Android back button support
//       >
//         <View style={modalStyles.centeredView}>
//           <View style={modalStyles.modalView}>
//             <Text style={modalStyles.modalTitle}>{modalContent.title}</Text>
//             <Text style={modalStyles.modalText}>{modalContent.message}</Text>
//             <View style={modalStyles.buttonContainer}>
//               <TouchableOpacity
//                 style={[modalStyles.button, modalStyles.buttonCancel]}
//                 onPress={() => setConfirmationModalVisible(false)}
//               >
//                 <Text style={modalStyles.textStyleCancel}>{t("cancel")}</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[modalStyles.button, modalStyles.buttonConfirm]}
//                 onPress={modalContent.onConfirm}
//               >
//                 <Text style={modalStyles.textStyleConfirm}>{t("remove")}</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//       {/* --- End Custom Confirmation Modal --- */}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#323332",
//   },
//   header: {
//     backgroundColor: "#323332",
//     paddingHorizontal: 20,

//     alignItems: "center",
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   headerTitle: {
//     fontSize: 24,
//     paddingVertical: 15,
//     fontWeight: "700",
//     color: "#ffffff",
//   },
//   content: {
//     flex: 1,
//     backgroundColor: "#ffffff",
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
// });

// // --- Styles for the custom Modal ---
// const modalStyles = StyleSheet.create({
//   centeredView: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.7)", // Semi-transparent overlay
//   },
//   modalView: {
//     margin: 20,
//     backgroundColor: "#1a1a1a", // Dark background matching app theme
//     borderRadius: 15,
//     padding: 35,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//     width: "80%", // Adjust width as needed
//     maxWidth: 400, // Max width for larger screens
//   },
//   modalTitle: {
//     marginBottom: 15,
//     textAlign: "center",
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#ffffff", // White text
//   },
//   modalText: {
//     marginBottom: 25,
//     textAlign: "center",
//     fontSize: 16,
//     color: "#cccccc", // Lighter white for body text
//   },
//   buttonContainer: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     width: "100%",
//   },
//   button: {
//     borderRadius: 10,
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     elevation: 2,
//     flex: 1, // Allow buttons to share space
//     marginHorizontal: 5, // Space between buttons
//   },
//   buttonConfirm: {
//     backgroundColor: "#b80200", // Your app's primary red
//   },
//   buttonCancel: {
//     backgroundColor: "#313332", // A darker grey for cancel
//   },
//   textStyleConfirm: {
//     color: "#ffffff",
//     fontWeight: "bold",
//     textAlign: "center",
//     fontSize: 16,
//   },
//   textStyleCancel: {
//     color: "#ffffff",
//     fontWeight: "bold",
//     textAlign: "center",
//     fontSize: 16,
//   },
// });
