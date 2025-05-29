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
  View,
} from "react-native";
import CarCard from "../components/CarCard";
import SearchBar from "../components/SearchBar";
import { Car } from "../types";
import { addToWishlist, getCars } from "../utils/api";

export default function AllCars() {
  const { t } = useTranslation();
  const [cars, setCars] = useState<Car[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("AllCars: Fetching all cars...");
    setSearch("");
    fetchAllCars();
  }, []);

  const fetchAllCars = async () => {
    try {
      setLoading(true);
      const response = await getCars();
      console.log(
        "AllCars: Raw API response:",
        JSON.stringify(response, null, 2)
      );
      const data = response.data?.data || response.data;
      console.log("AllCars: Extracted data:", JSON.stringify(data, null, 2));
      const carArray = Array.isArray(data) ? data : [];
      setCars(carArray);
      setError(null);
    } catch (error: any) {
      console.error("AllCars: Error fetching cars:", error);
      setCars([]);
      setError(error.message || t("failedToFetchCars"));
      Alert.alert(t("error"), error.message || t("failedToFetchCars"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWishlist = async (carId: string) => {
    try {
      await addToWishlist(carId);
      console.log("AllCars: Added car to wishlist:", carId);
      Alert.alert(t("success"), t("addedToWishlist"));
    } catch (error) {
      console.error("AllCars: Error adding to wishlist:", error);
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
        console.log("AllCars: Filtering car:", car._id, {
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
    "AllCars: Total cars:",
    cars.length,
    "Filtered cars:",
    filteredCars.length
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t("Car Listings")}</Text>
      </View>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t("Find Your Perfect Car")}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b80200" />
          <Text style={styles.noResults}>{t("loading")}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.noResults}>{error}</Text>
          <Button title={t("retry")} onPress={fetchAllCars} color="#b80200" />
        </View>
      ) : cars.length === 0 ? (
        <Text style={styles.noResults}>{t("noCars")}</Text>
      ) : filteredCars.length === 0 ? (
        <Text style={styles.noResults}>{t("noResults", { search })}</Text>
      ) : (
        <FlatList
          data={filteredCars}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <CarCard
              car={item}
              //   onPress={() => router.push(`/car-details?carId=${item._id}`)}
              onWishlist={() => handleAddToWishlist(item._id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
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
  listContent: {
    paddingBottom: 20,
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
