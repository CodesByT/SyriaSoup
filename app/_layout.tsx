import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { StyleSheet, View } from "react-native"; // Added View for wrapping
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context"; // Added useSafeAreaInsets
import Toastable from "react-native-toastable"; // Added Toastable import
import i18n from "../i18n";
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const { bottom } = useSafeAreaInsets(); // Added to get safe area bottom inset

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <ChatProvider>
              <View style={{ flex: 1 }}>
                {/* Added View to wrap Stack and Toastable */}
                <Stack>
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="all-cars"
                    options={{
                      title: "All Cars",
                      presentation: "modal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="contact-us"
                    options={{
                      title: "Contact Us",
                      presentation: "modal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="about-us"
                    options={{
                      title: "About Us",
                      presentation: "modal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="privacy-policy"
                    options={{
                      title: "Privacy Policy",
                      presentation: "modal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="reset-password"
                    options={{
                      title: "Reset Password",
                      presentation: "modal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="terms-of-use"
                    options={{
                      title: "Terms of Use",
                      presentation: "modal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="car-details"
                    options={{
                      title: "Car Details",
                      presentation: "modal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/login"
                    options={{
                      title: "Login",
                      presentation: "modal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/register"
                    options={{
                      title: "Register",
                      presentation: "modal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/forgot-password"
                    options={{
                      title: "Forgot Password",
                      presentation: "modal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="edit-listing"
                    options={{
                      title: "Edit Listing",
                      presentation: "modal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="conversation"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="+not-found"
                    options={{ title: "Oops!" }}
                  />
                </Stack>
                <Toastable
                  statusMap={{
                    success: "green",
                    danger: "yellow",
                    warning: "red",
                    info: "blue",
                  }}
                  offset={bottom}
                />
              </View>
            </ChatProvider>
          </AuthProvider>
        </I18nextProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensure GestureHandlerRootView takes full screen
  },
});
// "use client";

// import { AuthProvider } from "@/contexts/AuthContext";
// import { ChatProvider } from "@/contexts/ChatContext";
// import { useFonts } from "expo-font";
// import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
// import { useEffect } from "react";
// import { I18nextProvider } from "react-i18next";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import i18n from "../i18n";
// // Prevent the splash screen from auto-hiding before asset loading is complete
// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   const { top } = useSafeAreaInsets();
//   const [loaded] = useFonts({
//     SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
//   });

//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!loaded) {
//     return null;
//   }

//   return (
//     <>
//       <I18nextProvider i18n={i18n}>
//         <AuthProvider>
//           <ChatProvider>
//             <Stack>
//               <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//               <Stack.Screen
//                 name="all-cars"
//                 options={{
//                   title: "All Cars",
//                   presentation: "modal",
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="contact-us"
//                 options={{
//                   title: "contact-us",
//                   presentation: "modal",
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="about-us"
//                 options={{
//                   title: "About Us",
//                   presentation: "modal",
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="privacy-policy"
//                 options={{
//                   title: "Privacy Policy",
//                   presentation: "modal",
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="reset-password"
//                 options={{
//                   title: "Privacy Policy",
//                   presentation: "modal",
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="terms-of-use"
//                 options={{
//                   title: "Terms of Use",
//                   presentation: "modal",
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="car-details"
//                 options={{
//                   title: "Car Details",
//                   presentation: "modal",
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="(auth)/login"
//                 options={{
//                   title: "Login",
//                   presentation: "modal",
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="(auth)/register"
//                 options={{
//                   title: "Register",
//                   presentation: "modal",
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="(auth)/forgot-password"
//                 options={{
//                   title: "Forgot Password",
//                   presentation: "modal",
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="edit-listing"
//                 options={{
//                   title: "Edit Listing",
//                   presentation: "modal",
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="conversation"
//                 options={{ headerShown: false }}
//               />
//               <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
//             </Stack>
//           </ChatProvider>
//         </AuthProvider>
//       </I18nextProvider>
//     </>
//   );
// }
