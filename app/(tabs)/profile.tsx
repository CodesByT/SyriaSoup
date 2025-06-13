"use client";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
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
import { showToastable } from "react-native-toastable";
import CarCard from "../../components/car-card";
import { useAuth } from "../../contexts/AuthContext";
import { useRTL } from "../../hooks/useRTL";
import type { Car } from "../../types";
import {
  deleteCar,
  getUserById,
  getUserListings,
  updateProfileImage,
} from "../../utils/api";

const { width, height } = Dimensions.get("window");

interface UserDetails {
  username: string;
  phone: string;
  profileImage: string;
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
  const [imageUploading, setImageUploading] = useState<boolean>(false);
  // State for the custom logout modal
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  // State for the custom delete listing modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [carToDelete, setCarToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      fetchUserDetails();
      fetchUserListings();
    }
  }, [isAuthenticated, user?._id]);

  // Refresh listings when user comes back to profile (e.g., after posting an ad)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?._id && activeTab === "listings") {
        fetchUserListings();
      }
    }, [isAuthenticated, user?._id, activeTab])
  );

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
      // console.error("Profile: Error fetching user details:", error);

      showToastable({
        message: t("failedToFetchProfile"),
        status: "warning",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
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
      // console.error("Profile: Error fetching listings:", error);

      showToastable({
        message: t("failedToFetchListings"),
        status: "warning",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
      });
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([fetchUserDetails(), fetchUserListings()]);
    setRefreshing(false);
  };

  // const handleImagePick = async (): Promise<void> => {
  //   const permissionResult =
  //     await ImagePicker.requestMediaLibraryPermissionsAsync();
  //   if (!permissionResult.granted) {
  //     showToastable({
  //       message: t("photoPermissionRequired"),
  //       status: "warning",
  //       duration: 2000, // Matches Snackbar.LENGTH_LONG
  //     });
  //     return;
  //   }

  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     aspect: [1, 1],
  //     quality: 0.8,
  //   });

  //   if (!result.canceled && result.assets[0].uri) {
  //     setImageUploading(true);
  //     try {
  //       const formData = new FormData();
  //       formData.append("profileImage", {
  //         uri: result.assets[0].uri,
  //         type: "image/jpeg",
  //         name: "profile.jpg",
  //       } as any);
  //       const response = await updateProfileImage(user!._id, formData);
  //       setUserDetails({
  //         ...userDetails,
  //         profileImage: response.data.profileImage,
  //       });

  //       showToastable({
  //         message: t("profileImageUpdated"),
  //         status: "success",
  //         duration: 2000, // Matches Snackbar.LENGTH_LONG
  //       });
  //     } catch (error: any) {
  //       console.error("Profile: Error updating profile image:", error);

  //       showToastable({
  //         message: t("failedToUpdateImage"),
  //         status: "warning",
  //         duration: 2000, // Matches Snackbar.LENGTH_LONG
  //       });
  //     } finally {
  //       setImageUploading(false);
  //     }
  //   }
  // };
  const handleImagePick = async (): Promise<void> => {
    if (!user?._id) {
      console.log("No user ID");
      showToastable({
        message: t("userNotAuthenticated"),
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      // Request permissions
      // console.log("Requesting permissions...");
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult || !permissionResult.granted) {
        // console.log("Permission denied:", permissionResult);
        showToastable({
          message: t("photoPermissionRequired"),
          status: "warning",
          duration: 3000,
        });
        return;
      }

      // Launch image picker
      // console.log("Launching image picker...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // No iOS crashes
        quality: 0.3, // Low memory usage
        base64: true, // For JSON API
      });

      // Check result
      if (result?.canceled) {
        // console.log("Image pick canceled");
        showToastable({
          message: t("imagePickCanceled"),
          status: "info",
          duration: 2000,
        });
        return;
      }

      if (
        !result?.assets?.length ||
        !result.assets[0]?.uri ||
        !result.assets[0]?.base64
      ) {
        // console.log("Invalid image result:", result);
        showToastable({
          message: t("noImageSelected"),
          status: "warning",
          duration: 3000,
        });
        return;
      }

      // Prepare base64
      // console.log("Image URI:", result.assets[0].uri);
      setImageUploading(true);
      const base64Image = `data:${
        result.assets[0].mimeType || "image/jpeg"
      };base64,${result.assets[0].base64}`;

      // Call API with timeout
      // console.log("Uploading image...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        // console.log("Upload timed out");
      }, 30000); // 30s timeout

      const response = await updateProfileImage(user._id, base64Image);
      clearTimeout(timeoutId);

      // Check response
      if (!response?.data?.profileImage) {
        // console.log("Invalid response:", response);
        showToastable({
          message: t("failedToUpdateImage"),
          status: "warning",
          duration: 3000,
        });
        return;
      }

      // Update state
      // console.log("Image uploaded:", response.data.profileImage);
      setUserDetails({
        ...userDetails,
        profileImage: response.data.profileImage,
      });

      showToastable({
        message: t("profileImageUpdated"),
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      // console.log("Error in handleImagePick:", error);
      showToastable({
        message: t("failedToUpdateImage"),
        status: "warning",
        duration: 3000,
      });
    } finally {
      setImageUploading(false);
    }
  };
  const handleLogout = async (): Promise<void> => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();

      showToastable({
        message: t("loggedOut"),
        status: "success",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Profile: Error logging out:", error);

      showToastable({
        message: t("failedToLogout"),
        status: "warning",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
      });
    }
  };

  const changeLanguage = async (lang: "en" | "ar"): Promise<void> => {
    try {
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem("user-language", lang);
    } catch (error) {
      showToastable({
        message: t("languageChangeFailed"),
        status: "warning",
        duration: 2000, // Matches Snackbar.LENGTH_LONG
      });
    }
  };

  const handleEditListing = (carId: string): void => {
    router.push(`/edit-listing?carId=${carId}`);
  };

  const handleViewListing = (carId: string): void => {
    router.push(`/car-details?carId=${carId}`);
  };

  const handleDeleteListing = (carId: string): void => {
    setCarToDelete(carId);
    setShowDeleteModal(true);
  };

  const confirmDeleteListing = async (): Promise<void> => {
    if (!carToDelete) return;

    setShowDeleteModal(false);
    try {
      await deleteCar(carToDelete);

      showToastable({
        message: t("listingDeleted"),
        status: "success",
        duration: 2000,
      });
      fetchUserListings();
    } catch (error: any) {
      console.error("Profile: Error deleting listing:", error);

      showToastable({
        message: t("failedToDeleteListing"),
        status: "warning",
        duration: 2000,
      });
    } finally {
      setCarToDelete(null);
    }
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
          <View style={[styles.inputContainer, styles.inputDisabled]}>
            <View
              style={[
                styles.iconContainer,
                isRTL ? styles.iconContainerRTL : null,
              ]}
            >
              <Ionicons name="person-outline" size={20} color="#B80200" />
            </View>
            <TextInput
              style={[
                styles.input,
                isRTL ? styles.inputRTL : null,
                { textAlign: isRTL ? "right" : "left" },
              ]}
              value={userDetails.username}
              editable={false}
              placeholder={t("enterUsername")}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* <View style={styles.inputGroup}>
          <Text style={[styles.label, rtlStyle]}>{t("phoneNumber")}</Text>
          <View
            style={[
              styles.inputContainer,
              styles.inputDisabled,
              isRTL && styles.inputContainerRTL,
            ]}
          >
            {!isRTL && (
              <View style={styles.iconContainer}>
                <Ionicons name="call-outline" size={20} color="#B80200" />
              </View>
            )}
            {i18n.language !== "ar" && !isRTL && (
              <View style={styles.iconContainer}>
                <Ionicons name="call-outline" size={20} color="#B80200" />
              </View>
            )}
            <TextInput
              style={[
                styles.input,
                isRTL ? styles.inputRTLFixed : styles.inputLTRFixed,
                { textAlign: isRTL ? "right" : "left" },
              ]}
              value={userDetails.phone}
              editable={false}
              keyboardType="phone-pad"
              placeholder={t("enterPhoneNumber")}
              placeholderTextColor="#999"
            />
            {isRTL && i18n.language !== "ar" && (
              <View style={styles.iconContainerRTL}>
                <Ionicons name="call-outline" size={20} color="#B80200" />
              </View>
            )}
            <TouchableOpacity
              style={[styles.editButton, isRTL && styles.editButtonRTL]}
              onPress={() => router.push("/reset-password")}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color="#B80200" />
            </TouchableOpacity>
          </View>
        </View> */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, rtlStyle]}>{t("phoneNumber")}</Text>
          <View
            style={[
              styles.inputContainer,
              styles.inputDisabled,
              isRTL && styles.inputContainerRTL,
            ]}
          >
            {!isRTL && i18n.language !== "ar" && (
              <View style={styles.iconContainer}>
                <Ionicons name="call-outline" size={20} color="#B80200" />
              </View>
            )}
            {isRTL && i18n.language !== "ar" && (
              <View style={styles.iconContainerRTL}>
                <Ionicons name="call-outline" size={20} color="#B80200" />
              </View>
            )}
            <TextInput
              style={[
                styles.input,
                isRTL ? styles.inputRTLFixed : styles.inputLTRFixed,
                { textAlign: isRTL ? "right" : "left" },
              ]}
              value={userDetails.phone}
              editable={false}
              keyboardType="phone-pad"
              placeholder={t("enterPhoneNumber")}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.editButton, isRTL && styles.editButtonRTL]}
              onPress={() => router.push("/reset-password")}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color="#B80200" />
            </TouchableOpacity>
          </View>
        </View>
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
          { key: "aboutUs", icon: "information-circle-outline" as const },
          { key: "termsOfUse", icon: "document-text-outline" as const },
          { key: "privacyPolicy", icon: "shield-checkmark-outline" as const },
          { key: "contactUs", icon: "mail-outline" as const },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.optionItem, { flexDirection: getFlexDirection() }]}
            onPress={() => {
              if (option.key === "contactUs") {
                router.push("/contact-us");
              } else if (option.key === "termsOfUse") {
                router.push("/terms-of-use");
              } else if (option.key === "aboutUs") {
                router.push("/about-us");
              } else if (option.key === "privacyPolicy") {
                router.push("/privacy-policy");
              } else {
                Alert.alert(t(option.key), t(`${option.key}Content`));
              }
            }}
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
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
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

      {/* Custom Delete Listing Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Ionicons name="trash-outline" size={50} color="#B80200" />
            <Text style={[styles.modalTitle, rtlStyle]}>
              {t("confirmDelete")}
            </Text>
            <Text style={[styles.modalMessage, rtlStyle]}>
              {t("deleteListingConfirmMessage")}
            </Text>
            <View
              style={[
                styles.modalButtonContainer,
                { flexDirection: getFlexDirection("row") },
              ]}
            >
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowDeleteModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmDeleteListing}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>{t("delete")}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    height: 50,
    overflow: "hidden",
    position: "relative",
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  iconContainerRTL: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: Math.max(15, 1),
    color: "#1a1a1a",
    fontWeight: "500",
  },
  inputLTR: {
    paddingLeft: 15, // Space from phone icon on left
    paddingRight: 50, // Space for edit button on right
  },
  inputRTL: {
    paddingRight: 65, // Space from phone icon on right (50px icon + 15px padding)
    paddingLeft: 50, // Space for edit button on left
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  editButton: {
    position: "absolute",
    right: 15,
    top: 15,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
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
  buttonIcon: {
    marginRight: 4,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    flexGrow: 1,
    justifyContent: "center",
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
  inputWithEditButton: {
    paddingLeft: 15, // Normal padding from phone icon in LTR
    paddingRight: 50, // Add padding for edit button in LTR
  },
  inputWithEditButtonRTL: {
    paddingRight: 15, // Normal padding from phone icon in RTL
    paddingLeft: 50, // Add padding for edit button in RTL
  },
  editButtonRTL: {
    right: "auto",
    left: 15,
  },
  inputContainerRTL: {
    flexDirection: "row-reverse",
  },
  inputLTRFixed: {
    paddingLeft: 15, // Space from phone icon
    paddingRight: 50, // Space for edit button
  },
  inputRTLFixed: {
    paddingRight: 15, // Space from phone icon
    paddingLeft: 50, // Space for edit button
  },
});
