import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CarCardGrid from "../../components/CarCardGrid"; // Renamed import
import SearchBar from "../../components/SearchBar";
import { Car } from "../../types";
import { addToWishlist, getCars } from "../../utils/api";

export default function Home() {
  const { t } = useTranslation();
  const [cars, setCars] = useState<Car[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("Home: Fetching recent cars...");
    setSearch("");
    fetchRecentCars();
  }, []);

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

      console.log(
        "Home: Recent cars:",
        recentCars.map((car) => ({
          _id: car._id,
          make: car.make,
          model: car.model,
          createdAt: car.createdAt,
        }))
      );

      setCars(recentCars);
      setError(null);
    } catch (error: any) {
      console.error("Home: Error fetching cars:", error);
      setCars([]);
      setError(error.message || t("failedToFetchCars"));
      Alert.alert(t("error"), error.message || t("failedToCars"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWishlist = async (carId: string) => {
    try {
      await addToWishlist(carId);
      console.log("Home: Added car to wishlist:", carId);
      Alert.alert(t("success"), t("addedToWishlist"));
      // Optionally notify Favorites screen to refetch
    } catch (error) {
      console.error("Home: Error adding to wishlist:", error);
      Alert.alert(t("error"), t("failedToAddWishlist"));
    }
  };

  const filteredCars = Array.isArray(cars)
    ? cars.filter((car) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        const make = car.make?.toLowerCase() || "";
        const model = car.model?.toLowerCase() || "";
        const location = car.location?.toLowerCase() || "";
        const makeMatch = make.includes(searchLower);
        const modelMatch = model.includes(searchLower);
        const locationMatch = location.includes(searchLower);
        console.log("Home: Filtering car:", car._id, {
          make,
          model,
          location,
          searchLower,
          makeMatch,
          modelMatch,
          locationMatch,
        });
        return makeMatch || modelMatch || locationMatch;
      })
    : [];

  console.log(
    "Home: Total cars:",
    cars.length,
    "Filtered cars:",
    filteredCars.length
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t("SyriaSouq")}</Text>
      </View>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t("Find Your Perfect Car")}
      />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("Recent Listings")}</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push("/all-cars")}
        >
          <Text style={styles.viewAllText}>{t("View All")}</Text>
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
          <Button
            title={t("retry")}
            onPress={fetchRecentCars}
            color="#b80200"
          />
        </View>
      ) : filteredCars.length === 0 ? (
        <Text style={styles.noResults}>{t("noResults", { search })}</Text>
      ) : (
        <FlatList
          data={filteredCars}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <CarCardGrid // Renamed component usage
              car={item}
              onPress={() => router.push(`/car-details?carId=${item._id}`)}
              onWishlist={() => handleAddToWishlist(item._id)}
            />
          )}
          numColumns={2}
          columnWrapperStyle={styles.row}
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
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "600",
    color: "#313332",
  },
  viewAllButton: {
    backgroundColor: "#b80200",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

//-----------------------------------------------------
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   Alert,
//   Button,
//   FlatList,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import CarCard from "../../components/CarCard";
// import SearchBar from "../../components/SearchBar";
// import { Car } from "../../types";
// import { addToWishlist, getCars } from "../../utils/api";

// export default function Home() {
//   const { t } = useTranslation();
//   const [cars, setCars] = useState<Car[]>([]);
//   const [search, setSearch] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     console.log("Home: Fetching recent cars...");
//     setSearch("");
//     fetchRecentCars();
//   }, []);

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

//       console.log(
//         "Home: Recent cars:",
//         recentCars.map((car) => ({
//           _id: car._id,
//           make: car.make,
//           model: car.model,
//           createdAt: car.createdAt,
//         }))
//       );

//       setCars(recentCars);
//       setError(null);
//     } catch (error: any) {
//       console.error("Home: Error fetching cars:", error);
//       setCars([]);
//       setError(error.message || t("failedToFetchCars"));
//       Alert.alert(t("error"), error.message || t("failedToFetchCars"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddToWishlist = async (carId: string) => {
//     try {
//       await addToWishlist(carId);
//       console.log("Home: Added car to wishlist:", carId);
//       Alert.alert(t("success"), t("addedToWishlist"));
//       // Optionally notify Favorites screen to refetch
//     } catch (error) {
//       console.error("Home: Error adding to wishlist:", error);
//       Alert.alert(t("error"), t("failedToAddWishlist"));
//     }
//   };

//   const filteredCars = Array.isArray(cars)
//     ? cars.filter((car) => {
//         if (!search) return true;
//         const searchLower = search.toLowerCase();
//         const make = car.make?.toLowerCase() || "";
//         const model = car.model?.toLowerCase() || "";
//         const location = car.location?.toLowerCase() || "";
//         const makeMatch = make.includes(searchLower);
//         const modelMatch = model.includes(searchLower);
//         const locationMatch = location.includes(searchLower);
//         console.log("Home: Filtering car:", car._id, {
//           make,
//           model,
//           location,
//           searchLower,
//           makeMatch,
//           modelMatch,
//           locationMatch,
//         });
//         return makeMatch || modelMatch || locationMatch;
//       })
//     : [];

//   console.log(
//     "Home: Total cars:",
//     cars.length,
//     "Filtered cars:",
//     filteredCars.length
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerText}>{t("SyriaSouq")}</Text>
//       </View>
//       <SearchBar
//         value={search}
//         onChange={setSearch}
//         placeholder={t("Find Your Perfect Car")}
//       />
//       <View style={styles.sectionHeader}>
//         <Text style={styles.sectionTitle}>{t("Recent Listings")}</Text>
//         <TouchableOpacity
//           style={styles.viewAllButton}
//           onPress={() => router.push("/all-cars")}
//         >
//           <Text style={styles.viewAllText}>{t("View All")}</Text>
//         </TouchableOpacity>
//       </View>
//       {loading ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#b80200" />
//           <Text style={styles.noResults}>{t("loading")}</Text>
//         </View>
//       ) : error ? (
//         <View style={styles.errorContainer}>
//           <Text style={styles.noResults}>{error}</Text>
//           <Button
//             title={t("retry")}
//             onPress={fetchRecentCars}
//             color="#b80200"
//           />
//         </View>
//       ) : filteredCars.length === 0 ? (
//         <Text style={styles.noResults}>{t("noResults", { search })}</Text>
//       ) : (
//         <FlatList
//           data={filteredCars}
//           keyExtractor={(item) => item._id}
//           renderItem={({ item }) => (
//             <CarCard
//               car={item}
//               onPress={() => router.push(`/car-details?carId=${item._id}`)}
//               onWishlist={() => handleAddToWishlist(item._id)}
//             />
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
//     alignItems: "center",
//   },
//   headerText: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#ffffff",
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "#ffffff",
//   },
//   sectionTitle: {
//     fontSize: 25,
//     fontWeight: "600",
//     color: "#313332",
//   },
//   viewAllButton: {
//     backgroundColor: "#b80200",
//     paddingVertical: 5,
//     paddingHorizontal: 10,
//     borderRadius: 5,
//   },
//   viewAllText: {
//     color: "#ffffff",
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   listContent: {
//     paddingBottom: 20,
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
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
// });
//------------------------------------------------------------------
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   Alert,
//   Button,
//   FlatList,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import CarCard from "../../components/CarCard";
// import SearchBar from "../../components/SearchBar";
// import { Car } from "../../types";
// import { addToWishlist, getCars } from "../../utils/api";

// export default function Home() {
//   const { t } = useTranslation();
//   const [cars, setCars] = useState<Car[]>([]);
//   const [search, setSearch] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     console.log("Home: Fetching recent cars...");
//     setSearch("");
//     fetchRecentCars();
//   }, []);

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

//       console.log(
//         "Home: Recent cars:",
//         recentCars.map((car) => ({
//           _id: car._id,
//           make: car.make,
//           model: car.model,
//           createdAt: car.createdAt,
//         }))
//       );

//       setCars(recentCars);
//       setError(null);
//     } catch (error: any) {
//       console.error("Home: Error fetching cars:", error);
//       setCars([]);
//       setError(error.message || t("failedToFetchCars"));
//       Alert.alert(t("error"), error.message || t("failedToFetchCars"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddToWishlist = async (carId: string) => {
//     try {
//       await addToWishlist(carId);
//       console.log("Home: Added car to wishlist:", carId);
//       Alert.alert(t("success"), t("addedToWishlist"));
//     } catch (error) {
//       console.error("Home: Error adding to wishlist:", error);
//       Alert.alert(t("error"), t("failedToAddWishlist"));
//     }
//   };

//   const filteredCars = Array.isArray(cars)
//     ? cars.filter((car) => {
//         if (!search) return true;
//         const searchLower = search.toLowerCase();
//         const make = car.make?.toLowerCase() || "";
//         const model = car.model?.toLowerCase() || "";
//         const location = car.location?.toLowerCase() || "";
//         const makeMatch = make.includes(searchLower);
//         const modelMatch = model.includes(searchLower);
//         const locationMatch = location.includes(searchLower);
//         console.log("Home: Filtering car:", car._id, {
//           make,
//           model,
//           location,
//           searchLower,
//           makeMatch,
//           modelMatch,
//           locationMatch,
//         });
//         return makeMatch || modelMatch || locationMatch;
//       })
//     : [];

//   console.log(
//     "Home: Total cars:",
//     cars.length,
//     "Filtered cars:",
//     filteredCars.length
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerText}>{t("SyriaSouq")}</Text>
//       </View>
//       <SearchBar
//         value={search}
//         onChange={setSearch}
//         placeholder={t("Find Your Perfect Car")}
//       />
//       <View style={styles.sectionHeader}>
//         <Text style={styles.sectionTitle}>{t("Recent Listings")}</Text>
//         <TouchableOpacity
//           style={styles.viewAllButton}
//           onPress={() => router.push("/all-cars")}
//         >
//           <Text style={styles.viewAllText}>{t("View All")}</Text>
//         </TouchableOpacity>
//       </View>
//       {loading ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#b80200" />
//           <Text style={styles.noResults}>{t("loading")}</Text>
//         </View>
//       ) : error ? (
//         <View style={styles.errorContainer}>
//           <Text style={styles.noResults}>{error}</Text>
//           <Button
//             title={t("retry")}
//             onPress={fetchRecentCars}
//             color="#b80200"
//           />
//         </View>
//       ) : filteredCars.length === 0 ? (
//         <Text style={styles.noResults}>{t("noResults", { search })}</Text>
//       ) : (
//         <FlatList
//           data={filteredCars}
//           keyExtractor={(item) => item._id}
//           renderItem={({ item }) => (
//             <CarCard
//               car={item}
//               onPress={() => router.push(`/car-details?carId=${item._id}`)}
//               onWishlist={() => handleAddToWishlist(item._id)}
//             />
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
//     alignItems: "center",
//   },
//   headerText: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#ffffff",
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "#ffffff",
//   },
//   sectionTitle: {
//     fontSize: 25,
//     fontWeight: "600",
//     color: "#313332",
//   },
//   viewAllButton: {
//     backgroundColor: "#b80200",
//     paddingVertical: 5,
//     paddingHorizontal: 10,
//     borderRadius: 5,
//   },
//   viewAllText: {
//     color: "#ffffff",
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   listContent: {
//     paddingBottom: 20,
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
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
// });
