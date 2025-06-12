"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <ChatProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
                title: "contact-us",
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
                title: "Privacy Policy",
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
            <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
          </Stack>
        </ChatProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}

// import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
// import { useFonts } from "expo-font";
// import { Stack } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import "react-native-reanimated";
// // import Toast from "react-native-toast-message";
// import { ChatProvider } from "@/contexts/ChatContext";
// import { AuthProvider } from "../contexts/AuthContext";
// export default function RootLayout() {
//   const [loaded] = useFonts({
//     SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
//   });

//   if (!loaded) {
//     console.log("RootLayout: Waiting for fonts to load...");
//     return null;
//   }

//   console.log("RootLayout: Rendering app layout");

//   return (
//     <>
//       {/* // <I18nextProvider i18n={i18n}> */}
//       <AuthProvider>
//         <ChatProvider>
//           <ThemeProvider value={DefaultTheme}>
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
//                   title: "edit _listings",
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
//             <StatusBar style="auto" />
//           </ThemeProvider>
//         </ChatProvider>
//       </AuthProvider>
//       {/* </I18nextProvider> */}
//       {/* <Toast /> */}
//     </>
//   );
// }
