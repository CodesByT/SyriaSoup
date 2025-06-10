"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import Snackbar from "react-native-snackbar";
import CarCardGrid from "../../components/CarCardGrid";
import InlineSearchBar from "../../components/InlineSearchBar";
import { useAuth } from "../../contexts/AuthContext";
import { useRTL } from "../../hooks/useRTL";
import type { Car } from "../../types";
import {
  addToWishlist,
  checkWishlist,
  getCars,
  getWishlistByUserId,
} from "../../utils/api";

export default function Home() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [search, setSearch] = useState({ make: "", model: "", location: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<
    { carId: string; wishlistId: string }[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rtlViewStyle, rtlStyle } = useRTL();

  useEffect(() => {
    setSearch({ make: "", model: "", location: "" });
    fetchRecentCars();
    if (isAuthenticated && user?._id) {
      fetchWishlistWithRetry();
    } else {
      setWishlist([]);
    }
  }, [isAuthenticated, user?._id]);

  const fetchRecentCars = async () => {
    try {
      setLoading(true);
      const response = await getCars({ sort: "-createdAt", limit: 8 });
      const data = response.data?.data || response.data;

      const carArray = Array.isArray(data) ? data : [];
      const recentCars = carArray
        .filter(
          (car) => car.createdAt && !isNaN(new Date(car.createdAt).getTime())
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 8);

      setCars(recentCars);
      setError(null);
    } catch (error: any) {
      console.error("Home: Error fetching cars:", error);
      setCars([]);
      setError(error.message || t("failed_to_fetch_cars"));
      Snackbar.show({
        text: error.message || t("failed_to_fetch_cars"),
        duration: 1000,
        backgroundColor: "#b80200",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlistWithRetry = async (retries = 3, delay = 1000) => {
    const token = await AsyncStorage.getItem("token");
    if (!token || !user?._id) {
      setWishlist([]);
      return;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await getWishlistByUserId(user._id);
        const wishlistData = response.data?.data || response.data;
        const wishlistItems = Array.isArray(wishlistData)
          ? wishlistData
              .map((item: any) => ({
                carId: item.car?._id || item.carId,
                wishlistId: item._id,
              }))
              .filter((item) => item.carId && item.wishlistId)
          : [];

        // Deduplicate by carId
        const uniqueWishlist = Object.values(
          wishlistItems.reduce((acc, item) => {
            acc[item.carId] = item;
            return acc;
          }, {} as { [key: string]: { carId: string; wishlistId: string } })
        );
        setWishlist(uniqueWishlist);
        return;
      } catch (error: any) {
        if (error.response?.status === 404) {
          setWishlist([]);
          return;
        }
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          setWishlist([]);
        }
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchRecentCars(),
        isAuthenticated && user?._id
          ? fetchWishlistWithRetry()
          : Promise.resolve(),
      ]);
    } catch (error: any) {
      console.error("Home: Error during refresh:", error);
      Snackbar.show({
        text: t("failed_to_refresh"),
        duration: 1000,
        backgroundColor: "#b80200",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleWishlist = async (carId: string) => {
    if (!isAuthenticated || !user?._id) {
      Snackbar.show({
        text: t("please_login_to_wishlist"),
        duration: 1000,
        backgroundColor: "#b80200",
      });
      router.push("/login");
      return;
    }

    try {
      // Check local wishlist state
      const wishlistItem = wishlist.find((item) => item.carId === carId);
      if (wishlistItem) {
        Snackbar.show({
          text: t("already_in_wishlist"),
          duration: 1000,
          backgroundColor: "orange",
          textColor: "#000",
        });
        return;
      }

      // Check backend wishlist
      const { exists, wishlistId } = await checkWishlist(carId, user._id);
      if (exists) {
        Snackbar.show({
          text: t("already_in_wishlist"),
          duration: 1000,
          backgroundColor: "orange",
          textColor: "#000",
        });
        // Sync local state
        if (!wishlist.some((item) => item.carId === carId)) {
          setWishlist([...wishlist, { carId, wishlistId: wishlistId! }]);
        }
        return;
      }

      // Add to wishlist
      try {
        const response = await addToWishlist(carId);
        const newWishlistItem = response.data?.data;
        if (newWishlistItem?._id) {
          setWishlist([
            ...wishlist,
            { carId, wishlistId: newWishlistItem._id },
          ]);
          Snackbar.show({
            text: t("added_to_wishlist"),
            duration: 1000,
            backgroundColor: "green",
            textColor: "#fff",
          });
        }
      } catch (addError: any) {
        if (
          addError.response?.status === 400 &&
          addError.response?.data?.message === "Car already in wishlist"
        ) {
          Snackbar.show({
            text: t("already_in_wishlist"),
            duration: 1000,
            backgroundColor: "orange",
            textColor: "#000",
          });
          await fetchWishlistWithRetry();
        } else {
          throw addError;
        }
      }
    } catch (error: any) {
      console.error("Home: Error toggling wishlist:", error);
      Snackbar.show({
        text: error.message || t("failed_to_add_wishlist"),
        duration: 1000,
        backgroundColor: "#b80200",
      });
    }
  };

  const filteredCars = Array.isArray(cars)
    ? cars.filter((car) => {
        const makeLower = search.make.toLowerCase();
        const modelLower = search.model.toLowerCase();
        const locationLower = search.location.toLowerCase();
        const carMake = car.make?.toLowerCase() || "";
        const carModel = car.model?.toLowerCase() || "";
        const carLocation = car.location?.toLowerCase() || "";
        return (
          (!makeLower || carMake.includes(makeLower)) &&
          (!modelLower || carModel.includes(modelLower)) &&
          (!locationLower || carLocation.includes(locationLower))
        );
      })
    : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("syria_souq")}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <InlineSearchBar
          value={search}
          onChange={setSearch}
          placeholder={t("find_your_perfect_car")}
        />

        <View
          style={[
            styles.sectionHeader,
            rtlViewStyle,
            { justifyContent: "space-between" },
          ]}
        >
          <Text style={[styles.sectionTitle, rtlStyle]}>
            {t("recent_listings")}
          </Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push("/all-cars")}
          >
            <Text style={styles.viewAllText}>{t("view_all")}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#b80200" />
            <Text style={styles.noResults}>{t("loading")}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.noResults}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchRecentCars}
            >
              <Text style={styles.retryButtonText}>{t("retry")}</Text>
            </TouchableOpacity>
          </View>
        ) : filteredCars.length === 0 ? (
          <View style={[styles.noResultsContainer]}>
            <Text style={[styles.noResults, rtlStyle]}>
              {t("no_results", {
                search: search.make || search.model || search.location,
              })}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCars}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              const wishlistItem = wishlist.find((w) => w.carId === item._id);
              return (
                <CarCardGrid
                  car={item}
                  onPress={() => router.push(`/car-details?carId=${item._id}`)}
                  onWishlist={() => handleToggleWishlist(item._id)}
                  isWishlisted={!!wishlistItem}
                  wishlistId={wishlistItem?.wishlistId}
                  isAuthenticated={isAuthenticated}
                />
              );
            }}
            numColumns={2}
            columnWrapperStyle={styles.row}
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
    backgroundColor: "#1a1a1a",
  },
  header: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  sectionHeader: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#314352",
  },
  viewAllButton: {
    backgroundColor: "#b80200",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewAllText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  row: {
    flex: 1,
    justifyContent: "space-around",
    marginHorizontal: -8,
  },
  noResultsContainer: {
    flex: 0, // This makes the container take up all available space
    justifyContent: "center", // Centers children vertically
    alignItems: "center", // Centers children horizontally
  },

  noResults: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#314352",
  },
  errorContainer: {
    alignItems: "center",
    marginTop: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   FlatList,
//   RefreshControl,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import Snackbar from "react-native-snackbar";
// import CarCardGrid from "../../components/CarCardGrid";
// import SearchBar from "../../components/SearchBar";
// import { useAuth } from "../../contexts/AuthContext";
// import { useRTL } from "../../hooks/useRTL";
// import type { Car } from "../../types";
// import {
//   addToWishlist,
//   checkWishlist,
//   getCars,
//   getWishlistByUserId,
// } from "../../utils/api";

// export default function Home() {
//   const { t } = useTranslation();
//   const { isAuthenticated, user } = useAuth();
//   const [cars, setCars] = useState<Car[]>([]);
//   const [search, setSearch] = useState({ make: "", model: "", location: "" });
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [wishlist, setWishlist] = useState<
//     { carId: string; wishlistId: string }[]
//   >([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const { rtlViewStyle, rtlStyle } = useRTL();

//   useEffect(() => {
//     setSearch({ make: "", model: "", location: "" });
//     fetchRecentCars();
//     if (isAuthenticated && user?._id) {
//       fetchWishlistWithRetry();
//     } else {
//       setWishlist([]);
//     }
//   }, [isAuthenticated, user?._id]);

//   const fetchRecentCars = async () => {
//     try {
//       setLoading(true);
//       const response = await getCars({ sort: "-createdAt", limit: 8 });
//       const data = response.data?.data || response.data;

//       const carArray = Array.isArray(data) ? data : [];
//       const recentCars = carArray
//         .filter(
//           (car) => car.createdAt && !isNaN(new Date(car.createdAt).getTime())
//         )
//         .sort(
//           (a, b) =>
//             new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//         )
//         .slice(0, 8);

//       setCars(recentCars);
//       setError(null);
//     } catch (error: any) {
//       console.error("Home: Error fetching cars:", error);
//       setCars([]);
//       setError(error.message || t("failed_to_fetch_cars"));
//       Snackbar.show({
//         text: error.message || t("failed_to_fetch_cars"),
//         duration: 1000,
//         backgroundColor: "#b80200",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchWishlistWithRetry = async (retries = 3, delay = 1000) => {
//     const token = await AsyncStorage.getItem("token");
//     if (!token || !user?._id) {
//       setWishlist([]);
//       return;
//     }

//     for (let attempt = 1; attempt <= retries; attempt++) {
//       try {
//         const response = await getWishlistByUserId(user._id);
//         const wishlistData = response.data?.data || response.data;
//         const wishlistItems = Array.isArray(wishlistData)
//           ? wishlistData
//               .map((item: any) => ({
//                 carId: item.car?._id || item.carId,
//                 wishlistId: item._id,
//               }))
//               .filter((item) => item.carId && item.wishlistId)
//           : [];

//         // Deduplicate by carId
//         const uniqueWishlist = Object.values(
//           wishlistItems.reduce((acc, item) => {
//             acc[item.carId] = item;
//             return acc;
//           }, {} as { [key: string]: { carId: string; wishlistId: string } })
//         );
//         setWishlist(uniqueWishlist);
//         return;
//       } catch (error: any) {
//         if (error.response?.status === 404) {
//           setWishlist([]);
//           return;
//         }
//         if (attempt < retries) {
//           await new Promise((resolve) => setTimeout(resolve, delay));
//         } else {
//           setWishlist([]);
//         }
//       }
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     try {
//       await Promise.all([
//         fetchRecentCars(),
//         isAuthenticated && user?._id
//           ? fetchWishlistWithRetry()
//           : Promise.resolve(),
//       ]);
//     } catch (error: any) {
//       console.error("Home: Error during refresh:", error);
//       Snackbar.show({
//         text: t("failed_to_refresh"),
//         duration: 1000,
//         backgroundColor: "#b80200",
//       });
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const handleToggleWishlist = async (carId: string) => {
//     if (!isAuthenticated || !user?._id) {
//       Snackbar.show({
//         text: t("please_login_to_wishlist"),
//         duration: 1000,
//         backgroundColor: "#b80200",
//       });
//       router.push("/login");
//       return;
//     }

//     try {
//       // Check local wishlist state
//       const wishlistItem = wishlist.find((item) => item.carId === carId);
//       if (wishlistItem) {
//         Snackbar.show({
//           text: t("already_in_wishlist"),
//           duration: 1000,
//           backgroundColor: "orange",
//           textColor: "#000",
//         });
//         return;
//       }

//       // Check backend wishlist
//       const { exists, wishlistId } = await checkWishlist(carId, user._id);
//       if (exists) {
//         Snackbar.show({
//           text: t("already_in_wishlist"),
//           duration: 1000,
//           backgroundColor: "orange",
//           textColor: "#000",
//         });
//         // Sync local state
//         if (!wishlist.some((item) => item.carId === carId)) {
//           setWishlist([...wishlist, { carId, wishlistId: wishlistId! }]);
//         }
//         return;
//       }

//       // Add to wishlist
//       try {
//         const response = await addToWishlist(carId);
//         const newWishlistItem = response.data?.data;
//         if (newWishlistItem?._id) {
//           setWishlist([
//             ...wishlist,
//             { carId, wishlistId: newWishlistItem._id },
//           ]);
//           Snackbar.show({
//             text: t("added_to_wishlist"),
//             duration: 1000,
//             backgroundColor: "green",
//             textColor: "#fff",
//           });
//         }
//       } catch (addError: any) {
//         if (
//           addError.response?.status === 400 &&
//           addError.response?.data?.message === "Car already in wishlist"
//         ) {
//           Snackbar.show({
//             text: t("already_in_wishlist"),
//             duration: 1000,
//             backgroundColor: "orange",
//             textColor: "#000",
//           });
//           await fetchWishlistWithRetry();
//         } else {
//           throw addError;
//         }
//       }
//     } catch (error: any) {
//       console.error("Home: Error toggling wishlist:", error);
//       Snackbar.show({
//         text: error.message || t("failed_to_add_wishlist"),
//         duration: 1000,
//         backgroundColor: "#b80200",
//       });
//     }
//   };

//   const filteredCars = Array.isArray(cars)
//     ? cars.filter((car) => {
//         const makeLower = search.make.toLowerCase();
//         const modelLower = search.model.toLowerCase();
//         const locationLower = search.location.toLowerCase();
//         const carMake = car.make?.toLowerCase() || "";
//         const carModel = car.model?.toLowerCase() || "";
//         const carLocation = car.location?.toLowerCase() || "";
//         return (
//           (!makeLower || carMake.includes(makeLower)) &&
//           (!modelLower || carModel.includes(modelLower)) &&
//           (!locationLower || carLocation.includes(locationLower))
//         );
//       })
//     : [];

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>{t("syria_souq")}</Text>
//       </View>

//       {/* Content */}
//       <View style={styles.content}>
//         <SearchBar
//           value={search}
//           onChange={setSearch}
//           placeholder={t("find_your_perfect_car")}
//         />

//         <View
//           style={[
//             styles.sectionHeader,
//             rtlViewStyle,
//             { justifyContent: "space-between" },
//           ]}
//         >
//           <Text style={[styles.sectionTitle, rtlStyle]}>
//             {t("recent_listings")}
//           </Text>
//           <TouchableOpacity
//             style={styles.viewAllButton}
//             onPress={() => router.push("/all-cars")}
//           >
//             <Text style={styles.viewAllText}>{t("view_all")}</Text>
//           </TouchableOpacity>
//         </View>

//         {loading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#b80200" />
//             <Text style={styles.noResults}>{t("loading")}</Text>
//           </View>
//         ) : error ? (
//           <View style={styles.errorContainer}>
//             <Text style={styles.noResults}>{error}</Text>
//             <TouchableOpacity
//               style={styles.retryButton}
//               onPress={fetchRecentCars}
//             >
//               <Text style={styles.retryButtonText}>{t("retry")}</Text>
//             </TouchableOpacity>
//           </View>
//         ) : filteredCars.length === 0 ? (
//           <Text style={[styles.noResults, rtlStyle]}>
//             {t("no_results", {
//               search: search.make || search.model || search.location,
//             })}
//           </Text>
//         ) : (
//           <FlatList
//             data={filteredCars}
//             keyExtractor={(item) => item._id}
//             renderItem={({ item }) => {
//               const wishlistItem = wishlist.find((w) => w.carId === item._id);
//               return (
//                 <CarCardGrid
//                   car={item}
//                   onPress={() => router.push(`/car-details?carId=${item._id}`)}
//                   onWishlist={() => handleToggleWishlist(item._id)}
//                   isWishlisted={!!wishlistItem}
//                   wishlistId={wishlistItem?.wishlistId}
//                   isAuthenticated={isAuthenticated}
//                 />
//               );
//             }}
//             numColumns={2}
//             columnWrapperStyle={styles.row}
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
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#1a1a1a",
//   },
//   header: {
//     backgroundColor: "#1a1a1a",
//     paddingHorizontal: 20,
//     paddingVertical: 15,
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
//     fontWeight: "700",
//     color: "#ffffff",
//   },
//   content: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//   },
//   sectionHeader: {
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "#ffffff",
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: "#314352",
//   },
//   viewAllButton: {
//     backgroundColor: "#b80200",
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//   },
//   viewAllText: {
//     color: "#ffffff",
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   listContent: {
//     paddingHorizontal: 8,
//     paddingBottom: 20,
//   },
//   row: {
//     flex: 1,
//     justifyContent: "space-around",
//     marginHorizontal: -8,
//   },
//   noResults: {
//     textAlign: "center",
//     marginTop: 20,
//     fontSize: 16,
//     color: "#314352",
//   },
//   errorContainer: {
//     alignItems: "center",
//     marginTop: 20,
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
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
// });
