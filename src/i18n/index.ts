import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InitOptions } from 'i18next';

// Debug language initialization
console.log('[i18n] Starting i18n initialization');
console.log('[i18n] Device locale:', Localization.locale);

// Import translations
import en from './locales/en.json';
import fr from './locales/fr.json';
// The imports below will be uncommented as new languages are added
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import de from './locales/de.json';
import hi from './locales/hi.json';
import ko from './locales/ko.json';
// import pt from './locales/pt.json';
import it from './locales/it.json';
import es from './locales/es.json';
// import id from './locales/id.json';
// import nl from './locales/nl.json';
// import tr from './locales/tr.json';
// import fil from './locales/fil.json';
// import pl from './locales/pl.json';
// import sv from './locales/sv.json';
// import bg from './locales/bg.json';
// import ro from './locales/ro.json';
import ar from './locales/ar.json';
// import cs from './locales/cs.json';
// import el from './locales/el.json';
// import fi from './locales/fi.json';
// import hr from './locales/hr.json';
// import ms from './locales/ms.json';
// import sk from './locales/sk.json';
// import da from './locales/da.json';
// import ta from './locales/ta.json';
// import uk from './locales/uk.json';
// import ru from './locales/ru.json';

// Define supported languages
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'hi', 'ar', 'ja', 'zh', 'de', 'it', 'es', 'ko'];
// These will be uncommented and added as new language files are created
// export const SUPPORTED_LANGUAGES = [
//   'en', 'fr', 'ja', 'zh', 'de', 'hi', 'ko', 'pt', 'it', 'es', 
//   'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 
//   'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru'
// ];

console.log('[i18n] Supported languages:', SUPPORTED_LANGUAGES);

// Define resources for each language
const resources = {
  en: { translation: en },
  fr: { translation: fr },
  // The resources below will be uncommented as new languages are added
  ja: { translation: ja },
  zh: { translation: zh },
  de: { translation: de },
  hi: { translation: hi },
  ko: { translation: ko },
  // pt: { translation: pt },
  it: { translation: it },
  es: { translation: es },
  // id: { translation: id },
  // nl: { translation: nl },
  // tr: { translation: tr },
  // fil: { translation: fil },
  // pl: { translation: pl },
  // sv: { translation: sv },
  // bg: { translation: bg },
  // ro: { translation: ro },
  ar: { translation: ar }
  // cs: { translation: cs },
  // el: { translation: el },
  // fi: { translation: fi },
  // hr: { translation: hr },
  // ms: { translation: ms },
  // sk: { translation: sk },
  // da: { translation: da },
  // ta: { translation: ta },
  // uk: { translation: uk },
  // ru: { translation: ru }
};

// Debug resource loading
Object.keys(resources).forEach(lang => {
  console.log(`[i18n] Loaded translation for ${lang}:`, 
    resources[lang as keyof typeof resources].translation ? 'OK' : 'Missing');
});

// Detect device language
const getDeviceLanguage = () => {
  const locale = Localization.locale;
  const languageCode = locale.split('-')[0]; // Get first part of locale (e.g., 'en' from 'en-US')
  
  // Check if device language is supported, otherwise fallback to English
  const detected = SUPPORTED_LANGUAGES.includes(languageCode) ? languageCode : 'en';
  console.log('[i18n] Detected device language:', languageCode, 
    'Using:', detected, SUPPORTED_LANGUAGES.includes(languageCode) ? '(supported)' : '(fallback to en)');
  return detected;
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
  debug: __DEV__, // Enable debug in development mode
};

console.log('[i18n] Initializing with options:', {
  defaultLanguage: initOptions.lng,
  fallbackLanguage: initOptions.fallbackLng
});

i18n
  .use(initReactI18next)
  .init(initOptions)
  .then(() => {
    console.log('[i18n] Initialization complete. Current language:', i18n.language);
  })
  .catch(error => {
    console.error('[i18n] Initialization failed:', error);
  });

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  console.log('[i18n] Language changed to:', lng);
});

// Load stored language preference
AsyncStorage.getItem('userLanguage').then((language) => {
  if (language && SUPPORTED_LANGUAGES.includes(language)) {
    console.log('[i18n] Loading stored language preference:', language);
    i18n.changeLanguage(language).then(() => {
      console.log('[i18n] Applied stored language:', language, 'Current:', i18n.language);
    });
  } else {
    console.log('[i18n] No valid stored language found, using default:', i18n.language);
  }
});

export default i18n; 