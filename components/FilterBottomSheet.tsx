"use client";

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useRTL } from "../hooks/useRTL";
import RangeSlider from "./RangeSlider";

interface FilterProps {
  visible: boolean;
  onClose: () => void;
  min: string;
  max: string;
  onApply: (min: string, max: string) => void;
  title: string;
  formatLabel: (value: number) => string;
  defaultMin: number;
  defaultMax: number;
  step?: number;
}

// Export FilterModal directly for reuse in the new AllFiltersModal
export const FilterModal: React.FC<FilterProps> = ({
  visible,
  onClose,
  min,
  max,
  onApply,
  title,
  formatLabel,
  defaultMin,
  defaultMax,
  step = 1,
}) => {
  const { t } = useTranslation();
  const { rtlStyle } = useRTL();
  const { height } = Dimensions.get("window");
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const [showSlider, setShowSlider] = React.useState(false);

  const [localMin, setLocalMin] = React.useState(
    min ? Number.parseInt(min) : defaultMin
  );
  const [localMax, setLocalMax] = React.useState(
    max ? Number.parseInt(max) : defaultMax
  );

  useEffect(() => {
    if (visible) {
      // Reset local min/max when modal becomes visible, based on external props
      setLocalMin(min ? Number.parseInt(min) : defaultMin);
      setLocalMax(max ? Number.parseInt(max) : defaultMax);

      setShowSlider(false); // Hide slider initially to re-render it
      Animated.timing(bottomSheetAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        // Show slider only after animation completes
        setTimeout(() => {
          setShowSlider(true);
        }, 50); // Small delay to ensure layout is measured
      });
    } else {
      setShowSlider(false);
      Animated.timing(bottomSheetAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, min, max, defaultMin, defaultMax]); // Added dependencies to trigger on min/max changes

  const handleApply = () => {
    // If min/max are at default, send empty string to indicate no filter
    onApply(
      localMin === defaultMin ? "" : localMin.toString(),
      localMax === defaultMax ? "" : localMax.toString()
    );
    onClose();
  };

  const handleReset = () => {
    setLocalMin(defaultMin);
    setLocalMax(defaultMax);
  };

  const bottomSheetHeight = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.5],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheetContainer,
                { height: bottomSheetHeight },
              ]}
            >
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>{t(title)}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.sliderContent}>
                {showSlider ? (
                  <RangeSlider
                    min={defaultMin}
                    max={defaultMax}
                    step={step}
                    minValue={localMin}
                    maxValue={localMax}
                    onValueChange={(minValue, maxValue) => {
                      setLocalMin(minValue);
                      setLocalMax(maxValue);
                    }}
                    formatLabel={formatLabel}
                    title={t(title)} // Use translated title for RangeSlider
                  />
                ) : (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>{t("Loading")}...</Text>
                  </View>
                )}
              </View>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                >
                  <Text style={[styles.resetButtonText, rtlStyle]}>
                    {t("Reset")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApply}
                >
                  <Text style={[styles.applyButtonText, rtlStyle]}>
                    {t("Apply")}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export const YearFilterModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  yearMin: string;
  yearMax: string;
  onApply: (yearMin: string, yearMax: string) => void;
}> = ({ visible, onClose, yearMin, yearMax, onApply }) => {
  const { i18n } = useTranslation();
  const currentYear = new Date().getFullYear();

  const formatYear = (value: number) => {
    if (i18n.language === "ar") {
      return value
        .toString()
        .replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number.parseInt(d)]);
    }
    return value.toString();
  };

  return (
    <FilterModal
      visible={visible}
      onClose={onClose}
      min={yearMin}
      max={yearMax}
      onApply={onApply}
      title="Year"
      formatLabel={formatYear}
      defaultMin={1970}
      defaultMax={currentYear}
      step={1}
    />
  );
};

export const PriceFilterModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  priceMin: string;
  priceMax: string;
  onApply: (priceMin: string, priceMax: string) => void;
}> = ({ visible, onClose, priceMin, priceMax, onApply }) => {
  const { i18n, t } = useTranslation();

  const formatPrice = (value: number) => {
    // Correctly handle the "Any" label for the max value
    if (value === 1000000) return t("Any"); // Increased defaultMax for price to 1,000,000

    if (i18n.language === "ar") {
      return `$${value.toLocaleString("ar-EG")}`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <FilterModal
      visible={visible}
      onClose={onClose}
      min={priceMin}
      max={priceMax}
      onApply={onApply}
      title="Price"
      formatLabel={formatPrice}
      defaultMin={0}
      defaultMax={1000000} // Increased max price for better range
      step={1000}
    />
  );
};

export const KilometerFilterModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  kilometerMin: string;
  kilometerMax: string;
  onApply: (kilometerMin: string, kilometerMax: string) => void;
}> = ({ visible, onClose, kilometerMin, kilometerMax, onApply }) => {
  const { i18n, t } = useTranslation();

  const formatKilometer = (value: number) => {
    // Correctly handle the "Any" label for the max value
    if (value === 500000) return t("Any"); // Increased defaultMax for kilometer to 500,000

    if (i18n.language === "ar") {
      return `${value.toLocaleString("ar-EG")} ${t("km")}`;
    }
    return `${value.toLocaleString()} ${t("km")}`;
  };

  return (
    <FilterModal
      visible={visible}
      onClose={onClose}
      min={kilometerMin}
      max={kilometerMax}
      onApply={onApply}
      title="Kilometer"
      formatLabel={formatKilometer}
      defaultMin={0}
      defaultMax={500000} // Increased max kilometer for better range
      step={1000}
    />
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  sliderContent: {
    flex: 1,
    paddingVertical: 10,
    minHeight: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b80200",
    alignItems: "center",
  },
  resetButtonText: {
    color: "#b80200",
    fontSize: 16,
    fontWeight: "500",
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#b80200",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
});

// "use client";

// import { Ionicons } from "@expo/vector-icons";
// import React, { useEffect, useRef } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   Animated,
//   Dimensions,
//   Modal,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   View,
// } from "react-native";
// import { useRTL } from "../hooks/useRTL";
// import RangeSlider from "./RangeSlider";

// interface FilterProps {
//   visible: boolean;
//   onClose: () => void;
//   min: string;
//   max: string;
//   onApply: (min: string, max: string) => void;
//   title: string;
//   formatLabel: (value: number) => string;
//   defaultMin: number;
//   defaultMax: number;
//   step?: number;
// }

// const FilterModal: React.FC<FilterProps> = ({
//   visible,
//   onClose,
//   min,
//   max,
//   onApply,
//   title,
//   formatLabel,
//   defaultMin,
//   defaultMax,
//   step = 1,
// }) => {
//   const { t } = useTranslation();
//   const { rtlStyle } = useRTL();
//   const { height } = Dimensions.get("window");
//   const bottomSheetAnim = useRef(new Animated.Value(0)).current;
//   const [showSlider, setShowSlider] = React.useState(false);

//   const [localMin, setLocalMin] = React.useState(
//     min ? Number.parseInt(min) : defaultMin
//   );
//   const [localMax, setLocalMax] = React.useState(
//     max ? Number.parseInt(max) : defaultMax
//   );

//   useEffect(() => {
//     if (visible) {
//       setShowSlider(false); // Hide slider initially
//       Animated.timing(bottomSheetAnim, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: false,
//       }).start(() => {
//         // Show slider only after animation completes
//         setTimeout(() => {
//           setShowSlider(true);
//         }, 50);
//       });
//     } else {
//       setShowSlider(false);
//       Animated.timing(bottomSheetAnim, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: false,
//       }).start();
//     }
//   }, [visible]);

//   useEffect(() => {
//     if (visible) {
//       setLocalMin(min ? Number.parseInt(min) : defaultMin);
//       setLocalMax(max ? Number.parseInt(max) : defaultMax);
//     }
//   }, [min, max, defaultMin, defaultMax, visible]);

//   const handleApply = () => {
//     onApply(
//       localMin === defaultMin ? "" : localMin.toString(),
//       localMax === defaultMax ? "" : localMax.toString()
//     );
//     onClose();
//   };

//   const handleReset = () => {
//     setLocalMin(defaultMin);
//     setLocalMax(defaultMax);
//   };

//   const bottomSheetHeight = bottomSheetAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, height * 0.5],
//   });

//   return (
//     <Modal
//       visible={visible}
//       transparent={true}
//       animationType="none"
//       onRequestClose={onClose}
//     >
//       <TouchableWithoutFeedback onPress={onClose}>
//         <View style={styles.modalOverlay}>
//           <TouchableWithoutFeedback>
//             <Animated.View
//               style={[
//                 styles.bottomSheetContainer,
//                 { height: bottomSheetHeight },
//               ]}
//             >
//               <View style={styles.bottomSheetHeader}>
//                 <Text style={styles.bottomSheetTitle}>{t(title)}</Text>
//                 <TouchableOpacity onPress={onClose}>
//                   <Ionicons name="close" size={24} color="#333" />
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.sliderContent}>
//                 {showSlider ? (
//                   <RangeSlider
//                     min={defaultMin}
//                     max={defaultMax}
//                     step={step}
//                     minValue={localMin}
//                     maxValue={localMax}
//                     onValueChange={(minValue, maxValue) => {
//                       setLocalMin(minValue);
//                       setLocalMax(maxValue);
//                     }}
//                     formatLabel={formatLabel}
//                     title={t(title)}
//                   />
//                 ) : (
//                   <View style={styles.loadingContainer}>
//                     <Text style={styles.loadingText}>{t("Loading")}...</Text>
//                   </View>
//                 )}
//               </View>

//               <View style={styles.buttonsContainer}>
//                 <TouchableOpacity
//                   style={styles.resetButton}
//                   onPress={handleReset}
//                 >
//                   <Text style={[styles.resetButtonText, rtlStyle]}>
//                     {t("Reset")}
//                   </Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={styles.applyButton}
//                   onPress={handleApply}
//                 >
//                   <Text style={[styles.applyButtonText, rtlStyle]}>
//                     {t("Apply")}
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </Animated.View>
//           </TouchableWithoutFeedback>
//         </View>
//       </TouchableWithoutFeedback>
//     </Modal>
//   );
// };

// export const YearFilterModal: React.FC<{
//   visible: boolean;
//   onClose: () => void;
//   yearMin: string;
//   yearMax: string;
//   onApply: (yearMin: string, yearMax: string) => void;
// }> = ({ visible, onClose, yearMin, yearMax, onApply }) => {
//   const { i18n } = useTranslation();
//   const currentYear = new Date().getFullYear();

//   const formatYear = (value: number) => {
//     if (i18n.language === "ar") {
//       return value
//         .toString()
//         .replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number.parseInt(d)]);
//     }
//     return value.toString();
//   };

//   return (
//     <FilterModal
//       visible={visible}
//       onClose={onClose}
//       min={yearMin}
//       max={yearMax}
//       onApply={onApply}
//       title="Year"
//       formatLabel={formatYear}
//       defaultMin={1970}
//       defaultMax={currentYear}
//       step={1}
//     />
//   );
// };

// export const PriceFilterModal: React.FC<{
//   visible: boolean;
//   onClose: () => void;
//   priceMin: string;
//   priceMax: string;
//   onApply: (priceMin: string, priceMax: string) => void;
// }> = ({ visible, onClose, priceMin, priceMax, onApply }) => {
//   const { i18n, t } = useTranslation();

//   const formatPrice = (value: number) => {
//     if (value === 0) return "$0";
//     if (value === 100000) return t("Any");

//     if (i18n.language === "ar") {
//       return `$${value.toLocaleString("ar-EG")}`;
//     }

//     return `$${value.toLocaleString()}`;
//   };

//   return (
//     <FilterModal
//       visible={visible}
//       onClose={onClose}
//       min={priceMin}
//       max={priceMax}
//       onApply={onApply}
//       title="Price"
//       formatLabel={formatPrice}
//       defaultMin={0}
//       defaultMax={100000}
//       step={1000}
//     />
//   );
// };

// export const KilometerFilterModal: React.FC<{
//   visible: boolean;
//   onClose: () => void;
//   kilometerMin: string;
//   kilometerMax: string;
//   onApply: (kilometerMin: string, kilometerMax: string) => void;
// }> = ({ visible, onClose, kilometerMin, kilometerMax, onApply }) => {
//   const { i18n, t } = useTranslation();

//   const formatKilometer = (value: number) => {
//     if (value === 0) return "0 km";
//     if (value === 200000) return t("Any");

//     if (i18n.language === "ar") {
//       return `${value.toLocaleString("ar-EG")} ${t("km")}`;
//     }

//     return `${value.toLocaleString()} ${t("km")}`;
//   };

//   return (
//     <FilterModal
//       visible={visible}
//       onClose={onClose}
//       min={kilometerMin}
//       max={kilometerMax}
//       onApply={onApply}
//       title="Kilometer"
//       formatLabel={formatKilometer}
//       defaultMin={0}
//       defaultMax={200000}
//       step={1000}
//     />
//   );
// };

// const styles = StyleSheet.create({
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "flex-end",
//   },
//   bottomSheetContainer: {
//     backgroundColor: "#ffffff",
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingBottom: 20,
//   },
//   bottomSheetHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   bottomSheetTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//   },
//   sliderContent: {
//     flex: 1,
//     paddingVertical: 10,
//     minHeight: 120,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 40,
//   },
//   loadingText: {
//     fontSize: 16,
//     color: "#666",
//   },
//   buttonsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderTopWidth: 1,
//     borderTopColor: "#f0f0f0",
//     gap: 12,
//   },
//   resetButton: {
//     flex: 1,
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#b80200",
//     alignItems: "center",
//   },
//   resetButtonText: {
//     color: "#b80200",
//     fontSize: 16,
//     fontWeight: "500",
//   },
//   applyButton: {
//     flex: 1,
//     backgroundColor: "#b80200",
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   applyButtonText: {
//     color: "#ffffff",
//     fontSize: 16,
//     fontWeight: "500",
//   },
// });
