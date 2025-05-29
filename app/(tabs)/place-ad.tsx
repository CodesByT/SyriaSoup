import * as ImagePicker from "expo-image-picker";
import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, ScrollView, StyleSheet, TextInput } from "react-native";
import LoginPrompt from "../../components/LoginPrompt";
import { AuthContext } from "../../contexts/AuthContext";
import { addCar } from "../../utils/api";

interface CarFormData {
  make: string;
  model: string;
  priceUSD: string;
  priceSYP: string;
  year: string;
  kilometer: string;
  engineSize: string;
  location: string;
  transmission: string;
  fuelType: string;
  exteriorColor: string;
  interiorColor: string;
  features: string[];
  description: string;
}

export default function PlaceAd() {
  const { isAuthenticated } = useContext(AuthContext);
  const { t } = useTranslation();
  const [carData, setCarData] = useState<CarFormData>({
    make: "",
    model: "",
    priceUSD: "",
    priceSYP: "",
    year: "",
    kilometer: "",
    engineSize: "",
    location: "",
    transmission: "",
    fuelType: "",
    exteriorColor: "",
    interiorColor: "",
    features: [],
    description: "",
  });
  const [images, setImages] = useState<string[]>([]);

  const pickImage = async () => {
    console.log("PlaceAd: Requesting media library permission...");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("error"), t("mediaLibraryPermissionRequired"));
      return;
    }
    console.log("PlaceAd: Opening image picker...");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri);
      console.log("PlaceAd: Selected images:", selectedImages.length);
      setImages(selectedImages);
    }
  };

  const submitCar = async () => {
    console.log("PlaceAd: Submitting car listing...");
    const formData = new FormData();

    // Append car data
    (Object.keys(carData) as (keyof CarFormData)[]).forEach((key) => {
      if (key === "features") {
        carData.features.forEach((feature, index) => {
          formData.append(`features[${index}]`, feature);
        });
      } else {
        formData.append(key, carData[key]);
      }
    });

    // Append images
    images.forEach((uri, index) => {
      const file = {
        uri,
        name: `image${index}.jpg`,
        type: "image/jpeg",
      } as any; // Type assertion for React Native file object
      formData.append("images", file);
    });

    try {
      await addCar(formData); // Your /api/cars
      console.log("PlaceAd: Car listing created");
      Alert.alert(t("success"), t("carListingCreated"));
      // Reset form
      setCarData({
        make: "",
        model: "",
        priceUSD: "",
        priceSYP: "",
        year: "",
        kilometer: "",
        engineSize: "",
        location: "",
        transmission: "",
        fuelType: "",
        exteriorColor: "",
        interiorColor: "",
        features: [],
        description: "",
      });
      setImages([]);
    } catch (error) {
      console.error("PlaceAd: Error adding car:", error);
      Alert.alert(t("error"), t("failedToCreateCar"));
    }
  };

  if (!isAuthenticated) {
    console.log("PlaceAd: User not authenticated, showing LoginPrompt");
    return <LoginPrompt />;
  }

  return (
    <ScrollView style={styles.container}>
      <TextInput
        placeholder={t("make")}
        value={carData.make}
        onChangeText={(text) => setCarData({ ...carData, make: text })}
        style={styles.input}
      />
      <TextInput
        placeholder={t("model")}
        value={carData.model}
        onChangeText={(text) => setCarData({ ...carData, model: text })}
        style={styles.input}
      />
      <TextInput
        placeholder={t("priceUSD")}
        value={carData.priceUSD}
        onChangeText={(text) => setCarData({ ...carData, priceUSD: text })}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder={t("priceSYP")}
        value={carData.priceSYP}
        onChangeText={(text) => setCarData({ ...carData, priceSYP: text })}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder={t("year")}
        value={carData.year}
        onChangeText={(text) => setCarData({ ...carData, year: text })}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder={t("kilometer")}
        value={carData.kilometer}
        onChangeText={(text) => setCarData({ ...carData, kilometer: text })}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder={t("engineSize")}
        value={carData.engineSize}
        onChangeText={(text) => setCarData({ ...carData, engineSize: text })}
        style={styles.input}
      />
      <TextInput
        placeholder={t("location")}
        value={carData.location}
        onChangeText={(text) => setCarData({ ...carData, location: text })}
        style={styles.input}
      />
      <TextInput
        placeholder={t("transmission")}
        value={carData.transmission}
        onChangeText={(text) => setCarData({ ...carData, transmission: text })}
        style={styles.input}
      />
      <TextInput
        placeholder={t("fuelType")}
        value={carData.fuelType}
        onChangeText={(text) => setCarData({ ...carData, fuelType: text })}
        style={styles.input}
      />
      <TextInput
        placeholder={t("exteriorColor")}
        value={carData.exteriorColor}
        onChangeText={(text) => setCarData({ ...carData, exteriorColor: text })}
        style={styles.input}
      />
      <TextInput
        placeholder={t("interiorColor")}
        value={carData.interiorColor}
        onChangeText={(text) => setCarData({ ...carData, interiorColor: text })}
        style={styles.input}
      />
      <TextInput
        placeholder={t("features")}
        value={carData.features.join(",")}
        onChangeText={(text) =>
          setCarData({
            ...carData,
            features: text.split(",").map((f) => f.trim()),
          })
        }
        style={styles.input}
      />
      <TextInput
        placeholder={t("description")}
        value={carData.description}
        onChangeText={(text) => setCarData({ ...carData, description: text })}
        multiline
        style={styles.input}
      />
      <Button title={t("pickImages")} onPress={pickImage} />
      <Button title={t("submit")} onPress={submitCar} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  input: { borderWidth: 1, padding: 10, marginVertical: 5, borderRadius: 5 },
});
