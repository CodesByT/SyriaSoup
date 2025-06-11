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

export default function PrivacyPolicy() {
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
        <Text style={[styles.headerTitle, rtlStyle]}>{t("privacyPolicy")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Main Title */}
          <Text style={[styles.mainTitle, rtlStyle]}>{t("privacyPolicy")}</Text>
          <Text style={[styles.subtitle, rtlStyle]}>
            {t("privacySubtitle")}
          </Text>

          {/* Introduction */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("introduction_privacy_policy")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("privacyIntroduction")}
            </Text>
          </View>

          {/* Aggregated Data */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("aggregatedData")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("aggregatedDataContent")}
            </Text>
          </View>

          {/* What Happens If You Refuse */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("refusePersonalData")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("refusePersonalDataContent")}
            </Text>
          </View>

          {/* Legal Basis */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("legalBasisProcessing")}
            </Text>
            <View style={styles.bulletPoints}>
              <View
                style={[
                  styles.bulletPoint,
                  { flexDirection: getFlexDirection() },
                ]}
              >
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.bulletText, rtlStyle]}>
                  <Text style={styles.boldText}>
                    {t("contractualNecessity")}:{" "}
                  </Text>
                  {t("contractualNecessityDesc")}
                </Text>
              </View>
              <View
                style={[
                  styles.bulletPoint,
                  { flexDirection: getFlexDirection() },
                ]}
              >
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.bulletText, rtlStyle]}>
                  <Text style={styles.boldText}>
                    {t("complianceWithLaw")}:{" "}
                  </Text>
                  {t("complianceWithLawDesc")}
                </Text>
              </View>
              <View
                style={[
                  styles.bulletPoint,
                  { flexDirection: getFlexDirection() },
                ]}
              >
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.bulletText, rtlStyle]}>
                  <Text style={styles.boldText}>{t("consent")}: </Text>
                  {t("consentDesc")}
                </Text>
              </View>
            </View>
          </View>

          {/* Data Security */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("dataSecure")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("dataSecureContent")}
            </Text>
          </View>

          {/* Data Retention */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("dataRetention")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("dataRetentionContent")}
            </Text>
          </View>

          {/* Your Rights */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("yourRights")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("yourRightsContent")}
            </Text>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("contactInformation")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("contactInformationContent")}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, rtlStyle]}>
              {t("thirdpartylinks")}
            </Text>
            <Text style={[styles.sectionContent, rtlStyle]}>
              {t("thirdpartylinksContent")}
            </Text>
          </View>

          {/* Last Updated
          <View style={styles.lastUpdated}>
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
    backgroundColor: "#1a1a1a",
  },
  header: {
    backgroundColor: "#1a1a1a",
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
  bulletPoints: {
    marginTop: 8,
  },
  bulletPoint: {
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bullet: {
    fontSize: Math.max(16, 1),
    color: "#B80200",
    fontWeight: "bold",
    marginRight: 8,
    marginLeft: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: Math.max(15, 1),
    color: "#333",
    lineHeight: 22,
  },
  boldText: {
    fontWeight: "700",
    color: "#1a1a1a",
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

// "use client";

// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useTranslation } from "react-i18next";
// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useRTL } from "../hooks/useRTL";

// export default function PrivacyPolicy() {
//   const { t } = useTranslation();
//   const { isRTL, rtlStyle, getFlexDirection } = useRTL();
//   const router = useRouter();
//   const insets = useSafeAreaInsets();

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       {/* Header */}
//       <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={styles.backButton}
//         >
//           <Ionicons
//             name={isRTL ? "arrow-forward" : "arrow-back"}
//             size={24}
//             color="#ffffff"
//           />
//         </TouchableOpacity>
//         <Text style={[styles.headerTitle, rtlStyle]}>{t("privacyPolicy")}</Text>
//         <View style={styles.placeholder} />
//       </View>

//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//         <View style={styles.contentContainer}>
//           {/* Main Title */}
//           <Text style={[styles.mainTitle, rtlStyle]}>{t("privacyPolicy")}</Text>
//           <Text style={[styles.subtitle, rtlStyle]}>
//             {t("privacySubtitle")}
//           </Text>

//           {/* Introduction */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, rtlStyle]}>
//               {t("introduction_privacy_policy")}
//             </Text>
//             <Text style={[styles.sectionContent, rtlStyle]}>
//               {t("privacyIntroduction")}
//             </Text>
//           </View>

//           {/* Aggregated Data */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, rtlStyle]}>
//               {t("aggregatedData")}
//             </Text>
//             <Text style={[styles.sectionContent, rtlStyle]}>
//               {t("aggregatedDataContent")}
//             </Text>
//           </View>

//           {/* What Happens If You Refuse */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, rtlStyle]}>
//               {t("refusePersonalData")}
//             </Text>
//             <Text style={[styles.sectionContent, rtlStyle]}>
//               {t("refusePersonalDataContent")}
//             </Text>
//           </View>

//           {/* Legal Basis */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, rtlStyle]}>
//               {t("legalBasisProcessing")}
//             </Text>
//             <View style={styles.bulletPoints}>
//               <View
//                 style={[
//                   styles.bulletPoint,
//                   { flexDirection: getFlexDirection() },
//                 ]}
//               >
//                 <Text style={styles.bullet}>•</Text>
//                 <Text style={[styles.bulletText, rtlStyle]}>
//                   <Text style={styles.boldText}>
//                     {t("contractualNecessity")}:{" "}
//                   </Text>
//                   {t("contractualNecessityDesc")}
//                 </Text>
//               </View>
//               <View
//                 style={[
//                   styles.bulletPoint,
//                   { flexDirection: getFlexDirection() },
//                 ]}
//               >
//                 <Text style={styles.bullet}>•</Text>
//                 <Text style={[styles.bulletText, rtlStyle]}>
//                   <Text style={styles.boldText}>
//                     {t("complianceWithLaw")}:{" "}
//                   </Text>
//                   {t("complianceWithLawDesc")}
//                 </Text>
//               </View>
//               <View
//                 style={[
//                   styles.bulletPoint,
//                   { flexDirection: getFlexDirection() },
//                 ]}
//               >
//                 <Text style={styles.bullet}>•</Text>
//                 <Text style={[styles.bulletText, rtlStyle]}>
//                   <Text style={styles.boldText}>{t("consent")}: </Text>
//                   {t("consentDesc")}
//                 </Text>
//               </View>
//             </View>
//           </View>

//           {/* Data Security */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, rtlStyle]}>
//               {t("dataSecure")}
//             </Text>
//             <Text style={[styles.sectionContent, rtlStyle]}>
//               {t("dataSecureContent")}
//             </Text>
//           </View>

//           {/* Data Retention */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, rtlStyle]}>
//               {t("dataRetention")}
//             </Text>
//             <Text style={[styles.sectionContent, rtlStyle]}>
//               {t("dataRetentionContent")}
//             </Text>
//           </View>

//           {/* Your Rights */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, rtlStyle]}>
//               {t("yourRights")}
//             </Text>
//             <Text style={[styles.sectionContent, rtlStyle]}>
//               {t("yourRightsContent")}
//             </Text>
//           </View>

//           {/* Contact Information */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, rtlStyle]}>
//               {t("contactInformation")}
//             </Text>
//             <Text style={[styles.sectionContent, rtlStyle]}>
//               {t("contactInformationContent")}
//             </Text>
//           </View>

//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, rtlStyle]}>
//               {t("thirdpartylinks")}
//             </Text>
//             <Text style={[styles.sectionContent, rtlStyle]}>
//               {t("thirdpartylinksContent")}
//             </Text>
//           </View>

//           {/* Last Updated
//           <View style={styles.lastUpdated}>
//             <Text style={[styles.lastUpdatedText, rtlStyle]}>
//               {t("lastUpdated")}: {t("lastUpdatedDate")}
//             </Text>
//           </View> */}
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#1a1a1a",
//   },
//   header: {
//     backgroundColor: "#1a1a1a",
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     alignItems: "center",
//     justifyContent: "space-between",
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     flex: 1,
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#ffffff",
//     textAlign: "center",
//     marginHorizontal: 16,
//   },
//   placeholder: {
//     width: 40,
//   },
//   content: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//   },
//   contentContainer: {
//     padding: 20,
//   },
//   mainTitle: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#4285f4",
//     textAlign: "center",
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "#666",
//     textAlign: "center",
//     marginBottom: 30,
//     lineHeight: 22,
//   },
//   section: {
//     backgroundColor: "#ffffff",
//     borderRadius: 12,
//     padding: 20,
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#4285f4",
//     marginBottom: 12,
//   },
//   sectionContent: {
//     fontSize: 15,
//     color: "#333",
//     lineHeight: 24,
//   },
//   bulletPoints: {
//     marginTop: 8,
//   },
//   bulletPoint: {
//     alignItems: "flex-start",
//     marginBottom: 12,
//   },
//   bullet: {
//     fontSize: 16,
//     color: "#4285f4",
//     fontWeight: "bold",
//     marginRight: 8,
//     marginLeft: 8,
//     marginTop: 2,
//   },
//   bulletText: {
//     flex: 1,
//     fontSize: 15,
//     color: "#333",
//     lineHeight: 22,
//   },
//   boldText: {
//     fontWeight: "700",
//     color: "#1a1a1a",
//   },
//   lastUpdated: {
//     backgroundColor: "#f0f0f0",
//     borderRadius: 8,
//     padding: 16,
//     marginTop: 20,
//     marginBottom: 40,
//   },
//   lastUpdatedText: {
//     fontSize: 14,
//     color: "#666",
//     textAlign: "center",
//     fontStyle: "italic",
//   },
// });
