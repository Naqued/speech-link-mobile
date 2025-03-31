import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InitOptions } from 'i18next';

// Import translations
import en from './locales/en.json';
import fr from './locales/fr.json';

// Define resources for each language
const resources = {
  en: { translation: en },
  fr: { translation: fr }
};

// Detect device language
const getDeviceLanguage = () => {
  const locale = Localization.locale;
  const languageCode = locale.split('-')[0]; // Get first part of locale (e.g., 'en' from 'en-US')
  return languageCode;
};

// Initialize i18n
const initOptions: InitOptions = {
  resources,
  lng: getDeviceLanguage(), // Use device language by default
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
};

i18n
  .use(initReactI18next)
  .init(initOptions);

// Load stored language preference
AsyncStorage.getItem('userLanguage').then((language) => {
  if (language) {
    i18n.changeLanguage(language);
  }
});

export default i18n; 