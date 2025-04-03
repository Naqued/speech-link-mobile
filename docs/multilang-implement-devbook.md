# Speech Link Mobile Multilanguage Implementation Guide

## Overview

This development guide outlines the plan to expand Speech Link Mobile to support multiple languages beyond the current English and French. We will implement all the languages supported by ElevenLabs TTS service, plus additional languages for the UI.

## Language Target List

We will implement support for the following languages:

| Language Code | Language Name | UI Support | TTS Support |
|---------------|---------------|------------|-------------|
| en            | English       | ✅          | ✅           |
| fr            | French        | ✅          | ✅           |
| ja            | Japanese      | 🔄          | ✅           |
| zh            | Chinese       | 🔄          | ✅           |
| de            | German        | 🔄          | ✅           |
| hi            | Hindi         | 🔄          | ✅           |
| ko            | Korean        | 🔄          | ✅           |
| pt            | Portuguese    | 🔄          | ✅           |
| it            | Italian       | 🔄          | ✅           |
| es            | Spanish       | 🔄          | ✅           |
| id            | Indonesian    | 🔄          | ✅           |
| nl            | Dutch         | 🔄          | ✅           |
| tr            | Turkish       | 🔄          | ✅           |
| fil           | Filipino      | 🔄          | ❓           |
| pl            | Polish        | 🔄          | ✅           |
| sv            | Swedish       | 🔄          | ❓           |
| bg            | Bulgarian     | 🔄          | ❓           |
| ro            | Romanian      | 🔄          | ❓           |
| ar            | Arabic        | 🔄          | ✅           |
| cs            | Czech         | 🔄          | ❓           |
| el            | Greek         | 🔄          | ❓           |
| fi            | Finnish       | 🔄          | ❓           |
| hr            | Croatian      | 🔄          | ❓           |
| ms            | Malay         | 🔄          | ❓           |
| sk            | Slovak        | 🔄          | ❓           |
| da            | Danish        | 🔄          | ❓           |
| ta            | Tamil         | 🔄          | ❓           |
| uk            | Ukrainian     | 🔄          | ❓           |
| ru            | Russian       | 🔄          | ✅           |

Legend:
- ✅ = Implemented/Supported
- 🔄 = Planned
- ❓ = Compatibility to be verified with ElevenLabs

## Implementation Plan

The implementation will follow a phased approach:

### Phase 1: Infrastructure Updates

1. Update the i18n configuration to support multiple languages
2. Create a language template file for standardized translations
3. Implement enhanced language selection UI with search capabilities
4. Implement RTL support for languages like Arabic

### Phase 2: Primary Language Rollout

Implement initial languages supported by ElevenLabs:
- Japanese (ja)
- Chinese (zh)
- German (de)
- Spanish (es)
- Italian (it)
- Portuguese (pt)
- Hindi (hi)
- Korean (ko)

### Phase 3: Secondary Language Rollout

Implement remaining languages:
- Indonesian (id)
- Dutch (nl)
- Turkish (tr)
- Filipino (fil)
- Polish (pl)
- Swedish (sv)
- Bulgarian (bg)
- Romanian (ro)
- Arabic (ar) with RTL support
- Czech (cs)
- Greek (el)
- Finnish (fi)
- Croatian (hr)
- Malay (ms)
- Slovak (sk)
- Danish (da)
- Tamil (ta)
- Ukrainian (uk)
- Russian (ru)

## Technical Implementation Details

### 1. i18n Configuration

Update the i18n configuration file to support all languages:

```typescript
// src/i18n/index.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
// ... other imports

// Define supported languages
export const SUPPORTED_LANGUAGES = [
  'en', 'fr', 'ja', 'zh', 'de', 'hi', 'ko', 'pt', 'it', 'es', 
  'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 
  'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru'
];

// Define resources for each language
const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ja: { translation: ja },
  zh: { translation: zh },
  // ... other resources
};

// ... rest of the configuration
```

### 2. Language Selection UI

Implement an improved language selection UI:

```tsx
// Language selection modal
const LanguageSelectionModal = () => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredLanguages = searchQuery 
    ? LANGUAGE_OPTIONS.filter(lang => 
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()))
    : LANGUAGE_OPTIONS;
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('language.select')}</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <TextInput
          style={styles.searchInput}
          placeholder={t('general.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <FlatList
          data={filteredLanguages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LanguageOption
              language={item}
              isSelected={i18n.language === item.id}
              onSelect={() => {
                i18n.changeLanguage(item.id);
                AsyncStorage.setItem('userLanguage', item.id);
                onClose();
              }}
            />
          )}
        />
      </SafeAreaView>
    </Modal>
  );
};

// Language option component
const LanguageOption = ({ language, isSelected, onSelect }) => {
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity
      style={styles.languageOption}
      onPress={onSelect}
    >
      <View style={styles.languageInfo}>
        <Text style={styles.languageFlag}>{language.flag}</Text>
        <View style={styles.languageTexts}>
          <Text style={styles.languageName}>{language.nativeName}</Text>
          <Text style={styles.languageNameTranslated}>
            {t(`languages.${language.id}`)}
          </Text>
        </View>
      </View>
      
      {isSelected && (
        <Ionicons name="checkmark" size={22} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
};
```

### 3. RTL Support

Implement RTL support for languages like Arabic:

```typescript
// src/utils/rtlLanguages.ts

// List of RTL languages
const RTL_LANGUAGES = ['ar'];

// Check if a language is RTL
export const isRTL = (languageCode: string): boolean => {
  return RTL_LANGUAGES.includes(languageCode);
};
```

```tsx
// In App.tsx or main component
import { I18nManager } from 'react-native';
import { isRTL } from './utils/rtlLanguages';

// Inside component with useEffect
useEffect(() => {
  const currentLang = i18n.language;
  const shouldBeRTL = isRTL(currentLang);
  
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
}, [i18n.language]);
```

### 4. Translation Management

Create a script to help with translation management:

```javascript
// scripts/translation-helper.js

const fs = require('fs');
const path = require('path');

// Get language code from command line
const langCode = process.argv[2];
if (!langCode) {
  console.error('Please provide a language code');
  process.exit(1);
}

// Paths
const EN_FILE = path.join(__dirname, '../src/i18n/locales/en.json');
const TARGET_FILE = path.join(__dirname, `../src/i18n/locales/${langCode}.json`);
const REPORT_FILE = path.join(__dirname, `../translation-report-${langCode}.md`);

// Read files
const enData = JSON.parse(fs.readFileSync(EN_FILE, 'utf8'));
let targetData = {};
if (fs.existsSync(TARGET_FILE)) {
  targetData = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
}

// Find missing keys
const missingKeys = [];
function findMissingKeys(enObj, targetObj, prefix = '') {
  for (const key in enObj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      // Create nested object if it doesn't exist
      if (!targetObj[key]) targetObj[key] = {};
      findMissingKeys(enObj[key], targetObj[key], currentPath);
    } else {
      // Check if key exists in target
      if (!targetObj[key]) {
        missingKeys.push(currentPath);
        targetObj[key] = ''; // Add empty string for missing key
      }
    }
  }
}

// Process files
findMissingKeys(enData, targetData);
fs.writeFileSync(TARGET_FILE, JSON.stringify(targetData, null, 2));

// Generate report
const report = `# Translation Report for ${langCode}\n\n` +
  `Missing keys: ${missingKeys.length}\n\n` +
  missingKeys.map(key => `- ${key}`).join('\n');
fs.writeFileSync(REPORT_FILE, report);

console.log(`Updated ${TARGET_FILE} with ${missingKeys.length} missing keys`);
console.log(`Report saved to ${REPORT_FILE}`);
```

### 5. ElevenLabs Integration

Create a utility to map language codes for ElevenLabs API:

```typescript
// src/utils/ttsLanguageMapping.ts

// Map our language codes to ElevenLabs language codes
export const mapToElevenLabsLanguageCode = (languageCode: string): string => {
  const mapping: {[key: string]: string} = {
    en: 'en', // English
    fr: 'fr', // French
    de: 'de', // German
    es: 'es', // Spanish
    it: 'it', // Italian
    pt: 'pt', // Portuguese
    nl: 'nl', // Dutch
    ja: 'ja', // Japanese
    zh: 'zh', // Chinese
    ko: 'ko', // Korean
    hi: 'hi', // Hindi
    ar: 'ar', // Arabic
    ru: 'ru', // Russian
    pl: 'pl', // Polish
    tr: 'tr', // Turkish
    id: 'id', // Indonesian
    // Add more as ElevenLabs adds support
  };
  
  // Return mapped code or default to English if not supported
  return mapping[languageCode] || 'en';
};
```

```typescript
// In TextToSpeechService.ts
import { mapToElevenLabsLanguageCode } from '../utils/ttsLanguageMapping';

// When calling ElevenLabs API
const generateSpeech = async (text: string, voice: Voice, language: string) => {
  const elevenLabsLanguage = mapToElevenLabsLanguageCode(language);
  
  const response = await fetch(`${API_URL}/text-to-speech`, {
    method: 'POST',
    headers: { /* headers */ },
    body: JSON.stringify({
      text,
      voice_id: voice.id,
      language: elevenLabsLanguage,
      // other parameters
    }),
  });
  
  // Handle response
};
```

## Testing Strategy

1. **Unit Testing**:
   - Test language detection functions
   - Test language switching in the app
   - Test RTL layout for Arabic

2. **Integration Testing**:
   - Test language selection UI
   - Test language persistence between app launches
   - Test ElevenLabs integration with different languages

3. **Manual Testing**:
   - Verify UI appearance in each language
   - Check for text overflow in translations
   - Test TTS functionality in each language
   - Verify correct RTL behavior

## Release Strategy

1. **Alpha Release**: Initial implementation with top languages (ja, zh, de, es)
2. **Beta Release**: Add remaining ElevenLabs-supported languages
3. **Full Release**: Complete implementation of all languages
4. **Ongoing Updates**: Add new languages as ElevenLabs expands support

## Maintenance Plan

1. Create an update process for adding new languages
2. Establish a translation review workflow
3. Define a process for handling new UI elements and translations
4. Schedule regular reviews of translation quality and coverage

## Conclusion

This implementation plan provides a comprehensive approach to adding multilanguage support to the Speech Link Mobile app. By following this guide, we will expand the app's reach to a global audience while ensuring high-quality translations and voice support across all implemented languages. 