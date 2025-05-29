import * as ImagePicker from "expo-image-picker";
import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import LoginPrompt from "../../components/LoginPrompt";
import { AuthContext } from "../../contexts/AuthContext";
import { updateProfile } from "../../utils/api";

export default function Profile() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [password, setPassword] = useState("");
  const { t } = useTranslation();

  const pickImage = async () => {
    console.log("Profile: Requesting media library permission...");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("error"), t("mediaLibraryPermissionRequired"));
      return;
    }
    console.log("Profile: Opening image picker...");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;
      console.log("Profile: Selected image:", selectedImage);
      setProfileImage(selectedImage);
    }
  };

  const updateUserProfile = async () => {
    console.log("Profile: Updating profile...");
    const formData = new FormData();
    if (profileImage) {
      const file = {
        uri: profileImage,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any; // Type assertion for React Native file object
      formData.append("profileImage", file);
    }
    if (password) {
      formData.append("password", password);
    }
    try {
      await updateProfile(formData); // Your /api/users/profile
      console.log("Profile: Profile updated");
      Alert.alert(t("success"), t("profileUpdated"));
      setPassword("");
    } catch (error) {
      console.error("Profile: Error updating profile:", error);
      Alert.alert(t("error"), t("failedToUpdateProfile"));
    }
  };

  const handleLogout = async () => {
    console.log("Profile: Logging out...");
    try {
      await logout();
      console.log("Profile: Logged out");
      Alert.alert(t("success"), t("loggedOut"));
    } catch (error) {
      console.error("Profile: Error logging out:", error);
      Alert.alert(t("error"), t("failedToLogout"));
    }
  };

  if (!isAuthenticated) {
    console.log("Profile: User not authenticated, showing LoginPrompt");
    return <LoginPrompt />;
  }

  return (
    <View style={styles.container}>
      {profileImage ? (
        <Image source={{ uri: profileImage }} style={styles.image} />
      ) : (
        <Text>{t("noProfileImage")}</Text>
      )}
      <Button title={t("pickProfileImage")} onPress={pickImage} />
      <TextInput
        placeholder={t("newPassword")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title={t("updateProfile")} onPress={updateUserProfile} />
      <Button title={t("logout")} onPress={handleLogout} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, alignItems: "center" },
  image: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    width: "80%",
    borderRadius: 5,
  },
});
