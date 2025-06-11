"use client";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import hand from "../assets/hand.jpg";
import { useRTL } from "../hooks/useRTL";
const { width } = Dimensions.get("window");

export default function AboutUs() {
  const { t } = useTranslation();
  const { isRTL, rtlStyle, rtlViewStyle } = useRTL();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleExploreListings = () => {
    router.push("/(tabs)");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("aboutUs")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={[styles.aboutUsLabel, rtlStyle]}>{t("aboutUs")}</Text>
            <Text style={[styles.heroTitle, rtlStyle]}>
              {t("syrianSalesWebsite")}
            </Text>
            <Text style={[styles.heroSubtitle, rtlStyle]}>
              {t("aboutUsDescription")}
            </Text>

            <TouchableOpacity
              style={styles.exploreButton}
              onPress={handleExploreListings}
            >
              <Text style={styles.exploreButtonText}>
                {t("exploreListings")}
              </Text>
              <Ionicons
                name={isRTL ? "arrow-back" : "arrow-forward"}
                size={18}
                color="#B80200"
              />
            </TouchableOpacity>
          </View>

          <Image
            // source={{
            //   uri: "https://sjc.microlink.io/s6vs0TxR_wfdphUoxXYCuZVKKBClYczgQsF4_dOMPcA3x-9tV3TxQzNlTd-bpNDeP-zOIW6hrOLM-rsmLpvdsQ.jpeg",
            // }}
            source={hand}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, rtlStyle]}>{t("ourMission")}</Text>
          <Text style={[styles.sectionText, rtlStyle]}>
            {t("missionDescription")}
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, rtlStyle]}>
            {t("whyChooseUs")}
          </Text>

          {[
            {
              icon: "shield-checkmark",
              title: "safeAndSecure",
              description: "safeAndSecureDesc",
            },
            {
              icon: "people",
              title: "communityDriven",
              description: "communityDrivenDesc",
            },
            {
              icon: "speedometer",
              title: "fastAndEasy",
              description: "fastAndEasyDesc",
            },
            {
              icon: "phone-portrait",
              title: "mobileOptimized",
              description: "mobileOptimizedDesc",
            },
          ].map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureItem,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <View style={styles.featureIconContainer}>
                <Ionicons
                  name={feature.icon as keyof (typeof Ionicons)["glyphMap"]}
                  size={24}
                  color="#B80200"
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, rtlStyle]}>
                  {t(feature.title)}
                </Text>
                <Text style={[styles.featureDescription, rtlStyle]}>
                  {t(feature.description)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, rtlStyle]}>{t("getInTouch")}</Text>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push("/contact-us")}
          >
            <Ionicons name="mail" size={18} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>{t("contactUs")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#1a1a1a",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  heroSection: {
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  heroContent: {
    marginBottom: 20,
  },
  aboutUsLabel: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#e9ecef",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 20,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#B80200",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  exploreButtonText: {
    color: "#B80200",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  heroImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginTop: 20,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginTop: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(184, 2, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginLeft: 0,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B80200",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
