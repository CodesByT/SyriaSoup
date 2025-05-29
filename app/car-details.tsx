import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Car, User } from "../types";
import { getCarById, getUserById } from "../utils/api";

export default function CarDetails() {
  const [car, setCar] = useState<Car | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (carId) {
      console.log("CarDetails: Fetching car with carId:", carId);
      fetchCarAndSeller();
    }
  }, [carId]);

  const fetchCarAndSeller = async () => {
    try {
      // Fetch car details
      const { data: carData } = await getCarById(carId); // Your /api/cars/:id
      console.log("CarDetails: Car fetched:", carData._id);
      setCar(carData);

      // Fetch seller details using user ID
      if (carData.user) {
        const { data: userData } = await getUserById(carData.user); // Your /api/users/:id
        console.log("CarDetails: Seller fetched:", userData._id);
        setSeller(userData);
      }
    } catch (error) {
      console.error("CarDetails: Error fetching car or seller:", error);
      Alert.alert(t("error"), t("failedToFetchCarDetails"));
    }
  };

  const startChat = () => {
    if (car?.user) {
      console.log(
        "CarDetails: Navigating to chat-detail with userId:",
        car.user
      );
      //   router.push(`/chat-detail?userId=${car.user}`);
    } else {
      Alert.alert(t("error"), t("noSellerAvailable"));
    }
  };

  const callSeller = () => {
    if (seller?.phone) {
      console.log("CarDetails: Calling seller with phone:", seller.phone);
      Linking.openURL(`tel:${seller.phone}`).catch(() => {
        Alert.alert(t("error"), t("failedToCallSeller"));
      });
    } else {
      console.log("CarDetails: No seller phone available");
      Alert.alert(t("error"), t("noSellerPhone"));
    }
  };

  const whatsappSeller = () => {
    if (seller?.phone) {
      console.log("CarDetails: Opening WhatsApp with phone:", seller.phone);
      Linking.openURL(`whatsapp://send?phone=${seller.phone}`).catch(() => {
        Alert.alert(t("error"), t("failedToOpenWhatsApp"));
      });
    } else {
      console.log("CarDetails: No seller phone available");
      Alert.alert(t("error"), t("noSellerPhone"));
    }
  };

  if (!car) {
    return (
      <View style={styles.container}>
        <Text>{t("loading")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: car.images[0] }} style={styles.image} />
      <Text style={styles.title}>{`${car.make} ${car.model} ${car.year}`}</Text>
      <Text>{`${t("price")}: $${car.priceUSD} / SYP ${car.priceSYP}`}</Text>
      <Text>{`${t("location")}: ${car.location}`}</Text>
      <Text>{`${t("kilometer")}: ${car.kilometer}`}</Text>
      <Text>{`${t("engineSize")}: ${car.engineSize}`}</Text>
      <Text>{`${t("transmission")}: ${car.transmission}`}</Text>
      <Text>{`${t("fuelType")}: ${car.fuelType}`}</Text>
      <Text>{`${t("exteriorColor")}: ${car.exteriorColor}`}</Text>
      <Text>{`${t("interiorColor")}: ${car.interiorColor}`}</Text>
      <Text>{`${t("features")}: ${car.features.join(", ")}`}</Text>
      <Text>{`${t("description")}: ${car.description}`}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity onPress={startChat} style={styles.button}>
          <Text>{t("chat")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={callSeller} style={styles.button}>
          <Text>{t("call")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={whatsappSeller} style={styles.button}>
          <Text>{t("whatsapp")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  image: { width: "100%", height: 200, borderRadius: 10 },
  title: { fontSize: 20, fontWeight: "bold", marginVertical: 10 },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  button: { backgroundColor: "#007bff", padding: 10, borderRadius: 5 },
});
