"use client";

import { Ionicons } from "@expo/vector-icons";
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
import CarCard from "../components/CarCard";
import InlineSearchBar from "../components/InlineSearchBar";
import { useAuth } from "../contexts/AuthContext";
import { useRTL } from "../hooks/useRTL";
import type { Car } from "../types";
import {
  addToWishlist,
  checkWishlist,
  getCars,
  getWishlistByUserId,
} from "../utils/api";
import { arabicMakes, locations, makes } from "../utils/constants";

// IMPORT SearchValue from your new shared types file
import { SearchValue } from "../types/searchValues"; // Adjust path as needed, e.g., './types' or '@/types' or '../types/index'

export default function AllCars() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { isRTL, rtlStyle, getFlexDirection } = useRTL();
  const [cars, setCars] = useState<Car[]>([]);

  // Initialize search state with 'location' as an empty string,
  // but ensure it's explicitly typed to allow for array as well.
  const [search, setSearch] = useState<SearchValue>({
    // Explicitly use the defined SearchValue interface
    make: "",
    model: "",
    location: [], // Initialized as an empty string for the single search bar context
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
  const [refreshing, setRefreshing] = useState(false);
  const [wishlist, setWishlist] = useState<
    { carId: string; wishlistId: string }[]
  >([]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isArabic = i18n.language === "ar";

  useEffect(() => {
    // When the component mounts or auth changes, reset search to its initial state.
    // Set location to an empty string to match the default behavior of the InlineSearchBar
    // when no specific location is selected, but it can later be updated to an array.
    setSearch({
      make: "",
      model: "",
      location: [], // Reset to empty string
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
    fetchAllCars();
    if (isAuthenticated && user?._id) {
      fetchWishlist();
    }
  }, [isAuthenticated, user?._id]);

  const fetchAllCars = async () => {
    try {
      setLoading(true);
      const response = await getCars();
      const data = response.data?.data || response.data;
      const carArray = Array.isArray(data) ? data : [];
      setCars(carArray);
      setError(null);
    } catch (error: any) {
      console.error("AllCars: Error fetching cars:", error);
      setCars([]);
      setError(error.message || t("failedToFetchCars"));

      showToastable({
        message: t("failedToFetchCars"),
        status: "warning",
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    if (!user?._id) return;
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
      setWishlist(wishlistItems);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("AllCars: Error fetching wishlist:", error);
      }
      setWishlist([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAllCars(),
      isAuthenticated && user?._id ? fetchWishlist() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  const handleAddToWishlist = async (carId: string) => {
    if (!isAuthenticated || !user?._id) {
      showToastable({
        message: t("please_login_to_wishlist"),
        status: "warning",
        duration: 2000,
      });
      router.push("/login");
      return;
    }

    try {
      const wishlistItem = wishlist.find((item) => item.carId === carId);
      if (wishlistItem) {
        showToastable({
          message: t("already_in_wishlist"),
          status: "success",
          duration: 2000,
        });
        return;
      }

      const { exists } = await checkWishlist(carId, user._id);
      if (exists) {
        showToastable({
          message: t("already_in_wishlist"),
          status: "success",
          duration: 2000,
        });
        await fetchWishlist();
        return;
      }

      const response = await addToWishlist(carId);
      const newWishlistItem = response.data?.data;
      if (newWishlistItem?._id) {
        setWishlist([...wishlist, { carId, wishlistId: newWishlistItem._id }]);

        showToastable({
          message: t("addedToWishlist"),
          status: "success",
          duration: 2000,
        });
      }
    } catch (error: any) {
      console.error("AllCars: Error adding to wishlist:", error);
      if (
        error.response?.status === 400 &&
        error.response?.data?.message === "Car already in wishlist"
      ) {
        showToastable({
          message: t("already_in_wishlist"),
          status: "success",
          duration: 2000,
        });
        await fetchWishlist();
      } else {
        showToastable({
          message: t("failedToAddWishlist"),
          status: "warning",
          duration: 2000,
        });
      }
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
        let searchMake = search.make.toLowerCase();
        let searchModel = search.model.toLowerCase();
        // REMOVED: `let searchLocation = search.location.toLowerCase();` as search.location is now an array.

        if (isArabic && searchMake) {
          searchMake = findEnglishMake(searchMake).toLowerCase();
        }

        if (isArabic && searchModel && searchMake) {
          searchModel = findEnglishModel(
            searchModel,
            search.make
          ).toLowerCase();
        }

        // --- UPDATED LOCATION FILTERING LOGIC ---
        const carLocation = car.location?.toLowerCase() || "";
        let locationMatch = true; // Assume true if no locations are selected in the filter

        if (Array.isArray(search.location) && search.location.length > 0) {
          // If there are selected locations, check if the car's location matches any of them
          locationMatch = search.location.some((selectedLoc) => {
            let processedSelectedLoc = selectedLoc.toLowerCase();
            // Optional: If you need to translate selectedLoc from Arabic to English for comparison
            if (isArabic) {
              const locationObj = locations.find(
                (loc) =>
                  loc.arValue?.toLowerCase() === selectedLoc.toLowerCase()
              );
              if (locationObj) {
                processedSelectedLoc = locationObj.value.toLowerCase();
              }
            }
            return carLocation.includes(processedSelectedLoc);
          });
        }
        // --- END UPDATED LOCATION FILTERING LOGIC ---
        const carMake = car.make?.toLowerCase() || ""; // ADD THIS LINE
        const carModel = car.model?.toLowerCase() || "";
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

        const makeMatch = !searchMake || carMake.includes(searchMake);
        const modelMatch = !searchModel || carModel.includes(searchModel);
        // `locationMatch` is now handled by the updated logic above

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
          locationMatch && // This is the updated location match
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
      <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
        {/* <Text style={[styles.headerTitle, rtlStyle]}>
          {t("all_available_cars")}
        </Text> */}
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <InlineSearchBar
          value={search}
          onChange={setSearch} // This onChange expects SearchValue which now has location: string | string[]
          placeholder={t("Find Your Perfect Car")}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#b80200" />
            <Text style={[styles.noResults, rtlStyle]}>{t("loading")}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.noResults, rtlStyle]}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchAllCars}>
              <Text style={[styles.retryButtonText, rtlStyle]}>
                {t("retry")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : cars.length === 0 ? (
          <Text style={[styles.noResults, rtlStyle]}>{t("noCars")}</Text>
        ) : filteredCars.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={[styles.noResults, rtlStyle]}>
              {t("noResults", {
                // Correctly display search.location for the "no results" message
                search: Array.isArray(search.location)
                  ? search.location.join(", ") // If it's an array, join elements
                  : search.make || search.model || search.location, // Otherwise, use the string or other fallbacks
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
                <CarCard
                  car={item}
                  onPress={() => router.push(`/car-details?carId=${item._id}`)}
                  onWishlist={() => handleAddToWishlist(item._id)}
                  isWishlisted={!!wishlistItem}
                  isAuthenticated={isAuthenticated}
                />
              );
            }}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
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
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
    paddingVertical: 15,
    textAlign: "center",
    paddingHorizontal: 15,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  listContent: {
    paddingBottom: 20,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#ffffff",
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#313332",
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
// import { Ionicons } from "@expo/vector-icons";
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
// import CarCard from "../components/CarCard";
// import InlineSearchBar from "../components/InlineSearchBar";
// import { useAuth } from "../contexts/AuthContext";
// import { useRTL } from "../hooks/useRTL";
// import type { Car } from "../types";
// import {
//   addToWishlist,
//   checkWishlist,
//   getCars,
//   getWishlistByUserId,
// } from "../utils/api";
// import { arabicMakes, locations, makes } from "../utils/constants";

// export default function AllCars() {
//   const { t, i18n } = useTranslation();
//   const { isAuthenticated, user } = useAuth();
//   const { isRTL, rtlStyle, getFlexDirection } = useRTL();
//   const [cars, setCars] = useState<Car[]>([]);
//   const [search, setSearch] = useState({
//     make: "",
//     model: "",
//     location: "",
//     cylinder: "",
//     transmission: "",
//     fuelType: "",
//     exteriorColor: "",
//     interiorColor: "",
//     priceMin: "",
//     priceMax: "",
//     yearMin: "",
//     yearMax: "",
//     kilometerMin: "",
//     kilometerMax: "",
//   });
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [wishlist, setWishlist] = useState<
//     { carId: string; wishlistId: string }[]
//   >([]);
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const isArabic = i18n.language === "ar";

//   useEffect(() => {
//     setSearch({
//       make: "",
//       model: "",
//       location: "",
//       cylinder: "",
//       transmission: "",
//       fuelType: "",
//       exteriorColor: "",
//       interiorColor: "",
//       priceMin: "",
//       priceMax: "",
//       yearMin: "",
//       yearMax: "",
//       kilometerMin: "",
//       kilometerMax: "",
//     });
//     fetchAllCars();
//     if (isAuthenticated && user?._id) {
//       fetchWishlist();
//     }
//   }, [isAuthenticated, user?._id]);

//   const fetchAllCars = async () => {
//     try {
//       setLoading(true);
//       const response = await getCars();
//       const data = response.data?.data || response.data;
//       const carArray = Array.isArray(data) ? data : [];
//       setCars(carArray);
//       setError(null);
//     } catch (error: any) {
//       console.error("AllCars: Error fetching cars:", error);
//       setCars([]);
//       setError(error.message || t("failedToFetchCars"));

//       showToastable({
//         message: t("failedToFetchCars"),
//         status: "warning",
//         duration: 2000,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchWishlist = async () => {
//     if (!user?._id) return;
//     try {
//       const response = await getWishlistByUserId(user._id);
//       const wishlistData = response.data?.data || response.data;
//       const wishlistItems = Array.isArray(wishlistData)
//         ? wishlistData
//             .map((item: any) => ({
//               carId: item.car?._id || item.carId,
//               wishlistId: item._id,
//             }))
//             .filter((item) => item.carId && item.wishlistId)
//         : [];
//       setWishlist(wishlistItems);
//     } catch (error: any) {
//       if (error.response?.status !== 404) {
//         console.error("AllCars: Error fetching wishlist:", error);
//       }
//       setWishlist([]);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await Promise.all([
//       fetchAllCars(),
//       isAuthenticated && user?._id ? fetchWishlist() : Promise.resolve(),
//     ]);
//     setRefreshing(false);
//   };

//   const handleAddToWishlist = async (carId: string) => {
//     if (!isAuthenticated || !user?._id) {
//       showToastable({
//         message: t("please_login_to_wishlist"),
//         status: "warning",
//         duration: 2000,
//       });
//       router.push("/login");
//       return;
//     }

//     try {
//       const wishlistItem = wishlist.find((item) => item.carId === carId);
//       if (wishlistItem) {
//         showToastable({
//           message: t("already_in_wishlist"),
//           status: "success",
//           duration: 2000,
//         });
//         return;
//       }

//       const { exists } = await checkWishlist(carId, user._id);
//       if (exists) {
//         showToastable({
//           message: t("already_in_wishlist"),
//           status: "success",
//           duration: 2000,
//         });
//         await fetchWishlist();
//         return;
//       }

//       const response = await addToWishlist(carId);
//       const newWishlistItem = response.data?.data;
//       if (newWishlistItem?._id) {
//         setWishlist([...wishlist, { carId, wishlistId: newWishlistItem._id }]);

//         showToastable({
//           message: t("addedToWishlist"),
//           status: "success",
//           duration: 2000,
//         });
//       }
//     } catch (error: any) {
//       console.error("AllCars: Error adding to wishlist:", error);
//       if (
//         error.response?.status === 400 &&
//         error.response?.data?.message === "Car already in wishlist"
//       ) {
//         showToastable({
//           message: t("already_in_wishlist"),
//           status: "success",
//           duration: 2000,
//         });
//         await fetchWishlist();
//       } else {
//         showToastable({
//           message: t("failedToAddWishlist"),
//           status: "warning",
//           duration: 2000,
//         });
//       }
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
//         const carCylinder = car.engineSize?.toLowerCase() || "";
//         const carTransmission = car.transmission?.toLowerCase() || "";
//         const carFuelType = car.fuelType?.toLowerCase() || "";
//         const carExteriorColor = car.exteriorColor?.toLowerCase() || "";
//         const carInteriorColor = car.interiorColor?.toLowerCase() || "";
//         const carYear = Number.parseInt(car.year || "0");
//         const carKilometer = Number.parseInt(
//           car.kilometer?.replace(/,/g, "") || "0"
//         );

//         // Basic filters
//         const makeMatch = !searchMake || carMake.includes(searchMake);
//         const modelMatch = !searchModel || carModel.includes(searchModel);
//         const locationMatch =
//           !searchLocation || carLocation.includes(searchLocation);

//         // Additional filters
//         const cylinderMatch =
//           !search.cylinder ||
//           carCylinder.includes(search.cylinder.toLowerCase());
//         const transmissionMatch =
//           !search.transmission ||
//           carTransmission.includes(search.transmission.toLowerCase());
//         const fuelTypeMatch =
//           !search.fuelType ||
//           carFuelType.includes(search.fuelType.toLowerCase());
//         const exteriorColorMatch =
//           !search.exteriorColor ||
//           carExteriorColor.includes(search.exteriorColor.toLowerCase());
//         const interiorColorMatch =
//           !search.interiorColor ||
//           carInteriorColor.includes(search.interiorColor.toLowerCase());

//         // Range filters
//         const yearMinMatch =
//           !search.yearMin || carYear >= Number.parseInt(search.yearMin);
//         const yearMaxMatch =
//           !search.yearMax || carYear <= Number.parseInt(search.yearMax);
//         const kilometerMinMatch =
//           !search.kilometerMin ||
//           carKilometer >= Number.parseInt(search.kilometerMin);
//         const kilometerMaxMatch =
//           !search.kilometerMax ||
//           carKilometer <= Number.parseInt(search.kilometerMax);

//         return (
//           makeMatch &&
//           modelMatch &&
//           locationMatch &&
//           cylinderMatch &&
//           transmissionMatch &&
//           fuelTypeMatch &&
//           exteriorColorMatch &&
//           interiorColorMatch &&
//           yearMinMatch &&
//           yearMaxMatch &&
//           kilometerMinMatch &&
//           kilometerMaxMatch
//         );
//       })
//     : [];

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => router.back()}
//         >
//           <Ionicons
//             name={isRTL ? "arrow-forward" : "arrow-back"}
//             size={24}
//             color="#ffffff"
//           />
//         </TouchableOpacity>
//         <Text style={[styles.headerTitle, rtlStyle]}>
//           {t("all_available_cars")}
//         </Text>
//         <View style={styles.headerSpacer} />
//       </View>

//       <View style={styles.content}>
//         <InlineSearchBar
//           value={search}
//           onChange={setSearch}
//           placeholder={t("Find Your Perfect Car")}
//         />

//         {loading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#b80200" />
//             <Text style={[styles.noResults, rtlStyle]}>{t("loading")}</Text>
//           </View>
//         ) : error ? (
//           <View style={styles.errorContainer}>
//             <Text style={[styles.noResults, rtlStyle]}>{error}</Text>
//             <TouchableOpacity style={styles.retryButton} onPress={fetchAllCars}>
//               <Text style={[styles.retryButtonText, rtlStyle]}>
//                 {t("retry")}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         ) : cars.length === 0 ? (
//           <Text style={[styles.noResults, rtlStyle]}>{t("noCars")}</Text>
//         ) : filteredCars.length === 0 ? (
//           <View style={styles.noResultsContainer}>
//             <Text style={[styles.noResults, rtlStyle]}>
//               {t("noResults", {
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
//                 <CarCard
//                   car={item}
//                   onPress={() => router.push(`/car-details?carId=${item._id}`)}
//                   onWishlist={() => handleAddToWishlist(item._id)}
//                   isWishlisted={!!wishlistItem}
//                   isAuthenticated={isAuthenticated}
//                 />
//               );
//             }}
//             contentContainerStyle={styles.listContent}
//             refreshControl={
//               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//             }
//             initialNumToRender={10}
//             maxToRenderPerBatch={5}
//             windowSize={5}
//             removeClippedSubviews={true}
//           />
//         )}
//       </View>
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
//     // paddingVertical: 15,
//     alignItems: "center",
//     justifyContent: "space-between",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#ffffff",
//     flex: 1,
//     paddingVertical: 15,
//     textAlign: "center",
//     paddingHorizontal: 15,
//   },
//   headerSpacer: {
//     width: 40,
//   },
//   content: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//   },
//   listContent: {
//     paddingBottom: 20,
//   },
//   noResultsContainer: {
//     flex: 1, // Ensures the container takes up available height
//     justifyContent: "center", // Centers content vertically
//     alignItems: "center", // Crucial: Centers children horizontally within this container
//     paddingVertical: 30,
//     backgroundColor: "#ffffff", // Your current background
//   },
//   noResults: {
//     textAlign: "center",
//     marginTop: 20,
//     fontSize: 16,
//     color: "#313332",
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
