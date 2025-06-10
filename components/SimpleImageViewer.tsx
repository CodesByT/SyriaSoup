"use client";

import React, { useRef, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface SimpleImageViewerProps {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function SimpleImageViewer({
  visible,
  images,
  initialIndex,
  onClose,
}: SimpleImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoadingStates, setImageLoadingStates] = useState<{
    [key: number]: boolean;
  }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>(
    {}
  );
  const flatListRef = useRef<FlatList>(null);

  const scrollViewRefs = useRef<(ScrollView | null)[]>([]);
  // We'll keep track of zoom scales if needed for future features,
  // but won't use it for programmatic reset in this version.
  const [currentZoomScales, setCurrentZoomScales] = useState<{
    [key: number]: number;
  }>({});

  const constructImageUrl = (imagePath: string): string => {
    const API_BASE_URL = "https://api.syriasouq.com";

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    return `${API_BASE_URL}/Uploads/cars/${imagePath}`;
  };

  const handleImageLoadStart = (index: number) => {
    setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
    setImageErrors((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageLoadEnd = (index: number) => {
    setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
    setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
  };

  // REMOVED: The programmatic resetZoomForCurrentIndex via zoomToRect.
  // The interactive pinch-to-zoom will still work due to maximumZoomScale.
  const resetZoomForCurrentIndex = () => {
    // console.warn("Programmatic zoom reset is not available on this platform or due to underlying issues.");
    // We can still try to reset the internal state if needed,
    // but it won't affect the native zoom level managed by ScrollView's pinch gesture.
    setCurrentZoomScales((prev) => ({ ...prev, [currentIndex]: 1 }));
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);

    if (roundIndex !== currentIndex) {
      // REMOVED: programmatic reset zoom on the *previous* image when swiping.
      // The user will need to manually un-zoom if they navigate away from a zoomed image.
      // if (Platform.OS !== "web") {
      //   const previousScrollView = scrollViewRefs.current[currentIndex];
      //   if (previousScrollView) {
      //     previousScrollView.scrollResponderZoomTo({
      //       x: 0,
      //       y: 0,
      //       width: screenWidth,
      //       height: screenHeight,
      //       animated: false,
      //     });
      //     setCurrentZoomScales((prev) => ({ ...prev, [currentIndex]: 1 }));
      //   }
      // }
      setCurrentIndex(roundIndex);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      // REMOVED: programmatic zoom reset before navigating.
      // resetZoomForCurrentIndex();
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      // REMOVED: programmatic zoom reset before navigating.
      // resetZoomForCurrentIndex();
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const renderImage = ({ item, index }: { item: string; index: number }) => {
    const isLoading = imageLoadingStates[index];
    const hasError = imageErrors[index];
    const imageUrl = constructImageUrl(item);

    return (
      <View style={styles.imageContainer}>
        {!hasError ? (
          <>
            <ScrollView
              ref={(el) => {
                scrollViewRefs.current[index] = el;
              }}
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              maximumZoomScale={5} // Max zoom level (enables interactive pinch-to-zoom)
              minimumZoomScale={1} // Minimum zoom level
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent // Centers content when zoomed out
              // These callbacks read zoomScale, which should be fine even if zoomToRect is not available.
              onScrollEndDrag={(e) => {
                if (e.nativeEvent.zoomScale !== undefined) {
                  setCurrentZoomScales((prev) => ({
                    ...prev,
                    [index]: e.nativeEvent.zoomScale,
                  }));
                }
              }}
              onMomentumScrollEnd={(e) => {
                if (e.nativeEvent.zoomScale !== undefined) {
                  setCurrentZoomScales((prev) => ({
                    ...prev,
                    [index]: e.nativeEvent.zoomScale,
                  }));
                }
              }}
              onLayout={() => {
                // Initialize zoom scale for this image if not already set
                if (currentZoomScales[index] === undefined) {
                  setCurrentZoomScales((prev) => ({ ...prev, [index]: 1 }));
                }
              }}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.fullScreenImage}
                contentFit="contain"
                onLoadStart={() => handleImageLoadStart(index)}
                onLoadEnd={() => handleImageLoadEnd(index)}
                onError={() => handleImageError(index)}
              />
            </ScrollView>

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="image-outline" size={80} color="#666" />
            <Text style={styles.errorText}>Failed to load image</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setImageErrors((prev) => ({ ...prev, [index]: false }));
                setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      // Removed programmatic zoom reset from here.
      // The FlatList scroll to initialIndex still works fine.
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
        // resetZoomForCurrentIndex(); // This line is no longer necessary as programmatic reset is removed
      }, 100);
    }
  }, [visible, initialIndex]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={30} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.imageCounter}>
            {currentIndex + 1} / {images.length}
          </Text>
          {/* REMOVED: Reset Zoom Button, as programmatic reset via zoomToRect is removed.
              The layout is now simplified without it. */}
          {/* If you need a placeholder for spacing, you can add a <View style={styles.placeholder} /> here */}
        </View>

        {/* Image Viewer */}
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImage}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item, index) => `simple-fullscreen-${index}-${item}`}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity style={styles.leftArrow} onPress={goToPrevious}>
                <Ionicons name="chevron-back" size={30} color="#ffffff" />
              </TouchableOpacity>
            )}

            {currentIndex < images.length - 1 && (
              <TouchableOpacity style={styles.rightArrow} onPress={goToNext}>
                <Ionicons name="chevron-forward" size={30} color="#ffffff" />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>{` Swipe to navigate`}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between", // Changed to space-between
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10,
  },
  closeButton: {
    padding: 10,
  },
  imageCounter: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // resetButton and placeholder styles are no longer directly used in the JSX
  // resetButton: {
  //   padding: 10,
  // },
  // placeholder: {
  //   width: 44,
  // },
  imageContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: screenHeight,
  },
  fullScreenImage: {
    width: "100%", // Crucial for zoom
    height: "100%", // Crucial for zoom
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#b80200",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  leftArrow: {
    position: "absolute",
    left: 20,
    top: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    padding: 10,
  },
  rightArrow: {
    position: "absolute",
    right: 20,
    top: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    padding: 10,
  },
  instructions: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
// "use client";

// import React, { useRef, useState } from "react";

// import { Ionicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
// import {
//   ActivityIndicator,
//   Dimensions,
//   FlatList,
//   Modal,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// interface SimpleImageViewerProps {
//   visible: boolean;
//   images: string[];
//   initialIndex: number;
//   onClose: () => void;
// }

// export default function SimpleImageViewer({
//   visible,
//   images,
//   initialIndex,
//   onClose,
// }: SimpleImageViewerProps) {
//   const [currentIndex, setCurrentIndex] = useState(initialIndex);
//   const [imageLoadingStates, setImageLoadingStates] = useState<{
//     [key: number]: boolean;
//   }>({});
//   const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>(
//     {}
//   );
//   const flatListRef = useRef<FlatList>(null);

//   const constructImageUrl = (imagePath: string): string => {
//     const API_BASE_URL = "https://api.syriasouq.com";

//     if (imagePath.startsWith("http")) {
//       return imagePath;
//     }

//     return `${API_BASE_URL}/Uploads/cars/${imagePath}`;
//   };

//   const handleImageLoadStart = (index: number) => {
//     setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//     setImageErrors((prev) => ({ ...prev, [index]: false }));
//   };

//   const handleImageLoadEnd = (index: number) => {
//     setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
//   };

//   const handleImageError = (index: number) => {
//     setImageErrors((prev) => ({ ...prev, [index]: true }));
//     setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
//   };

//   const handleScroll = (event: any) => {
//     const slideSize = event.nativeEvent.layoutMeasurement.width;
//     const index = event.nativeEvent.contentOffset.x / slideSize;
//     const roundIndex = Math.round(index);
//     setCurrentIndex(roundIndex);
//   };

//   const goToPrevious = () => {
//     if (currentIndex > 0) {
//       flatListRef.current?.scrollToIndex({
//         index: currentIndex - 1,
//         animated: true,
//       });
//     }
//   };

//   const goToNext = () => {
//     if (currentIndex < images.length - 1) {
//       flatListRef.current?.scrollToIndex({
//         index: currentIndex + 1,
//         animated: true,
//       });
//     }
//   };

//   const renderImage = ({ item, index }: { item: string; index: number }) => {
//     const isLoading = imageLoadingStates[index];
//     const hasError = imageErrors[index];
//     const imageUrl = constructImageUrl(item);

//     return (
//       <View style={styles.imageContainer}>
//         {!hasError ? (
//           <>
//             <ScrollView
//               style={styles.scrollContainer}
//               contentContainerStyle={styles.scrollContent}
//               maximumZoomScale={5}
//               minimumZoomScale={0.5}
//               showsHorizontalScrollIndicator={false}
//               showsVerticalScrollIndicator={false}
//               centerContent
//             >
//               <Image
//                 source={{ uri: imageUrl }}
//                 style={styles.fullScreenImage}
//                 contentFit="contain"
//                 onLoadStart={() => handleImageLoadStart(index)}
//                 onLoadEnd={() => handleImageLoadEnd(index)}
//                 onError={() => handleImageError(index)}
//               />
//             </ScrollView>

//             {isLoading && (
//               <View style={styles.loadingOverlay}>
//                 <ActivityIndicator size="large" color="#ffffff" />
//                 <Text style={styles.loadingText}>Loading...</Text>
//               </View>
//             )}
//           </>
//         ) : (
//           <View style={styles.errorContainer}>
//             <Ionicons name="image-outline" size={80} color="#666" />
//             <Text style={styles.errorText}>Failed to load image</Text>
//             <TouchableOpacity
//               style={styles.retryButton}
//               onPress={() => {
//                 setImageErrors((prev) => ({ ...prev, [index]: false }));
//                 setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//               }}
//             >
//               <Text style={styles.retryButtonText}>Retry</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>
//     );
//   };

//   // Reset to initial index when modal opens
//   React.useEffect(() => {
//     if (visible && initialIndex !== currentIndex) {
//       setCurrentIndex(initialIndex);
//       setTimeout(() => {
//         flatListRef.current?.scrollToIndex({
//           index: initialIndex,
//           animated: false,
//         });
//       }, 100);
//     }
//   }, [visible, initialIndex]);

//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <StatusBar hidden />
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity style={styles.closeButton} onPress={onClose}>
//             <Ionicons name="close" size={30} color="#ffffff" />
//           </TouchableOpacity>
//           <Text style={styles.imageCounter}>
//             {currentIndex + 1} / {images.length}
//           </Text>
//           <View style={styles.placeholder} />
//         </View>

//         {/* Image Viewer */}
//         <FlatList
//           ref={flatListRef}
//           data={images}
//           renderItem={renderImage}
//           horizontal
//           pagingEnabled
//           showsHorizontalScrollIndicator={false}
//           onScroll={handleScroll}
//           scrollEventThrottle={16}
//           keyExtractor={(item, index) => `simple-fullscreen-${index}-${item}`}
//           initialScrollIndex={initialIndex}
//           getItemLayout={(_, index) => ({
//             length: screenWidth,
//             offset: screenWidth * index,
//             index,
//           })}
//         />

//         {/* Navigation Arrows */}
//         {images.length > 1 && (
//           <>
//             {currentIndex > 0 && (
//               <TouchableOpacity style={styles.leftArrow} onPress={goToPrevious}>
//                 <Ionicons name="chevron-back" size={30} color="#ffffff" />
//               </TouchableOpacity>
//             )}

//             {currentIndex < images.length - 1 && (
//               <TouchableOpacity style={styles.rightArrow} onPress={goToNext}>
//                 <Ionicons name="chevron-forward" size={30} color="#ffffff" />
//               </TouchableOpacity>
//             )}
//           </>
//         )}

//         {/* Instructions */}
//         <View style={styles.instructions}>
//           <Text style={styles.instructionText}>Swipe to navigate</Text>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#000000",
//   },
//   header: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingTop: 50,
//     paddingBottom: 20,
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     zIndex: 10,
//   },
//   closeButton: {
//     padding: 10,
//   },
//   imageCounter: {
//     color: "#ffffff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   placeholder: {
//     width: 44,
//   },
//   imageContainer: {
//     width: screenWidth,
//     height: screenHeight,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   scrollContainer: {
//     flex: 1,
//     width: "100%",
//     height: "100%",
//   },
//   scrollContent: {
//     flexGrow: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     minHeight: screenHeight,
//   },
//   fullScreenImage: {
//     width: screenWidth,
//     height: screenHeight * 0.8,
//   },
//   loadingOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.7)",
//   },
//   loadingText: {
//     color: "#ffffff",
//     fontSize: 16,
//     marginTop: 10,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 40,
//   },
//   errorText: {
//     color: "#ffffff",
//     fontSize: 16,
//     textAlign: "center",
//     marginTop: 20,
//     marginBottom: 20,
//   },
//   retryButton: {
//     backgroundColor: "#b80200",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: "#ffffff",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   leftArrow: {
//     position: "absolute",
//     left: 20,
//     top: "50%",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     borderRadius: 25,
//     padding: 10,
//   },
//   rightArrow: {
//     position: "absolute",
//     right: 20,
//     top: "50%",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     borderRadius: 25,
//     padding: 10,
//   },
//   instructions: {
//     position: "absolute",
//     bottom: 50,
//     left: 0,
//     right: 0,
//     alignItems: "center",
//   },
//   instructionText: {
//     color: "rgba(255, 255, 255, 0.7)",
//     fontSize: 12,
//     textAlign: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     paddingHorizontal: 20,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
// });
