import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from './contexts/AuthContext';
import { applyReactNavigationFixes } from './utils/reactNavPatch';
import { SafeTextProvider, applyTextPatch } from './utils/SafeTextProvider';

import { useColorScheme } from '@/hooks/useColorScheme';
import { CurrencyProvider } from './contexts/CurrencyContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  if (!loaded) {
    return null;
  }
  // Aplicar patches de texto para o React Navigation e componentes Text
  applyReactNavigationFixes();
  applyTextPatch();
    return (
    <SafeTextProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <CurrencyProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ headerShown: false }} />
              <Stack.Screen name="auth/register" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeTextProvider>
  );
}
