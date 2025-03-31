import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { I18nextProvider } from 'react-i18next';

// Providers
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// i18n
import i18n from './src/i18n';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  );
} 