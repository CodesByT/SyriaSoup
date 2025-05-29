import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import CarCard from "../../components/CarCard";
import LoginPrompt from "../../components/LoginPrompt";
import { AuthContext } from "../../contexts/AuthContext";
import { Car } from "../../types";
import { getWishlist, removeFromWishlist } from "../../utils/api";

export default function Favorites() {
  const [wishlist, setWishlist] = useState<Car[]>([]);
  const { isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("Favorites: Fetching wishlist...");
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const { data } = await getWishlist(); // Your /api/wishlist
      console.log("Favorites: Wishlist fetched:", data.length);
      setWishlist(data);
    } catch (error) {
      console.error("Favorites: Error fetching wishlist:", error);
      Alert.alert(t("error"), t("failedToFetchWishlist"));
    }
  };

  const handleRemoveFromWishlist = async (carId: string) => {
    try {
      await removeFromWishlist(carId); // Your /api/wishlist/:id
      console.log("Favorites: Removed car from wishlist:", carId);
      setWishlist(wishlist.filter((item) => item._id !== carId));
      Alert.alert(t("success"), t("removedFromWishlist"));
    } catch (error) {
      console.error("Favorites: Error removing from wishlist:", error);
      Alert.alert(t("error"), t("failedToRemoveFromWishlist"));
    }
  };

  if (!isAuthenticated) {
    console.log("Favorites: User not authenticated, showing LoginPrompt");
    return <LoginPrompt />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={wishlist}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <CarCard
            car={item}
            onPress={() => {
              console.log(
                "Favorites: Navigating to car-details with carId:",
                item._id
              );
              router.push(`/car-details?carId=${item._id}`);
            }}
            onWishlist={() => handleRemoveFromWishlist(item._id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
});
