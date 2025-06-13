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
import { showToastable } from "react-native-toastable";
import CarCardGrid from "../../components/CarCardGrid";
import InlineSearchBar from "../../components/InlineSearchBar";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useAuth } from "../../contexts/AuthContext";
import { useRTL } from "../../hooks/useRTL";
import type { Car } from "../../types";
import {
  addToWishlist,
  checkWishlist,
  getCars,
  getWishlistByUserId,
} from "../../utils/api";
import { arabicMakes, locations, makes } from "../../utils/constants";

export default function Home() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [search, setSearch] = useState({
    make: "",
    model: "",
    location: "",
    cylinder: "",
    transmission: "",
    fuelType: "",
    exteriorColor: "",
    interiorColor: "",
    priceMin: "",
    priceMax: "",
    yearMin: "",
    yearMax: "",
    kilometerMin: "",
    kilometerMax: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<
    { carId: string; wishlistId: string }[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rtlViewStyle, rtlStyle } = useRTL();
  const isArabic = i18n.language === "ar";

  useEffect(() => {
    setSearch({
      make: "",
      model: "",
      location: "",
      cylinder: "",
      transmission: "",
      fuelType: "",
      exteriorColor: "",
      interiorColor: "",
      priceMin: "",
      priceMax: "",
      yearMin: "",
      yearMax: "",
      kilometerMin: "",
      kilometerMax: "",
    });
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

      showToastable({
        message: t("failed_to_fetch_cars"),
        status: "warning",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
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

      showToastable({
        message: t("failed_to_refresh"),
        status: "warning",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleWishlist = async (carId: string) => {
    if (!isAuthenticated || !user?._id) {
      showToastable({
        message: t("please_login_to_wishlist"),
        status: "warning",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
      });
      router.push("/login");
      return;
    }

    try {
      // Check local wishlist state
      const wishlistItem = wishlist.find((item) => item.carId === carId);
      if (wishlistItem) {
        showToastable({
          message: t("already_in_wishlist"),
          status: "success",
          duration: 2000, // Matches Snackbar.LENGTH_LONG
        });
        return;
      }

      // Check backend wishlist
      const { exists, wishlistId } = await checkWishlist(carId, user._id);
      if (exists) {
        showToastable({
          message: t("already_in_wishlist"),
          status: "success",
          duration: 2000, // Matches Snackbar.LENGTH_LONG
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

          showToastable({
            message: t("added_to_wishlist"),
            status: "success",
            duration: 2000, // Matches Snackbar.LENGTH_LONG
          });
        }
      } catch (addError: any) {
        if (
          addError.response?.status === 400 &&
          addError.response?.data?.message === "Car already in wishlist"
        ) {
          showToastable({
            message: t("already_in_wishlist"),
            status: "success",
            duration: 2000, // Matches Snackbar.LENGTH_LONG
          });
          await fetchWishlistWithRetry();
        } else {
          throw addError;
        }
      }
    } catch (error: any) {
      console.error("Home: Error toggling wishlist:", error);

      showToastable({
        message: t("failed_to_add_wishlist"),
        status: "warning",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
      });
    }
  };

  // Helper function to find English equivalent of Arabic make
  const findEnglishMake = (arabicMake: string): string => {
    const found = arabicMakes.find(
      (m) =>
        m.label.toLowerCase() === arabicMake.toLowerCase() ||
        m.value.toLowerCase() === arabicMake.toLowerCase()
    );
    return found?.enValue || arabicMake;
  };

  // Helper function to find English equivalent of Arabic model
  const findEnglishModel = (
    arabicModel: string,
    arabicMake: string
  ): string => {
    const foundMake = arabicMakes.find(
      (m) =>
        m.label.toLowerCase() === arabicMake.toLowerCase() ||
        m.value.toLowerCase() === arabicMake.toLowerCase()
    );

    if (foundMake && foundMake.models) {
      const modelIndex = foundMake.models.findIndex(
        (m) => m.toLowerCase() === arabicModel.toLowerCase()
      );

      if (modelIndex >= 0) {
        const englishMake = makes.find(
          (m) => m.value.toLowerCase() === foundMake.enValue.toLowerCase()
        );

        if (
          englishMake &&
          englishMake.models &&
          englishMake.models[modelIndex]
        ) {
          return englishMake.models[modelIndex];
        }
      }
    }

    return arabicModel;
  };

  const filteredCars = Array.isArray(cars)
    ? cars.filter((car) => {
        // Get search terms, accounting for language
        let searchMake = search.make.toLowerCase();
        let searchModel = search.model.toLowerCase();
        let searchLocation = search.location.toLowerCase();

        // If in Arabic mode, convert search terms to English for comparison
        if (isArabic && searchMake) {
          searchMake = findEnglishMake(searchMake).toLowerCase();
        }

        if (isArabic && searchModel && searchMake) {
          searchModel = findEnglishModel(
            searchModel,
            search.make
          ).toLowerCase();
        }

        if (isArabic && searchLocation) {
          // Find English location equivalent
          const locationObj = locations.find(
            (loc) => loc.arValue.toLowerCase() === searchLocation
          );
          if (locationObj) {
            searchLocation = locationObj.value.toLowerCase();
          }
        }

        const carMake = car.make?.toLowerCase() || "";
        const carModel = car.model?.toLowerCase() || "";
        const carLocation = car.location?.toLowerCase() || "";
        const carCylinder = car.engineSize?.toLowerCase() || "";
        const carTransmission = car.transmission?.toLowerCase() || "";
        const carFuelType = car.fuelType?.toLowerCase() || "";
        const carExteriorColor = car.exteriorColor?.toLowerCase() || "";
        const carInteriorColor = car.interiorColor?.toLowerCase() || "";
        const carYear = Number.parseInt(car.year || "0");
        const carKilometer = Number.parseInt(
          car.kilometer?.replace(/,/g, "") || "0"
        );
        const carPrice = Number.parseInt(
          car.priceUSD?.replace(/,/g, "") || "0"
        );

        // Basic filters
        const makeMatch = !searchMake || carMake.includes(searchMake);
        const modelMatch = !searchModel || carModel.includes(searchModel);
        const locationMatch =
          !searchLocation || carLocation.includes(searchLocation);

        // Additional filters
        const cylinderMatch =
          !search.cylinder ||
          carCylinder.includes(search.cylinder.toLowerCase());
        const transmissionMatch =
          !search.transmission ||
          carTransmission.includes(search.transmission.toLowerCase());
        const fuelTypeMatch =
          !search.fuelType ||
          carFuelType.includes(search.fuelType.toLowerCase());
        const exteriorColorMatch =
          !search.exteriorColor ||
          carExteriorColor.includes(search.exteriorColor.toLowerCase());
        const interiorColorMatch =
          !search.interiorColor ||
          carInteriorColor.includes(search.interiorColor.toLowerCase());

        // Range filters
        const yearMinMatch =
          !search.yearMin || carYear >= Number.parseInt(search.yearMin);
        const yearMaxMatch =
          !search.yearMax || carYear <= Number.parseInt(search.yearMax);
        const kilometerMinMatch =
          !search.kilometerMin ||
          carKilometer >= Number.parseInt(search.kilometerMin);
        const kilometerMaxMatch =
          !search.kilometerMax ||
          carKilometer <= Number.parseInt(search.kilometerMax);
        const priceMinMatch =
          !search.priceMin || carPrice >= Number.parseInt(search.priceMin);
        const priceMaxMatch =
          !search.priceMax || carPrice <= Number.parseInt(search.priceMax);

        return (
          makeMatch &&
          modelMatch &&
          locationMatch &&
          cylinderMatch &&
          transmissionMatch &&
          fuelTypeMatch &&
          exteriorColorMatch &&
          interiorColorMatch &&
          yearMinMatch &&
          yearMaxMatch &&
          kilometerMinMatch &&
          kilometerMaxMatch &&
          priceMinMatch &&
          priceMaxMatch
        );
      })
    : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t("syria_souq")}</Text>
          </View>
          <View style={styles.languageSwitcherContainer}>
            <LanguageSwitcher compact={true} />
          </View>
        </View>
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
          <View style={styles.noResultsContainer}>
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
    paddingVertical: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  languageSwitcherContainer: {
    marginLeft: 10,
  },
  content: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#b80200",
    borderRadius: 15,
  },
  viewAllText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  noResults: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#b80200",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
});

// "use client";

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
// import { showToastable } from "react-native-toastable";
// import CarCardGrid from "../../components/CarCardGrid";
// import InlineSearchBar from "../../components/InlineSearchBar";
// import { LanguageSwitcher } from "../../components/LanguageSwitcher";
// import { useAuth } from "../../contexts/AuthContext";
// import { useRTL } from "../../hooks/useRTL";
// import type { Car } from "../../types";
// import {
//   addToWishlist,
//   checkWishlist,
//   getCars,
//   getWishlistByUserId,
// } from "../../utils/api";
// import { arabicMakes, locations, makes } from "../../utils/constants";

// export default function Home() {
//   const { t, i18n } = useTranslation();
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
//   const isArabic = i18n.language === "ar";

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

//       showToastable({
//         message: t("failed_to_fetch_cars"),
//         status: "warning",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
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

//       showToastable({
//         message: t("failed_to_refresh"),
//         status: "warning",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
//       });
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const handleToggleWishlist = async (carId: string) => {
//     if (!isAuthenticated || !user?._id) {
//       showToastable({
//         message: t("please_login_to_wishlist"),
//         status: "warning",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
//       });
//       router.push("/login");
//       return;
//     }

//     try {
//       // Check local wishlist state
//       const wishlistItem = wishlist.find((item) => item.carId === carId);
//       if (wishlistItem) {
//         showToastable({
//           message: t("already_in_wishlist"),
//           status: "success",
//           duration: 2000, // Matches Snackbar.LENGTH_LONG
//         });
//         return;
//       }

//       // Check backend wishlist
//       const { exists, wishlistId } = await checkWishlist(carId, user._id);
//       if (exists) {
//         showToastable({
//           message: t("already_in_wishlist"),
//           status: "success",
//           duration: 2000, // Matches Snackbar.LENGTH_LONG
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

//           showToastable({
//             message: t("added_to_wishlist"),
//             status: "success",
//             duration: 2000, // Matches Snackbar.LENGTH_LONG
//           });
//         }
//       } catch (addError: any) {
//         if (
//           addError.response?.status === 400 &&
//           addError.response?.data?.message === "Car already in wishlist"
//         ) {
//           showToastable({
//             message: t("already_in_wishlist"),
//             status: "success",
//             duration: 2000, // Matches Snackbar.LENGTH_LONG
//           });
//           await fetchWishlistWithRetry();
//         } else {
//           throw addError;
//         }
//       }
//     } catch (error: any) {
//       console.error("Home: Error toggling wishlist:", error);

//       showToastable({
//         message: t("failed_to_add_wishlist"),
//         status: "warning",
//         duration: 2000, // Matches Snackbar.LENGTH_LONG
//       });
//     }
//   };

//   // Helper function to find English equivalent of Arabic make
//   const findEnglishMake = (arabicMake: string): string => {
//     const found = arabicMakes.find(
//       (m) =>
//         m.label.toLowerCase() === arabicMake.toLowerCase() ||
//         m.value.toLowerCase() === arabicMake.toLowerCase()
//     );
//     return found?.enValue || arabicMake;
//   };

//   // Helper function to find English equivalent of Arabic model
//   const findEnglishModel = (
//     arabicModel: string,
//     arabicMake: string
//   ): string => {
//     const foundMake = arabicMakes.find(
//       (m) =>
//         m.label.toLowerCase() === arabicMake.toLowerCase() ||
//         m.value.toLowerCase() === arabicMake.toLowerCase()
//     );

//     if (foundMake && foundMake.models) {
//       const modelIndex = foundMake.models.findIndex(
//         (m) => m.toLowerCase() === arabicModel.toLowerCase()
//       );

//       if (modelIndex >= 0) {
//         const englishMake = makes.find(
//           (m) => m.value.toLowerCase() === foundMake.enValue.toLowerCase()
//         );

//         if (
//           englishMake &&
//           englishMake.models &&
//           englishMake.models[modelIndex]
//         ) {
//           return englishMake.models[modelIndex];
//         }
//       }
//     }

//     return arabicModel;
//   };

//   const filteredCars = Array.isArray(cars)
//     ? cars.filter((car) => {
//         // Get search terms, accounting for language
//         let searchMake = search.make.toLowerCase();
//         let searchModel = search.model.toLowerCase();
//         let searchLocation = search.location.toLowerCase();

//         // If in Arabic mode, convert search terms to English for comparison
//         if (isArabic && searchMake) {
//           searchMake = findEnglishMake(searchMake).toLowerCase();
//         }

//         if (isArabic && searchModel && searchMake) {
//           searchModel = findEnglishModel(
//             searchModel,
//             search.make
//           ).toLowerCase();
//         }

//         if (isArabic && searchLocation) {
//           // Find English location equivalent
//           const locationObj = locations.find(
//             (loc) => loc.arValue.toLowerCase() === searchLocation
//           );
//           if (locationObj) {
//             searchLocation = locationObj.value.toLowerCase();
//           }
//         }

//         const carMake = car.make?.toLowerCase() || "";
//         const carModel = car.model?.toLowerCase() || "";
//         const carLocation = car.location?.toLowerCase() || "";

//         return (
//           (!searchMake || carMake.includes(searchMake)) &&
//           (!searchModel || carModel.includes(searchModel)) &&
//           (!searchLocation || carLocation.includes(searchLocation))
//         );
//       })
//     : [];

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerContent}>
//           <View style={styles.headerTitleContainer}>
//             <Text style={styles.headerTitle}>{t("syria_souq")}</Text>
//           </View>
//           <View style={styles.languageSwitcherContainer}>
//             <LanguageSwitcher compact={true} />
//           </View>
//         </View>
//       </View>

//       {/* Content */}
//       <View style={styles.content}>
//         <InlineSearchBar
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
//           <View style={styles.noResultsContainer}>
//             <Text style={[styles.noResults, rtlStyle]}>
//               {t("no_results", {
//                 search: search.make || search.model || search.location,
//               })}
//             </Text>
//           </View>
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
//     paddingVertical: 15,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   headerContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     position: "relative",
//     height: 44,
//   },
//   headerTitleContainer: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#ffffff",
//     textAlign: "center",
//   },
//   languageSwitcherContainer: {
//     position: "absolute",
//     right: 16,
//     zIndex: 1,
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
//   noResultsContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 20,
//   },
//   noResults: {
//     textAlign: "center",
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

// // import AsyncStorage from "@react-native-async-storage/async-storage";
// // import { useRouter } from "expo-router";
// // import { useEffect, useState } from "react";
// // import { useTranslation } from "react-i18next";
// // import {
// //   ActivityIndicator,
// //   FlatList,
// //   RefreshControl,
// //   StyleSheet,
// //   Text,
// //   TouchableOpacity,
// //   View,
// // } from "react-native";
// // import { useSafeAreaInsets } from "react-native-safe-area-context";
// // import Snackbar from "react-native-snackbar";
// // import CarCardGrid from "../../components/CarCardGrid";
// // import InlineSearchBar from "../../components/InlineSearchBar";
// // import { useAuth } from "../../contexts/AuthContext";
// // import { useRTL } from "../../hooks/useRTL";
// // import type { Car } from "../../types";
// // import {
// //   addToWishlist,
// //   checkWishlist,
// //   getCars,
// //   getWishlistByUserId,
// // } from "../../utils/api";
// // import { arabicMakes, locations, makes } from "../../utils/constants";

// // export default function Home() {
// //   const { t, i18n } = useTranslation();
// //   const { isAuthenticated, user } = useAuth();
// //   const [cars, setCars] = useState<Car[]>([]);
// //   const [search, setSearch] = useState({ make: "", model: "", location: "" });
// //   const [error, setError] = useState<string | null>(null);
// //   const [loading, setLoading] = useState(true);
// //   const [wishlist, setWishlist] = useState<
// //     { carId: string; wishlistId: string }[]
// //   >([]);
// //   const [refreshing, setRefreshing] = useState(false);
// //   const router = useRouter();
// //   const insets = useSafeAreaInsets();
// //   const { rtlViewStyle, rtlStyle } = useRTL();
// //   const isArabic = i18n.language === "ar";

// //   useEffect(() => {
// //     setSearch({ make: "", model: "", location: "" });
// //     fetchRecentCars();
// //     if (isAuthenticated && user?._id) {
// //       fetchWishlistWithRetry();
// //     } else {
// //       setWishlist([]);
// //     }
// //   }, [isAuthenticated, user?._id]);

// //   const fetchRecentCars = async () => {
// //     try {
// //       setLoading(true);
// //       const response = await getCars({ sort: "-createdAt", limit: 8 });
// //       const data = response.data?.data || response.data;

// //       const carArray = Array.isArray(data) ? data : [];
// //       const recentCars = carArray
// //         .filter(
// //           (car) => car.createdAt && !isNaN(new Date(car.createdAt).getTime())
// //         )
// //         .sort(
// //           (a, b) =>
// //             new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
// //         )
// //         .slice(0, 8);

// //       setCars(recentCars);
// //       setError(null);
// //     } catch (error: any) {
// //       console.error("Home: Error fetching cars:", error);
// //       setCars([]);
// //       setError(error.message || t("failed_to_fetch_cars"));
// //       Snackbar.show({
// //         text: error.message || t("failed_to_fetch_cars"),
// //         duration: 1000,
// //         backgroundColor: "#b80200",
// //       });
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const fetchWishlistWithRetry = async (retries = 3, delay = 1000) => {
// //     const token = await AsyncStorage.getItem("token");
// //     if (!token || !user?._id) {
// //       setWishlist([]);
// //       return;
// //     }

// //     for (let attempt = 1; attempt <= retries; attempt++) {
// //       try {
// //         const response = await getWishlistByUserId(user._id);
// //         const wishlistData = response.data?.data || response.data;
// //         const wishlistItems = Array.isArray(wishlistData)
// //           ? wishlistData
// //               .map((item: any) => ({
// //                 carId: item.car?._id || item.carId,
// //                 wishlistId: item._id,
// //               }))
// //               .filter((item) => item.carId && item.wishlistId)
// //           : [];

// //         // Deduplicate by carId
// //         const uniqueWishlist = Object.values(
// //           wishlistItems.reduce((acc, item) => {
// //             acc[item.carId] = item;
// //             return acc;
// //           }, {} as { [key: string]: { carId: string; wishlistId: string } })
// //         );
// //         setWishlist(uniqueWishlist);
// //         return;
// //       } catch (error: any) {
// //         if (error.response?.status === 404) {
// //           setWishlist([]);
// //           return;
// //         }
// //         if (attempt < retries) {
// //           await new Promise((resolve) => setTimeout(resolve, delay));
// //         } else {
// //           setWishlist([]);
// //         }
// //       }
// //     }
// //   };

// //   const onRefresh = async () => {
// //     setRefreshing(true);
// //     try {
// //       await Promise.all([
// //         fetchRecentCars(),
// //         isAuthenticated && user?._id
// //           ? fetchWishlistWithRetry()
// //           : Promise.resolve(),
// //       ]);
// //     } catch (error: any) {
// //       console.error("Home: Error during refresh:", error);
// //       Snackbar.show({
// //         text: t("failed_to_refresh"),
// //         duration: 1000,
// //         backgroundColor: "#b80200",
// //       });
// //     } finally {
// //       setRefreshing(false);
// //     }
// //   };

// //   const handleToggleWishlist = async (carId: string) => {
// //     if (!isAuthenticated || !user?._id) {
// //       Snackbar.show({
// //         text: t("please_login_to_wishlist"),
// //         duration: 1000,
// //         backgroundColor: "#b80200",
// //       });
// //       router.push("/login");
// //       return;
// //     }

// //     try {
// //       // Check local wishlist state
// //       const wishlistItem = wishlist.find((item) => item.carId === carId);
// //       if (wishlistItem) {
// //         Snackbar.show({
// //           text: t("already_in_wishlist"),
// //           duration: 1000,
// //           backgroundColor: "orange",
// //           textColor: "#000",
// //         });
// //         return;
// //       }

// //       // Check backend wishlist
// //       const { exists, wishlistId } = await checkWishlist(carId, user._id);
// //       if (exists) {
// //         Snackbar.show({
// //           text: t("already_in_wishlist"),
// //           duration: 1000,
// //           backgroundColor: "orange",
// //           textColor: "#000",
// //         });
// //         // Sync local state
// //         if (!wishlist.some((item) => item.carId === carId)) {
// //           setWishlist([...wishlist, { carId, wishlistId: wishlistId! }]);
// //         }
// //         return;
// //       }

// //       // Add to wishlist
// //       try {
// //         const response = await addToWishlist(carId);
// //         const newWishlistItem = response.data?.data;
// //         if (newWishlistItem?._id) {
// //           setWishlist([
// //             ...wishlist,
// //             { carId, wishlistId: newWishlistItem._id },
// //           ]);
// //           Snackbar.show({
// //             text: t("added_to_wishlist"),
// //             duration: 1000,
// //             backgroundColor: "green",
// //             textColor: "#fff",
// //           });
// //         }
// //       } catch (addError: any) {
// //         if (
// //           addError.response?.status === 400 &&
// //           addError.response?.data?.message === "Car already in wishlist"
// //         ) {
// //           Snackbar.show({
// //             text: t("already_in_wishlist"),
// //             duration: 1000,
// //             backgroundColor: "orange",
// //             textColor: "#000",
// //           });
// //           await fetchWishlistWithRetry();
// //         } else {
// //           throw addError;
// //         }
// //       }
// //     } catch (error: any) {
// //       console.error("Home: Error toggling wishlist:", error);
// //       Snackbar.show({
// //         text: error.message || t("failed_to_add_wishlist"),
// //         duration: 1000,
// //         backgroundColor: "#b80200",
// //       });
// //     }
// //   };

// //   // Helper function to find English equivalent of Arabic make
// //   const findEnglishMake = (arabicMake: string): string => {
// //     const found = arabicMakes.find(
// //       (m) =>
// //         m.label.toLowerCase() === arabicMake.toLowerCase() ||
// //         m.value.toLowerCase() === arabicMake.toLowerCase()
// //     );
// //     return found?.enValue || arabicMake;
// //   };

// //   // Helper function to find English equivalent of Arabic model
// //   const findEnglishModel = (
// //     arabicModel: string,
// //     arabicMake: string
// //   ): string => {
// //     const foundMake = arabicMakes.find(
// //       (m) =>
// //         m.label.toLowerCase() === arabicMake.toLowerCase() ||
// //         m.value.toLowerCase() === arabicMake.toLowerCase()
// //     );

// //     if (foundMake && foundMake.models) {
// //       const modelIndex = foundMake.models.findIndex(
// //         (m) => m.toLowerCase() === arabicModel.toLowerCase()
// //       );

// //       if (modelIndex >= 0) {
// //         const englishMake = makes.find(
// //           (m) => m.value.toLowerCase() === foundMake.enValue.toLowerCase()
// //         );

// //         if (
// //           englishMake &&
// //           englishMake.models &&
// //           englishMake.models[modelIndex]
// //         ) {
// //           return englishMake.models[modelIndex];
// //         }
// //       }
// //     }

// //     return arabicModel;
// //   };

// //   const filteredCars = Array.isArray(cars)
// //     ? cars.filter((car) => {
// //         // Get search terms, accounting for language
// //         let searchMake = search.make.toLowerCase();
// //         let searchModel = search.model.toLowerCase();
// //         let searchLocation = search.location.toLowerCase();

// //         // If in Arabic mode, convert search terms to English for comparison
// //         if (isArabic && searchMake) {
// //           searchMake = findEnglishMake(searchMake).toLowerCase();
// //         }

// //         if (isArabic && searchModel && searchMake) {
// //           searchModel = findEnglishModel(
// //             searchModel,
// //             search.make
// //           ).toLowerCase();
// //         }

// //         if (isArabic && searchLocation) {
// //           // Find English location equivalent
// //           const locationObj = locations.find(
// //             (loc) => loc.arValue.toLowerCase() === searchLocation
// //           );
// //           if (locationObj) {
// //             searchLocation = locationObj.value.toLowerCase();
// //           }
// //         }

// //         const carMake = car.make?.toLowerCase() || "";
// //         const carModel = car.model?.toLowerCase() || "";
// //         const carLocation = car.location?.toLowerCase() || "";

// //         return (
// //           (!searchMake || carMake.includes(searchMake)) &&
// //           (!searchModel || carModel.includes(searchModel)) &&
// //           (!searchLocation || carLocation.includes(searchLocation))
// //         );
// //       })
// //     : [];

// //   return (
// //     <View style={[styles.container, { paddingTop: insets.top }]}>
// //       {/* Header */}
// //       <View style={styles.header}>
// //         <Text style={styles.headerTitle}>{t("syria_souq")}</Text>
// //       </View>

// //       {/* Content */}
// //       <View style={styles.content}>
// //         <InlineSearchBar
// //           value={search}
// //           onChange={setSearch}
// //           placeholder={t("find_your_perfect_car")}
// //         />

// //         <View
// //           style={[
// //             styles.sectionHeader,
// //             rtlViewStyle,
// //             { justifyContent: "space-between" },
// //           ]}
// //         >
// //           <Text style={[styles.sectionTitle, rtlStyle]}>
// //             {t("recent_listings")}
// //           </Text>
// //           <TouchableOpacity
// //             style={styles.viewAllButton}
// //             onPress={() => router.push("/all-cars")}
// //           >
// //             <Text style={styles.viewAllText}>{t("view_all")}</Text>
// //           </TouchableOpacity>
// //         </View>

// //         {loading ? (
// //           <View style={styles.loadingContainer}>
// //             <ActivityIndicator size="large" color="#b80200" />
// //             <Text style={styles.noResults}>{t("loading")}</Text>
// //           </View>
// //         ) : error ? (
// //           <View style={styles.errorContainer}>
// //             <Text style={styles.noResults}>{error}</Text>
// //             <TouchableOpacity
// //               style={styles.retryButton}
// //               onPress={fetchRecentCars}
// //             >
// //               <Text style={styles.retryButtonText}>{t("retry")}</Text>
// //             </TouchableOpacity>
// //           </View>
// //         ) : filteredCars.length === 0 ? (
// //           <Text style={[styles.noResults, rtlStyle]}>
// //             {t("no_results", {
// //               search: search.make || search.model || search.location,
// //             })}
// //           </Text>
// //         ) : (
// //           <FlatList
// //             data={filteredCars}
// //             keyExtractor={(item) => item._id}
// //             renderItem={({ item }) => {
// //               const wishlistItem = wishlist.find((w) => w.carId === item._id);
// //               return (
// //                 <CarCardGrid
// //                   car={item}
// //                   onPress={() => router.push(`/car-details?carId=${item._id}`)}
// //                   onWishlist={() => handleToggleWishlist(item._id)}
// //                   isWishlisted={!!wishlistItem}
// //                   wishlistId={wishlistItem?.wishlistId}
// //                   isAuthenticated={isAuthenticated}
// //                 />
// //               );
// //             }}
// //             numColumns={2}
// //             columnWrapperStyle={styles.row}
// //             contentContainerStyle={styles.listContent}
// //             initialNumToRender={8}
// //             maxToRenderPerBatch={4}
// //             windowSize={5}
// //             removeClippedSubviews={true}
// //             refreshControl={
// //               <RefreshControl
// //                 refreshing={refreshing}
// //                 onRefresh={onRefresh}
// //                 colors={["#b80200"]}
// //               />
// //             }
// //           />
// //         )}
// //       </View>
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: "#1a1a1a",
// //   },
// //   header: {
// //     backgroundColor: "#1a1a1a",
// //     paddingHorizontal: 20,
// //     paddingVertical: 15,
// //     alignItems: "center",
// //     borderBottomLeftRadius: 20,
// //     borderBottomRightRadius: 20,
// //     shadowColor: "#000",
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 4,
// //     elevation: 3,
// //   },
// //   headerTitle: {
// //     fontSize: 24,
// //     fontWeight: "700",
// //     color: "#ffffff",
// //   },
// //   content: {
// //     flex: 1,
// //     backgroundColor: "#f8f9fa",
// //   },
// //   sectionHeader: {
// //     alignItems: "center",
// //     paddingHorizontal: 16,
// //     paddingVertical: 12,
// //     backgroundColor: "#ffffff",
// //   },
// //   sectionTitle: {
// //     fontSize: 20,
// //     fontWeight: "600",
// //     color: "#314352",
// //   },
// //   viewAllButton: {
// //     backgroundColor: "#b80200",
// //     paddingVertical: 6,
// //     paddingHorizontal: 12,
// //     borderRadius: 6,
// //   },
// //   viewAllText: {
// //     color: "#ffffff",
// //     fontSize: 12,
// //     fontWeight: "600",
// //   },
// //   listContent: {
// //     paddingHorizontal: 8,
// //     paddingBottom: 20,
// //   },
// //   row: {
// //     flex: 1,
// //     justifyContent: "space-around",
// //     marginHorizontal: -8,
// //   },
// //   noResults: {
// //     textAlign: "center",
// //     marginTop: 20,
// //     fontSize: 16,
// //     color: "#314352",
// //   },
// //   errorContainer: {
// //     alignItems: "center",
// //     marginTop: 20,
// //   },
// //   retryButton: {
// //     backgroundColor: "#b80200",
// //     paddingVertical: 10,
// //     paddingHorizontal: 20,
// //     borderRadius: 8,
// //     marginTop: 10,
// //   },
// //   retryButtonText: {
// //     color: "#ffffff",
// //     fontSize: 14,
// //     fontWeight: "600",
// //   },
// //   loadingContainer: {
// //     flex: 1,
// //     justifyContent: "center",
// //     alignItems: "center",
// //   },
// // });
