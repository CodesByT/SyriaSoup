"use client";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRTL } from "../hooks/useRTL";

export default function TermsOfUse() {
  const { t } = useTranslation();
  const { isRTL, rtlStyle, getFlexDirection } = useRTL();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtlStyle]}>{t("termsOfUse")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Main Title */}
          <Text style={[styles.mainTitle, rtlStyle]}>
            {t("termsAndConditions")}
          </Text>
          <Text style={[styles.subtitle, rtlStyle]}>{t("termsSubtitle")}</Text>

          {/* Introduction */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("introduction")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("termsIntroduction")}
            </Text>
          </View>

          {/* Acceptance of Terms */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("acceptanceOfTerms")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("acceptanceOfTermsContent")}
            </Text>
          </View>

          {/* Changes to Platform */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("changesToPlatform")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("changesToPlatformContent")}
            </Text>
          </View>

          {/* User Responsibilities */}
          {/* <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>{t("userResponsibilities")}</Text>
            <Text style={[styles.sectionContent, rtlStyle]}>{t("userResponsibilitiesContent")}</Text>
          </View> */}

          {/* SyriaSouq's Responsibility */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("syriasouqResponsibility")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("syriasouqResponsibilityContent")}
            </Text>
          </View>

          {/* Listing Responsibility */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("listingResponsibility")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("listingResponsibilityContent")}
            </Text>
          </View>

          {/* Prohibited Activities */}
          {/* <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("prohibitedActivities")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("prohibitedActivitiesContent")}
            </Text>
          </View> */}

          {/* Breach of Terms */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("breachOfTerms")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("breachOfTermsContent")}
            </Text>
          </View>

          {/* Limitation of Liability */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("limitationOfLiability")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("limitationOfLiabilityContent")}
            </Text>
          </View>

          {/* Governing Law */}
          {/* <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("governingLaw")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("governingLawContent")}
            </Text>
          </View> */}

          {/* Last Updated */}
          {/* <View style={styles.lastUpdated}>
            <Text style={[styles.lastUpdatedText, rtlStyle]}>
              {t("lastUpdated")}: {t("lastUpdatedDate")}
            </Text>
          </View> */}
        </View>
      </ScrollView>
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
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    flex: 1,
    fontSize: Math.max(18, 1),
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    padding: 20,
  },
  mainTitle: {
    fontSize: Math.max(28, 1),
    fontWeight: "700",
    color: "#B80200",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Math.max(16, 1),
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#B80200",
  },
  sectionTitle: {
    fontSize: Math.max(20, 1),
    fontWeight: "700",
    color: "#B80200",
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: Math.max(15, 1),
    color: "#333",
    lineHeight: 24,
  },
  lastUpdated: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  lastUpdatedText: {
    fontSize: Math.max(14, 1),
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});
