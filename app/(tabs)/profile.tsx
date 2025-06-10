"use client";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert, // Keep Alert for other uses if needed
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Snackbar from "react-native-snackbar";
import CarCard from "../../components/car-card";
import { useAuth } from "../../contexts/AuthContext";
import { useRTL } from "../../hooks/useRTL";
import type { Car } from "../../types";
import {
  deleteCar,
  getUserById,
  getUserListings,
  updateProfile,
  updateProfileImage,
} from "../../utils/api";

const { width, height } = Dimensions.get("window");

interface UserDetails {
  username: string;
  phone: string;
  profileImage: string;
}

interface FocusState {
  username: boolean;
  phone: boolean;
}

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { isRTL, rtlStyle, rtlViewStyle, getRTLStyle, getFlexDirection } =
    useRTL();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"profile" | "listings">("profile");
  const [userDetails, setUserDetails] = useState<UserDetails>({
    username: "",
    phone: "",
    profileImage: "",
  });
  const [listings, setListings] = useState<Car[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [imageUploading, setImageUploading] = useState<boolean>(false);
  const [focused, setFocused] = useState<FocusState>({
    username: false,
    phone: false,
  });
  // State for the custom logout modal
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      fetchUserDetails();
      fetchUserListings();
    }
  }, [isAuthenticated, user?._id]);

  const fetchUserDetails = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await getUserById(user!._id);
      const userData = response.data?.data || response.data;
      setUserDetails({
        username: userData.username || "",
        phone: userData.phone || "",
        profileImage: userData.profileImage || "",
      });
    } catch (error: any) {
      console.error("Profile: Error fetching user details:", error);
      Snackbar.show({
        text: t("failedToFetchProfile"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserListings = async (): Promise<void> => {
    try {
      const response = await getUserListings(user!._id);
      const listingsData = response.data?.data || response.data;
      setListings(Array.isArray(listingsData) ? listingsData : []);
    } catch (error: any) {
      console.error("Profile: Error fetching listings:", error);
      Snackbar.show({
        text: t("failedToFetchListings"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      });
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([fetchUserDetails(), fetchUserListings()]);
    setRefreshing(false);
  };

  const handleImagePick = async (): Promise<void> => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Snackbar.show({
        text: t("photoPermissionRequired"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImageUploading(true);
      try {
        const formData = new FormData();
        formData.append("profileImage", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "profile.jpg",
        } as any);
        const response = await updateProfileImage(user!._id, formData);
        setUserDetails({
          ...userDetails,
          profileImage: response.data.profileImage,
        });
        Snackbar.show({
          text: t("profileImageUpdated"),
          duration: 2000,
          backgroundColor: "green",
          textColor: "#FFFFFF",
        });
      } catch (error: any) {
        console.error("Profile: Error updating profile image:", error);
        Snackbar.show({
          text: t("failedToUpdateImage"),
          duration: 2000,
          backgroundColor: "#B80200",
          textColor: "#FFFFFF",
        });
      } finally {
        setImageUploading(false);
      }
    }
  };

  const handleSaveProfile = async (): Promise<void> => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", userDetails.username);
      formData.append("phone", userDetails.phone);

      await updateProfile(formData);
      setEditing(false);
      Snackbar.show({
        text: t("profileUpdated"),
        duration: 2000,
        backgroundColor: "green",
        textColor: "#FFFFFF",
      });
    } catch (error: any) {
      console.error("Profile: Error updating profile:", error);
      Snackbar.show({
        text: t("failedToUpdateProfile"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
      Snackbar.show({
        text: t("loggedOut"),
        duration: 2000,
        backgroundColor: "green",
        textColor: "#FFFFFF",
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Profile: Error logging out:", error);
      Snackbar.show({
        text: t("failedToLogout"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      });
    }
  };

  const changeLanguage = async (lang: "en" | "ar"): Promise<void> => {
    try {
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem("user-language", lang);
    } catch (error) {
      console.error("Error changing language:", error);
      Snackbar.show({
        text: t("languageChangeFailed"),
        duration: 2000,
        backgroundColor: "#B80200",
        textColor: "#FFFFFF",
      });
    }
  };

  const handleFocus = (field: keyof FocusState): void => {
    setFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof FocusState): void => {
    setFocused((prev) => ({ ...prev, [field]: false }));
  };

  const handleEditListing = (carId: string): void => {
    router.push(`/edit-listing?carId=${carId}`);
  };

  const handleViewListing = (carId: string): void => {
    router.push(`/car-details?carId=${carId}`);
  };

  const handleDeleteListing = (carId: string): void => {
    Alert.alert(t("confirmDelete"), t("deleteListingConfirmMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCar(carId);
            Snackbar.show({
              text: t("listingDeleted"),
              duration: 2000,
              backgroundColor: "green",
              textColor: "#FFFFFF",
            });
            fetchUserListings();
          } catch (error: any) {
            console.error("Profile: Error deleting listing:", error);
            Snackbar.show({
              text: t("failedToDeleteListing"),
              duration: 2000,
              backgroundColor: "#B80200",
              textColor: "#FFFFFF",
            });
          }
        },
      },
    ]);
  };

  const renderListingItem = ({ item }: { item: Car }) => (
    <CarCard
      car={item}
      onPress={() => handleViewListing(item._id)}
      onEdit={() => handleEditListing(item._id)}
      onDelete={() => handleDeleteListing(item._id)}
      showActions={true}
    />
  );

  const renderProfileContent = () => (
    <ScrollView style={styles.profileContent}>
      {/* Profile Image Section */}
      <View style={styles.profileImageSection}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={handleImagePick}
          disabled={imageUploading}
          activeOpacity={0.8}
        >
          {imageUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color="#B80200" size="large" />
            </View>
          ) : userDetails.profileImage ? (
            <Image
              source={{ uri: userDetails.profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={50} color="#999" />
            </View>
          )}
          <View style={styles.editImageOverlay}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.imageHint, rtlStyle]}>
          {t("tapToChangePhoto")}
        </Text>
      </View>

      {/* User Details Form */}
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, rtlStyle]}>{t("username")}</Text>
          <View
            style={[
              styles.inputContainer,
              { flexDirection: getFlexDirection() },
              focused.username && styles.inputFocused,
              !editing && styles.inputDisabled,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={focused.username ? "#B80200" : "#666"}
              style={[
                styles.inputIcon,
                isRTL && { marginRight: 0, marginLeft: 12 },
              ]}
            />
            <TextInput
              style={[styles.textInput, rtlStyle]}
              value={userDetails.username}
              onChangeText={(text) =>
                setUserDetails({ ...userDetails, username: text })
              }
              editable={editing}
              placeholder={t("enterUsername")}
              placeholderTextColor="#999"
              onFocus={() => handleFocus("username")}
              onBlur={() => handleBlur("username")}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, rtlStyle]}>{t("phoneNumber")}</Text>
          <View
            style={[
              styles.inputContainer,
              { flexDirection: getFlexDirection() },
              focused.phone && styles.inputFocused,
              !editing && styles.inputDisabled,
            ]}
          >
            <Ionicons
              name="call-outline"
              size={20}
              color={focused.phone ? "#B80200" : "#666"}
              style={[
                styles.inputIcon,
                isRTL && { marginRight: 0, marginLeft: 12 },
              ]}
            />
            <TextInput
              style={[styles.textInput, rtlStyle]}
              value={userDetails.phone}
              onChangeText={(text) =>
                setUserDetails({ ...userDetails, phone: text })
              }
              editable={editing}
              keyboardType="phone-pad"
              placeholder={t("enterPhoneNumber")}
              placeholderTextColor="#999"
              onFocus={() => handleFocus("phone")}
              onBlur={() => handleBlur("phone")}
            />
          </View>
        </View>

        {/* Edit/Save Button */}
        <TouchableOpacity
          style={[styles.actionButton, editing && styles.saveButton]}
          onPress={editing ? handleSaveProfile : () => setEditing(true)}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Ionicons
            name={editing ? "checkmark" : "create-outline"}
            size={20}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
          <Text style={styles.actionButtonText}>
            {editing ? t("saveProfile") : t("editProfile")}
          </Text>
        </TouchableOpacity>

        {editing && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setEditing(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, rtlStyle]}>
              {t("cancel")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* App Options */}
      <View style={styles.optionsContainer}>
        <Text style={[styles.sectionTitle, rtlStyle]}>{t("appSettings")}</Text>

        {/* Language Selection */}
        <View
          style={[styles.optionItem, { flexDirection: getFlexDirection() }]}
        >
          <View
            style={[styles.optionLeft, { flexDirection: getFlexDirection() }]}
          >
            <Ionicons name="language-outline" size={22} color="#B80200" />
            <Text
              style={[
                styles.optionText,
                rtlStyle,
                isRTL && { marginRight: 12, marginLeft: 0 },
              ]}
            >
              {t("language")}
            </Text>
          </View>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                i18n.language === "en" && styles.activeLanguage,
              ]}
              onPress={() => changeLanguage("en")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  i18n.language === "en" && styles.activeLanguageText,
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                i18n.language === "ar" && styles.activeLanguage,
              ]}
              onPress={() => changeLanguage("ar")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  i18n.language === "ar" && styles.activeLanguageText,
                ]}
              >
                AR
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Other Options */}
        {[
          { key: "aboutUs", icon: "information-circle-outline" },
          { key: "termsOfUse", icon: "document-text-outline" },
          { key: "privacyPolicy", icon: "shield-checkmark-outline" },
          { key: "contactUs", icon: "mail-outline" },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.optionItem, { flexDirection: getFlexDirection() }]}
            onPress={() =>
              Alert.alert(t(option.key), t(`${option.key}Content`))
            }
            activeOpacity={0.7}
          >
            <View
              style={[styles.optionLeft, { flexDirection: getFlexDirection() }]}
            >
              <Ionicons name={option.icon as any} size={22} color="#B80200" />
              <Text
                style={[
                  styles.optionText,
                  rtlStyle,
                  isRTL && { marginRight: 12, marginLeft: 0 },
                ]}
              >
                {t(option.key)}
              </Text>
            </View>
            <Ionicons
              name={isRTL ? "chevron-back" : "chevron-forward"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#FFFFFF"
          style={styles.buttonIcon}
        />
        <Text style={styles.logoutButtonText}>{t("logoutButton")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderListingsContent = () => (
    <View style={styles.listingsContainer}>
      {listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={60} color="#ccc" />
          <Text style={[styles.emptyStateTitle, rtlStyle]}>
            {t("noListings")}
          </Text>
          <Text style={[styles.emptyStateDescription, rtlStyle]}>
            {t("noListingsDescription")}
          </Text>
          <TouchableOpacity
            style={styles.addListingButton}
            onPress={() => router.push("./add-listing")}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addListingButtonText}>{t("addListing")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item._id}
          renderItem={renderListingItem}
          contentContainerStyle={styles.listingsContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.authContent}>
          <Ionicons name="person-circle-outline" size={80} color="#B80200" />
          <Text style={[styles.authTitle, rtlStyle]}>
            {t("accountRequired")}
          </Text>
          <Text style={[styles.authDescription, rtlStyle]}>
            {t("loginToAccessProfile")}
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.authButtonText}>{t("login")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1a1a1a"
        translucent={false}
      />

      {/* Header with Integrated Tab Navigation - ALWAYS LTR */}
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "profile" && styles.activeTab]}
            onPress={() => setActiveTab("profile")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={activeTab === "profile" ? "#B80200" : "#666"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "profile" && styles.activeTabText,
              ]}
            >
              {t("profileTab")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "listings" && styles.activeTab]}
            onPress={() => setActiveTab("listings")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="car-outline"
              size={20}
              color={activeTab === "listings" ? "#B80200" : "#666"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "listings" && styles.activeTabText,
              ]}
            >
              {t("myListingsTab")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {loading && !refreshing
          ? renderProfileContent()
          : activeTab === "profile"
          ? renderProfileContent()
          : renderListingsContent()}
      </View>

      {/* Custom Logout Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Ionicons name="log-out-outline" size={50} color="#B80200" />
            <Text style={[styles.modalTitle, rtlStyle]}>
              {t("confirmLogout")}
            </Text>
            <Text style={[styles.modalMessage, rtlStyle]}>
              {t("logoutConfirmMessage")}
            </Text>
            <View
              style={[
                styles.modalButtonContainer,
                { flexDirection: getFlexDirection("row") },
              ]}
            >
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>{t("logout")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: "row", // ALWAYS LTR for tabs
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row", // ALWAYS LTR for tabs
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "rgba(184, 2, 0, 0.1)",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#B80200",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  profileContent: {
    flex: 1,
    padding: 20,
  },
  listingsContainer: {
    flex: 1,
    padding: 20,
  },
  listingsContent: {
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  profileImageSection: {
    alignItems: "center",
    marginBottom: 25,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#B80200",
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  uploadingContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  editImageOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#B80200",
    borderRadius: 15,
    padding: 6,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  imageHint: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    marginLeft: 2,
  },
  inputContainer: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
  },
  inputFocused: {
    borderColor: "#B80200",
    backgroundColor: "#ffffff",
    shadowColor: "#B80200",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  actionButton: {
    backgroundColor: "#B80200",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#B80200",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
  buttonIcon: {
    marginRight: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: "transparent",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  optionsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 15,
  },
  optionItem: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionLeft: {
    alignItems: "center",
    gap: 12,
  },
  optionText: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  languageButtons: {
    flexDirection: "row",
    gap: 8,
  },
  languageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f9fa",
  },
  activeLanguage: {
    backgroundColor: "#B80200",
    borderColor: "#B80200",
  },
  languageButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  activeLanguageText: {
    color: "#ffffff",
  },
  logoutButton: {
    backgroundColor: "#B80200",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#B80200",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
    marginBottom: 30,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  addListingButton: {
    backgroundColor: "#B80200",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  addListingButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  authContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  authContent: {
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
  },
  authTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 20,
    marginBottom: 10,
  },
  authDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  authButton: {
    backgroundColor: "#B80200",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  authButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    width: "85%",
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginTop: 15,
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtonContainer: {
    justifyContent: "space-around",
    width: "100%",
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmButton: {
    backgroundColor: "#B80200",
  },
  modalCancelButton: {
    backgroundColor: "#6c6b6b",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

// "use client";

// import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as ImagePicker from "expo-image-picker";
// import { useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   ActivityIndicator,
//   Alert, // Keep Alert for other uses if needed
//   Dimensions,
//   FlatList,
//   I18nManager,
//   Image,
//   Modal,
//   RefreshControl,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import Snackbar from "react-native-snackbar";
// import CarCard from "../../components/car-card";
// import { useAuth } from "../../contexts/AuthContext";
// import type { Car } from "../../types";
// import {
//   deleteCar,
//   getUserById,
//   getUserListings,
//   updateProfile,
//   updateProfileImage,
// } from "../../utils/api";

// const { width, height } = Dimensions.get("window");

// interface UserDetails {
//   username: string;
//   phone: string;
//   profileImage: string;
// }

// interface FocusState {
//   username: boolean;
//   phone: boolean;
// }

// export default function Profile() {
//   const { t, i18n } = useTranslation();
//   const router = useRouter();
//   const { user, logout, isAuthenticated } = useAuth();
//   const insets = useSafeAreaInsets();
//   const [activeTab, setActiveTab] = useState<"profile" | "listings">("profile");
//   const [userDetails, setUserDetails] = useState<UserDetails>({
//     username: "",
//     phone: "",
//     profileImage: "",
//   });
//   const [listings, setListings] = useState<Car[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [refreshing, setRefreshing] = useState<boolean>(false);
//   const [editing, setEditing] = useState<boolean>(false);
//   const [imageUploading, setImageUploading] = useState<boolean>(false);
//   const [focused, setFocused] = useState<FocusState>({
//     username: false,
//     phone: false,
//   });
//   // State for the custom logout modal
//   const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

//   useEffect(() => {
//     if (isAuthenticated && user?._id) {
//       fetchUserDetails();
//       fetchUserListings();
//     }
//   }, [isAuthenticated, user?._id]);

//   const fetchUserDetails = async (): Promise<void> => {
//     setLoading(true);
//     try {
//       const response = await getUserById(user!._id);
//       const userData = response.data?.data || response.data;
//       setUserDetails({
//         username: userData.username || "",
//         phone: userData.phone || "",
//         profileImage: userData.profileImage || "",
//       });
//     } catch (error: any) {
//       console.error("Profile: Error fetching user details:", error);
//       // Alert.alert(t("error"), t("failedToFetchProfile"));
//       Snackbar.show({
//         text: t("failedToFetchProfile"),
//         duration: 2000,
//         backgroundColor: "#B80200",
//         textColor: "#FFFFFF",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchUserListings = async (): Promise<void> => {
//     try {
//       const response = await getUserListings(user!._id);
//       const listingsData = response.data?.data || response.data;
//       setListings(Array.isArray(listingsData) ? listingsData : []);
//     } catch (error: any) {
//       console.error("Profile: Error fetching listings:", error);
//       // Alert.alert(t("error"), t("failedToFetchListings"));
//       Snackbar.show({
//         text: t("failedToFetchListings"),
//         duration: 2000,
//         backgroundColor: "#B80200",
//         textColor: "#FFFFFF",
//       });
//     }
//   };

//   const onRefresh = async (): Promise<void> => {
//     setRefreshing(true);
//     await Promise.all([fetchUserDetails(), fetchUserListings()]);
//     setRefreshing(false);
//   };

//   const handleImagePick = async (): Promise<void> => {
//     const permissionResult =
//       await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permissionResult.granted) {
//       // Alert.alert(t("error"), t("photoPermissionRequired"));
//       Snackbar.show({
//         text: t("photoPermissionRequired"),
//         duration: 2000,
//         backgroundColor: "#B80200",
//         textColor: "#FFFFFF",
//       });
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 0.8,
//     });

//     if (!result.canceled && result.assets[0].uri) {
//       setImageUploading(true);
//       try {
//         const formData = new FormData();
//         formData.append("profileImage", {
//           uri: result.assets[0].uri,
//           type: "image/jpeg",
//           name: "profile.jpg",
//         } as any);
//         const response = await updateProfileImage(user!._id, formData);
//         setUserDetails({
//           ...userDetails,
//           profileImage: response.data.profileImage,
//         });
//         Snackbar.show({
//           text: t("profileImageUpdated"),
//           duration: 2000,
//           backgroundColor: "green",
//           textColor: "#FFFFFF",
//         });
//         //Alert.alert(t("success"), t("profileImageUpdated"));
//       } catch (error: any) {
//         console.error("Profile: Error updating profile image:", error);
//         Snackbar.show({
//           text: t("failedToUpdateImage"),
//           duration: 2000,
//           backgroundColor: "#B80200",
//           textColor: "#FFFFFF",
//         });
//         // Alert.alert(t("error"), t("failedToUpdateImage"));
//       } finally {
//         setImageUploading(false);
//       }
//     }
//   };

//   const handleSaveProfile = async (): Promise<void> => {
//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("username", userDetails.username);
//       formData.append("phone", userDetails.phone);

//       await updateProfile(formData);
//       setEditing(false);
//       // Alert.alert(t("success"), t("profileUpdated"));
//       Snackbar.show({
//         text: t("profileUpdated"),
//         duration: 2000,
//         backgroundColor: "green",
//         textColor: "#FFFFFF",
//       });
//     } catch (error: any) {
//       console.error("Profile: Error updating profile:", error);
//       // Alert.alert(t("error"), t("failedToUpdateProfile"));
//       Snackbar.show({
//         text: t("failedToUpdateProfile"),
//         duration: 2000,
//         backgroundColor: "#B80200",
//         textColor: "#FFFFFF",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- MODIFIED LOGOUT HANDLER AND ADDED CUSTOM MODAL ---
//   const handleLogout = async (): Promise<void> => {
//     setShowLogoutModal(true); // Show the custom logout modal
//   };

//   const confirmLogout = async () => {
//     setShowLogoutModal(false); // Hide modal
//     try {
//       await logout();
//       Snackbar.show({
//         text: t("loggedOut"),
//         duration: 2000,
//         backgroundColor: "green",
//         textColor: "#FFFFFF",
//       });
//       router.replace("/(tabs)");
//     } catch (error: any) {
//       console.error("Profile: Error logging out:", error);
//       // Alert.alert(t("error"), t("failedToLogout"));
//       Snackbar.show({
//         text: t("failedToLogout"),
//         duration: 2000,
//         backgroundColor: "#B80200",
//         textColor: "#FFFFFF",
//       });
//     }
//   };
//   // ------------------------------------------------------

//   const changeLanguage = async (lang: "en" | "ar"): Promise<void> => {
//     try {
//       // Change language in i18n
//       await i18n.changeLanguage(lang);

//       // Store the selected language
//       await AsyncStorage.setItem("user-language", lang);

//       // Handle RTL layout for Arabic
//       const isRTL = lang === "ar";
//       if (I18nManager.isRTL !== isRTL) {
//         I18nManager.forceRTL(isRTL);
//         // In a production app, you might want to reload the app here
//         // to properly apply RTL changes
//       }

//       Snackbar.show({
//         text: t("languageChanged"),
//         duration: 2000,
//         backgroundColor: "green",
//         textColor: "#FFFFFF",
//       });
//     } catch (error) {
//       console.error("Error changing language:", error);
//       Snackbar.show({
//         text: t("languageChangeFailed"),
//         duration: 2000,
//         backgroundColor: "#B80200",
//         textColor: "#FFFFFF",
//       });
//     }
//   };

//   const handleFocus = (field: keyof FocusState): void => {
//     setFocused((prev) => ({ ...prev, [field]: true }));
//   };

//   const handleBlur = (field: keyof FocusState): void => {
//     setFocused((prev) => ({ ...prev, [field]: false }));
//   };

//   const handleEditListing = (carId: string): void => {
//     router.push(`/edit-listing?carId=${carId}`);
//   };

//   const handleViewListing = (carId: string): void => {
//     router.push(`/car-details?carId=${carId}`);
//   };

//   const handleDeleteListing = (carId: string): void => {
//     Alert.alert(t("confirmDelete"), t("deleteListingConfirmMessage"), [
//       { text: t("cancel"), style: "cancel" },
//       {
//         text: t("delete"),
//         style: "destructive",
//         onPress: async () => {
//           try {
//             await deleteCar(carId);
//             Snackbar.show({
//               text: t("listingDeleted"),
//               duration: 2000,
//               backgroundColor: "green",
//               textColor: "#FFFFFF",
//             });
//             fetchUserListings(); // Refresh the listings
//           } catch (error: any) {
//             console.error("Profile: Error deleting listing:", error);
//             Snackbar.show({
//               text: t("failedToDeleteListing"),
//               duration: 2000,
//               backgroundColor: "#B80200",
//               textColor: "#FFFFFF",
//             });
//           }
//         },
//       },
//     ]);
//   };

//   const renderListingItem = ({ item }: { item: Car }) => (
//     <CarCard
//       car={item}
//       onPress={() => handleViewListing(item._id)}
//       onEdit={() => handleEditListing(item._id)}
//       onDelete={() => handleDeleteListing(item._id)}
//       showActions={true}
//     />
//   );

//   const renderProfileContent = () => (
//     <ScrollView style={styles.profileContent}>
//       {/* Profile Image Section */}
//       <View style={styles.profileImageSection}>
//         <TouchableOpacity
//           style={styles.profileImageContainer}
//           onPress={handleImagePick}
//           disabled={imageUploading}
//           activeOpacity={0.8}
//         >
//           {imageUploading ? (
//             <View style={styles.uploadingContainer}>
//               <ActivityIndicator color="#B80200" size="large" />
//             </View>
//           ) : userDetails.profileImage ? (
//             <Image
//               source={{ uri: userDetails.profileImage }}
//               style={styles.profileImage}
//             />
//           ) : (
//             <View style={styles.placeholderImage}>
//               <Ionicons name="person" size={50} color="#999" />
//             </View>
//           )}
//           <View style={styles.editImageOverlay}>
//             <Ionicons name="camera" size={18} color="#FFFFFF" />
//           </View>
//         </TouchableOpacity>
//         <Text style={styles.imageHint}>{t("tapToChangePhoto")}</Text>
//       </View>

//       {/* User Details Form */}
//       <View style={styles.formContainer}>
//         <View style={styles.inputGroup}>
//           <Text style={styles.label}>{t("username")}</Text>
//           <View
//             style={[
//               styles.inputContainer,
//               focused.username && styles.inputFocused,
//               !editing && styles.inputDisabled,
//             ]}
//           >
//             <Ionicons
//               name="person-outline"
//               size={20}
//               color={focused.username ? "#B80200" : "#666"}
//               style={styles.inputIcon}
//             />
//             <TextInput
//               style={styles.textInput}
//               value={userDetails.username}
//               onChangeText={(text) =>
//                 setUserDetails({ ...userDetails, username: text })
//               }
//               editable={editing}
//               placeholder={t("enterUsername")}
//               placeholderTextColor="#999"
//               onFocus={() => handleFocus("username")}
//               onBlur={() => handleBlur("username")}
//             />
//           </View>
//         </View>

//         <View style={styles.inputGroup}>
//           <Text style={styles.label}>{t("phoneNumber")}</Text>
//           <View
//             style={[
//               styles.inputContainer,
//               focused.phone && styles.inputFocused,
//               !editing && styles.inputDisabled,
//             ]}
//           >
//             <Ionicons
//               name="call-outline"
//               size={20}
//               color={focused.phone ? "#B80200" : "#666"}
//               style={styles.inputIcon}
//             />
//             <TextInput
//               style={styles.textInput}
//               value={userDetails.phone}
//               onChangeText={(text) =>
//                 setUserDetails({ ...userDetails, phone: text })
//               }
//               editable={editing}
//               keyboardType="phone-pad"
//               placeholder={t("enterPhoneNumber")}
//               placeholderTextColor="#999"
//               onFocus={() => handleFocus("phone")}
//               onBlur={() => handleBlur("phone")}
//             />
//           </View>
//         </View>

//         {/* Edit/Save Button */}
//         <TouchableOpacity
//           style={[styles.actionButton, editing && styles.saveButton]}
//           onPress={editing ? handleSaveProfile : () => setEditing(true)}
//           disabled={loading}
//           activeOpacity={0.8}
//         >
//           <Ionicons
//             name={editing ? "checkmark" : "create-outline"}
//             size={20}
//             color="#FFFFFF"
//             style={styles.buttonIcon}
//           />
//           <Text style={styles.actionButtonText}>
//             {editing ? t("saveProfile") : t("editProfile")}
//           </Text>
//         </TouchableOpacity>

//         {editing && (
//           <TouchableOpacity
//             style={styles.cancelButton}
//             onPress={() => setEditing(false)}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* App Options */}
//       <View style={styles.optionsContainer}>
//         <Text style={styles.sectionTitle}>{t("appSettings")}</Text>

//         {/* Language Selection */}
//         <View style={styles.optionItem}>
//           <View style={styles.optionLeft}>
//             <Ionicons name="language-outline" size={22} color="#B80200" />
//             <Text style={styles.optionText}>{t("language")}</Text>
//           </View>
//           <View style={styles.languageButtons}>
//             <TouchableOpacity
//               style={[
//                 styles.languageButton,
//                 i18n.language === "en" && styles.activeLanguage,
//               ]}
//               onPress={() => changeLanguage("en")}
//               activeOpacity={0.7}
//             >
//               <Text
//                 style={[
//                   styles.languageButtonText,
//                   i18n.language === "en" && styles.activeLanguageText,
//                 ]}
//               >
//                 EN
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[
//                 styles.languageButton,
//                 i18n.language === "ar" && styles.activeLanguage,
//               ]}
//               onPress={() => changeLanguage("ar")}
//               activeOpacity={0.7}
//             >
//               <Text
//                 style={[
//                   styles.languageButtonText,
//                   i18n.language === "ar" && styles.activeLanguageText,
//                 ]}
//               >
//                 AR
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Other Options */}
//         {[
//           { key: "aboutUs", icon: "information-circle-outline" },
//           { key: "termsOfUse", icon: "document-text-outline" },
//           { key: "privacyPolicy", icon: "shield-checkmark-outline" },
//           { key: "contactUs", icon: "mail-outline" },
//         ].map((option) => (
//           <TouchableOpacity
//             key={option.key}
//             style={styles.optionItem}
//             onPress={() =>
//               Alert.alert(t(option.key), t(`${option.key}Content`))
//             }
//             activeOpacity={0.7}
//           >
//             <View style={styles.optionLeft}>
//               <Ionicons name={option.icon as any} size={22} color="#B80200" />
//               <Text style={styles.optionText}>{t(option.key)}</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#999" />
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Logout Button */}
//       <TouchableOpacity
//         style={styles.logoutButton}
//         onPress={handleLogout} // Now opens the custom modal
//         disabled={loading}
//         activeOpacity={0.8}
//       >
//         <Ionicons
//           name="log-out-outline"
//           size={20}
//           color="#FFFFFF"
//           style={styles.buttonIcon}
//         />
//         <Text style={styles.logoutButtonText}>{t("logoutButton")}</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );

//   const renderListingsContent = () => (
//     <View style={styles.listingsContainer}>
//       {listings.length === 0 ? (
//         <View style={styles.emptyState}>
//           <Ionicons name="car-outline" size={60} color="#ccc" />
//           <Text style={styles.emptyStateTitle}>{t("noListings")}</Text>
//           <Text style={styles.emptyStateDescription}>
//             {t("noListingsDescription")}
//           </Text>
//           <TouchableOpacity
//             style={styles.addListingButton}
//             onPress={() => router.push("./add-listing")}
//             activeOpacity={0.8}
//           >
//             <Ionicons name="add" size={20} color="#FFFFFF" />
//             <Text style={styles.addListingButtonText}>{t("addListing")}</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <FlatList
//           data={listings}
//           keyExtractor={(item) => item._id}
//           renderItem={renderListingItem}
//           contentContainerStyle={styles.listingsContent}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//           }
//         />
//       )}
//     </View>
//   );

//   if (!isAuthenticated) {
//     return (
//       <View style={styles.authContainer}>
//         <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
//         <View style={styles.authContent}>
//           <Ionicons name="person-circle-outline" size={80} color="#B80200" />
//           <Text style={styles.authTitle}>{t("accountRequired")}</Text>
//           <Text style={styles.authDescription}>
//             {t("loginToAccessProfile")}
//           </Text>
//           <TouchableOpacity
//             style={styles.authButton}
//             onPress={() => router.push("/login")}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.authButtonText}>{t("login")}</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       <StatusBar
//         barStyle="light-content"
//         backgroundColor="#1a1a1a"
//         translucent={false}
//       />

//       {/* Header with Integrated Tab Navigation */}
//       <View style={styles.header}>
//         <View style={styles.tabContainer}>
//           <TouchableOpacity
//             style={[styles.tab, activeTab === "profile" && styles.activeTab]}
//             onPress={() => setActiveTab("profile")}
//             activeOpacity={0.7}
//           >
//             <Ionicons
//               name="person-outline"
//               size={20}
//               color={activeTab === "profile" ? "#B80200" : "#666"}
//             />
//             <Text
//               style={[
//                 styles.tabText,
//                 activeTab === "profile" && styles.activeTabText,
//               ]}
//             >
//               {t("profileTab")}
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.tab, activeTab === "listings" && styles.activeTab]}
//             onPress={() => setActiveTab("listings")}
//             activeOpacity={0.7}
//           >
//             <Ionicons
//               name="car-outline"
//               size={20}
//               color={activeTab === "listings" ? "#B80200" : "#666"}
//             />
//             <Text
//               style={[
//                 styles.tabText,
//                 activeTab === "listings" && styles.activeTabText,
//               ]}
//             >
//               {t("myListingsTab")}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Content Area */}
//       <View style={styles.contentContainer}>
//         {loading && !refreshing
//           ? renderProfileContent()
//           : activeTab === "profile"
//           ? renderProfileContent()
//           : renderListingsContent()}
//       </View>

//       {/* Custom Logout Modal */}
//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={showLogoutModal}
//         onRequestClose={() => setShowLogoutModal(false)} // For Android back button
//       >
//         <View style={styles.centeredView}>
//           <View style={styles.modalView}>
//             <Ionicons name="log-out-outline" size={50} color="#B80200" />
//             <Text style={styles.modalTitle}>{t("confirmLogout")}</Text>
//             <Text style={styles.modalMessage}>{t("logoutConfirmMessage")}</Text>
//             <View style={styles.modalButtonContainer}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalCancelButton]}
//                 onPress={() => setShowLogoutModal(false)}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.modalButtonText}>{t("cancel")}</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalConfirmButton]}
//                 onPress={confirmLogout}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.modalButtonText}>{t("logout")}</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#1a1a1a", // Header background color extends to top
//   },
//   header: {
//     backgroundColor: "#1a1a1a",
//     paddingTop: 15, // Fixed padding
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   tabContainer: {
//     flexDirection: "row",
//     backgroundColor: "#ffffff",
//     borderRadius: 15,
//     padding: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   tab: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//     borderRadius: 12,
//     gap: 6,
//   },
//   activeTab: {
//     backgroundColor: "rgba(184, 2, 0, 0.1)",
//   },
//   tabText: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#666",
//   },
//   activeTabText: {
//     color: "#B80200",
//   },
//   contentContainer: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//   },
//   profileContent: {
//     flex: 1,
//     padding: 20,
//   },
//   listingsContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   listingsContent: {
//     paddingBottom: 20,
//     paddingHorizontal: 0,
//   },
//   profileImageSection: {
//     alignItems: "center",
//     marginBottom: 25,
//   },
//   profileImageContainer: {
//     position: "relative",
//     marginBottom: 8,
//   },
//   profileImage: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     borderWidth: 3,
//     borderColor: "#B80200",
//   },
//   placeholderImage: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: "#f0f0f0",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 2,
//     borderColor: "#e0e0e0",
//   },
//   uploadingContainer: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: "rgba(0,0,0,0.1)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   editImageOverlay: {
//     position: "absolute",
//     bottom: 0,
//     right: 0,
//     backgroundColor: "#B80200",
//     borderRadius: 15,
//     padding: 6,
//     borderWidth: 2,
//     borderColor: "#ffffff",
//   },
//   imageHint: {
//     fontSize: 12,
//     color: "#666",
//     textAlign: "center",
//   },
//   formContainer: {
//     backgroundColor: "#ffffff",
//     borderRadius: 15,
//     padding: 20,
//     marginBottom: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   inputGroup: {
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#1a1a1a",
//     marginBottom: 8,
//     marginLeft: 2,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f8f9fa",
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     height: 50,
//     borderWidth: 1.5,
//     borderColor: "#e9ecef",
//   },
//   inputFocused: {
//     borderColor: "#B80200",
//     backgroundColor: "#ffffff",
//     shadowColor: "#B80200",
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   inputDisabled: {
//     backgroundColor: "#f5f5f5",
//     borderColor: "#e0e0e0",
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   textInput: {
//     flex: 1,
//     fontSize: 15,
//     color: "#1a1a1a",
//     fontWeight: "500",
//   },
//   actionButton: {
//     backgroundColor: "#B80200",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 14,
//     borderRadius: 12,
//     shadowColor: "#B80200",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//     gap: 8,
//   },
//   saveButton: {
//     backgroundColor: "#28a745",
//   },
//   buttonIcon: {
//     marginRight: 4,
//   },
//   actionButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   cancelButton: {
//     backgroundColor: "transparent",
//     alignItems: "center",
//     paddingVertical: 12,
//     marginTop: 8,
//   },
//   cancelButtonText: {
//     color: "#666",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   optionsContainer: {
//     backgroundColor: "#ffffff",
//     borderRadius: 15,
//     padding: 20,
//     marginBottom: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#1a1a1a",
//     marginBottom: 15,
//   },
//   optionItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   optionLeft: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//   },
//   optionText: {
//     fontSize: 15,
//     color: "#1a1a1a",
//     fontWeight: "500",
//   },
//   languageButtons: {
//     flexDirection: "row",
//     gap: 8,
//   },
//   languageButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//     backgroundColor: "#f8f9fa",
//   },
//   activeLanguage: {
//     backgroundColor: "#B80200",
//     borderColor: "#B80200",
//   },
//   languageButtonText: {
//     fontSize: 12,
//     color: "#666",
//     fontWeight: "600",
//   },
//   activeLanguageText: {
//     color: "#ffffff",
//   },
//   logoutButton: {
//     backgroundColor: "#B80200",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 14,
//     borderRadius: 12,
//     shadowColor: "#B80200",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//     gap: 8,
//     marginBottom: 30,
//   },
//   logoutButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   emptyState: {
//     alignItems: "center",
//     paddingVertical: 40,
//   },
//   emptyStateTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1a1a1a",
//     marginTop: 15,
//     marginBottom: 8,
//   },
//   emptyStateDescription: {
//     fontSize: 14,
//     color: "#666",
//     textAlign: "center",
//     marginBottom: 20,
//     lineHeight: 20,
//   },
//   addListingButton: {
//     backgroundColor: "#B80200",
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 10,
//     gap: 6,
//   },
//   addListingButtonText: {
//     color: "#FFFFFF",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   loadingContainer: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 40,
//   },
//   loadingText: {
//     fontSize: 14,
//     color: "#666",
//     marginTop: 10,
//   },
//   authContainer: {
//     flex: 1,
//     backgroundColor: "#ffffff",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   authContent: {
//     width: "100%",
//     maxWidth: 300,
//     alignItems: "center",
//   },
//   authTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#1a1a1a",
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   authDescription: {
//     fontSize: 14,
//     color: "#666",
//     textAlign: "center",
//     marginBottom: 25,
//     lineHeight: 20,
//   },
//   authButton: {
//     backgroundColor: "#B80200",
//     paddingVertical: 14,
//     borderRadius: 12,
//     width: "100%",
//     alignItems: "center",
//   },
//   authButtonText: {
//     color: "#ffffff",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   // --- NEW STYLES FOR CUSTOM MODAL ---
//   centeredView: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.6)", // Semi-transparent background
//   },
//   modalView: {
//     margin: 20,
//     backgroundColor: "white",
//     borderRadius: 15,
//     padding: 30,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 5,
//     elevation: 8,
//     width: "85%", // Adjust width as needed
//     maxWidth: 350,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#1a1a1a",
//     marginTop: 15,
//     marginBottom: 10,
//     textAlign: "center",
//   },
//   modalMessage: {
//     fontSize: 15,
//     color: "#666",
//     textAlign: "center",
//     marginBottom: 25,
//     lineHeight: 22,
//   },
//   modalButtonContainer: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     width: "100%",
//     gap: 15, // Space between buttons
//   },
//   modalButton: {
//     flex: 1, // Make buttons take equal space
//     paddingVertical: 12,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   modalConfirmButton: {
//     backgroundColor: "#B80200", // Your primary app color for confirm
//   },
//   modalCancelButton: {
//     backgroundColor: "#6c6b6b", // A neutral color for cancel
//   },
//   modalButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });
