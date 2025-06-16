"use client";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput, // Import TextInput for the email section
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

  // State for the email input
  const [email, setEmail] = React.useState(""); // Make sure to import React

  // Define your image URLs for the new feature icons
  const imageUrls = {
    searchIcon: "https://syriasouq.com/assets/service1-CqCzS8zT.png", // Replace with your actual URLs
    findIcon: "https://syriasouq.com/assets/service2-CWcpu7D3.png",
    connectIcon:
      "data:image/png;base64,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",
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#ffffff"
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

          <Image source={hand} style={styles.heroImage} resizeMode="cover" />
        </View>
        {/* Mission Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, rtlStyle]}>{t("ourMission")}</Text>
          <Text style={[styles.sectionText, rtlStyle]}>
            {t("missionDescription")}
          </Text>
        </View>
        {/* Features Section - New Content */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, rtlStyle]}>
            {t("howItWorksTitle")}
          </Text>

          {/* Search Feature */}
          <View
            style={[
              styles.newFeatureItem,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Image
              source={{ uri: imageUrls.searchIcon }}
              style={styles.newFeatureIcon}
            />
            <View style={styles.newFeatureContent}>
              <Text style={[styles.newFeatureTitle, rtlStyle]}>
                {t("searchTitle")}
              </Text>
              <Text style={[styles.newFeatureDescription, rtlStyle]}>
                {t("searchDescription")}
              </Text>
            </View>
          </View>

          {/* Find Feature */}
          <View
            style={[
              styles.newFeatureItem,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Image
              source={{ uri: imageUrls.findIcon }}
              style={styles.newFeatureIcon}
            />
            <View style={styles.newFeatureContent}>
              <Text style={[styles.newFeatureTitle, rtlStyle]}>
                {t("findTitle")}
              </Text>
              <Text style={[styles.newFeatureDescription, rtlStyle]}>
                {t("findDescription")}
              </Text>
            </View>
          </View>

          {/* Connect Feature */}
          <View
            style={[
              styles.newFeatureItem,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Image
              source={{ uri: imageUrls.connectIcon }}
              style={styles.newFeatureIcon}
            />
            <View style={styles.newFeatureContent}>
              <Text style={[styles.newFeatureTitle, rtlStyle]}>
                {t("connectTitle")}
              </Text>
              <Text style={[styles.newFeatureDescription, rtlStyle]}>
                {t("connectDescription")}
              </Text>
            </View>
          </View>
        </View>

        {/* Newsletter Signup Section */}
        <View style={[styles.section, styles.newsletterSection]}>
          <Text style={[styles.newsletterTitle, rtlStyle]}>
            {t("newsletterSignupTitle")}
          </Text>
          <Text style={[styles.newsletterDescription, rtlStyle]}>
            {t("newsletterSignupDescription")}
          </Text>

          <View style={[styles.emailInputContainer, rtlViewStyle]}>
            <TextInput
              style={[styles.emailInput, rtlStyle]}
              placeholder={t("enterYourEmail")}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity style={styles.subscribeButton}>
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          {/* <Text style={[styles.sectionTitle, rtlStyle]}>{t("getInTouch")}</Text> */}

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
    backgroundColor: "#323332",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#323332",
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
    marginTop: 0,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  // New styles for the image-based features and newsletter section
  newFeatureItem: {
    flexDirection: "row",
    alignItems: "center", // Align items vertically in the center
    marginBottom: 20,
  },
  newFeatureIcon: {
    width: 60, // Adjust size as needed
    height: 60, // Adjust size as needed
    borderRadius: 30, // Makes it a circle
    marginRight: 15,
    backgroundColor: "#e9ecef", // Placeholder background
    // You might want to add shadow here as well if desired
  },
  newFeatureContent: {
    paddingHorizontal: 20,
    flex: 1, // Take up remaining space
  },
  newFeatureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  newFeatureDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  newsletterSection: {
    paddingVertical: 30, // More vertical padding for this section
    alignItems: "center", // Center content horizontally
  },
  newsletterTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  newsletterDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 10, // Add some horizontal padding for description
  },
  emailInputContainer: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    height: 55,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  emailInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#1a1a1a",
    paddingRight: 10, // Ensure space for RTL languages
    paddingLeft: 10, // Ensure space for LTR languages
  },
  subscribeButton: {
    backgroundColor: "#B80200",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
// "use client";

// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useTranslation } from "react-i18next";
// import {
//   Dimensions,
//   Image,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import hand from "../assets/hand.jpg";
// import { useRTL } from "../hooks/useRTL";
// const { width } = Dimensions.get("window");

// export default function AboutUs() {
//   const { t } = useTranslation();
//   const { isRTL, rtlStyle, rtlViewStyle } = useRTL();
//   const router = useRouter();
//   const insets = useSafeAreaInsets();

//   const handleExploreListings = () => {
//     router.push("/(tabs)");
//   };

//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => router.back()}
//           hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
//         >
//           <Ionicons
//             name={isRTL ? "arrow-forward" : "arrow-back"}
//             size={24}
//             color="#ffffff"
//           />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>{t("aboutUs")}</Text>
//         <View style={styles.placeholder} />
//       </View>

//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.contentContainer}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Hero Section */}
//         <View style={styles.heroSection}>
//           <View style={styles.heroContent}>
//             <Text style={[styles.aboutUsLabel, rtlStyle]}>{t("aboutUs")}</Text>
//             <Text style={[styles.heroTitle, rtlStyle]}>
//               {t("syrianSalesWebsite")}
//             </Text>
//             <Text style={[styles.heroSubtitle, rtlStyle]}>
//               {t("aboutUsDescription")}
//             </Text>

//             <TouchableOpacity
//               style={styles.exploreButton}
//               onPress={handleExploreListings}
//             >
//               <Text style={styles.exploreButtonText}>
//                 {t("exploreListings")}
//               </Text>
//               <Ionicons
//                 name={isRTL ? "arrow-back" : "arrow-forward"}
//                 size={18}
//                 color="#B80200"
//               />
//             </TouchableOpacity>
//           </View>

//           <Image
//             // source={{
//             //   uri: "https://sjc.microlink.io/s6vs0TxR_wfdphUoxXYCuZVKKBClYczgQsF4_dOMPcA3x-9tV3TxQzNlTd-bpNDeP-zOIW6hrOLM-rsmLpvdsQ.jpeg",
//             // }}
//             source={hand}
//             style={styles.heroImage}
//             resizeMode="cover"
//           />
//         </View>

//         {/* Mission Section */}
//         <View style={styles.section}>
//           <Text style={[styles.sectionTitle, rtlStyle]}>{t("ourMission")}</Text>
//           <Text style={[styles.sectionText, rtlStyle]}>
//             {t("missionDescription")}
//           </Text>
//         </View>

//         {/* Features Section */}
//         <View style={styles.section}>
//           <Text style={[styles.sectionTitle, rtlStyle]}>
//             {t("whyChooseUs")}
//           </Text>

//           {[
//             {
//               icon: "shield-checkmark",
//               title: "safeAndSecure",
//               description: "safeAndSecureDesc",
//             },
//             {
//               icon: "people",
//               title: "communityDriven",
//               description: "communityDrivenDesc",
//             },
//             {
//               icon: "speedometer",
//               title: "fastAndEasy",
//               description: "fastAndEasyDesc",
//             },
//             {
//               icon: "phone-portrait",
//               title: "mobileOptimized",
//               description: "mobileOptimizedDesc",
//             },
//           ].map((feature, index) => (
//             <View
//               key={index}
//               style={[
//                 styles.featureItem,
//                 { flexDirection: isRTL ? "row-reverse" : "row" },
//               ]}
//             >
//               <View style={styles.featureIconContainer}>
//                 <Ionicons
//                   name={feature.icon as keyof (typeof Ionicons)["glyphMap"]}
//                   size={24}
//                   color="#B80200"
//                 />
//               </View>
//               <View style={styles.featureContent}>
//                 <Text style={[styles.featureTitle, rtlStyle]}>
//                   {t(feature.title)}
//                 </Text>
//                 <Text style={[styles.featureDescription, rtlStyle]}>
//                   {t(feature.description)}
//                 </Text>
//               </View>
//             </View>
//           ))}
//         </View>

//         {/* Contact Section */}
//         <View style={styles.section}>
//           <Text style={[styles.sectionTitle, rtlStyle]}>{t("getInTouch")}</Text>

//           <TouchableOpacity
//             style={styles.contactButton}
//             onPress={() => router.push("/contact-us")}
//           >
//             <Ionicons name="mail" size={18} color="#FFFFFF" />
//             <Text style={styles.contactButtonText}>{t("contactUs")}</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#323332",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     backgroundColor: "#323332",
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: 20,
//     backgroundColor: "rgba(255, 255, 255, 0.1)",
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#FFFFFF",
//   },
//   placeholder: {
//     width: 40,
//   },
//   scrollView: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//   },
//   contentContainer: {
//     paddingBottom: 30,
//   },
//   heroSection: {
//     backgroundColor: "#f8f9fa",
//     padding: 20,
//   },
//   heroContent: {
//     marginBottom: 20,
//   },
//   aboutUsLabel: {
//     fontSize: 14,
//     color: "#666",
//     backgroundColor: "#e9ecef",
//     alignSelf: "flex-start",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     marginBottom: 12,
//     overflow: "hidden",
//   },
//   heroTitle: {
//     fontSize: 28,
//     fontWeight: "800",
//     color: "#1a1a1a",
//     marginBottom: 12,
//   },
//   heroSubtitle: {
//     fontSize: 16,
//     color: "#666",
//     lineHeight: 24,
//     marginBottom: 20,
//   },
//   exploreButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#f8f9fa",
//     borderWidth: 1,
//     borderColor: "#B80200",
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     alignSelf: "flex-start",
//   },
//   exploreButtonText: {
//     color: "#B80200",
//     fontSize: 16,
//     fontWeight: "600",
//     marginRight: 8,
//   },
//   heroImage: {
//     width: "100%",
//     height: 250,
//     borderRadius: 12,
//     marginTop: 20,
//   },
//   section: {
//     backgroundColor: "#FFFFFF",
//     padding: 20,
//     marginTop: 16,
//     borderRadius: 12,
//     marginHorizontal: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#1a1a1a",
//     marginBottom: 12,
//   },
//   sectionText: {
//     fontSize: 15,
//     color: "#666",
//     lineHeight: 24,
//   },
//   featureItem: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     marginTop: 16,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   featureIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(184, 2, 0, 0.1)",
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 12,
//     marginLeft: 0,
//   },
//   featureContent: {
//     flex: 1,
//   },
//   featureTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#1a1a1a",
//     marginBottom: 4,
//   },
//   featureDescription: {
//     fontSize: 14,
//     color: "#666",
//     lineHeight: 20,
//   },
//   contactButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#B80200",
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     marginTop: 20,
//   },
//   contactButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "600",
//     marginLeft: 8,
//   },
// });
