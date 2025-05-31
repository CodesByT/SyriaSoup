import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    console.log("RootLayout: Waiting for fonts to load...");
    return null;
  }

  console.log("RootLayout: Rendering app layout");

  return (
    // <I18nextProvider i18n={i18n}>
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
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
            name="car-details"
            options={{ title: "Car Details", presentation: "modal" }}
          />
          <Stack.Screen
            name="(auth)/login"
            options={{ title: "Login", presentation: "modal" }}
          />
          <Stack.Screen
            name="(auth)/register"
            options={{ title: "Register", presentation: "modal" }}
          />
          <Stack.Screen
            name="(auth)/forgot-password"
            options={{ title: "Forgot Password", presentation: "modal" }}
          />
          <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
    // </I18nextProvider>
  );
}
