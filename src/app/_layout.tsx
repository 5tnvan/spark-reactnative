import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/src/components/useColorScheme';
import AuthProvider from '../services/providers/AuthProvider';
export { ErrorBoundary, } from 'expo-router'; // Catch any errors thrown by the Layout component.
export const unstable_settings = { initialRouteName: '(auth)', }; // Ensure that reloading on `/modal` keeps a back button present.
SplashScreen.preventAutoHideAsync(); // Prevent the splash screen from auto-hiding before asset loading is complete.
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { ReadableStream } from "web-streams-polyfill";

if (typeof global.ReadableStream === "undefined") {
  global.ReadableStream =
    ReadableStream as unknown as typeof global.ReadableStream;
}

/** 
 * ROOT LAYOUT NAVIGATION
 * **/
function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        <Stack.Screen name="(profile)/[username]" options={{ }} />
        <Stack.Screen name="modals/tool-tip-register-modal" options={{ title: 'Tooltip', presentation: 'card', headerBackTitle: 'Back' }} />
        <Stack.Screen name="modals/tool-tip-login-modal" options={{ title: 'Tooltip', presentation: 'card', headerBackTitle: 'Back' }} />
        <Stack.Screen name="modals/tool-tip-create" options={{ title: 'Tooltip', presentation: 'card', headerBackTitle: 'Back' }} />
        <Stack.Screen name="modals/eula-terms-modal" options={{ title: 'Terms & Conditions', presentation: 'card', headerBackTitle: 'Back' }} />
      </Stack>
    </ThemeProvider>
  );
}

/** 
 * ROOT LAYOUT
 * Entry Point to the app
 * **/
export default function RootLayout() {

  //Loading fonts
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/NeueHaasDisplayRoman.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }


  return (
    <>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </>
    
  );
}
