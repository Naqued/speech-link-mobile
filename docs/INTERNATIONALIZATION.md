# Internationalization (i18n) Guide

This document explains how to add and manage translations for the Speech Link mobile app.

## Supported Languages

The app currently supports or is planned to support the following languages:

| Language Code | Language Name    | Status      |
|---------------|------------------|-------------|
| en            | English          | ✅ Complete  |
| fr            | French           | ✅ Complete  |
| ja            | Japanese         | 🔄 Planned   |
| zh            | Chinese          | 🔄 Planned   |
| de            | German           | 🔄 Planned   |
| hi            | Hindi            | 🔄 Planned   |
| ko            | Korean           | 🔄 Planned   |
| pt            | Portuguese       | 🔄 Planned   |
| it            | Italian          | 🔄 Planned   |
| es            | Spanish          | 🔄 Planned   |
| id            | Indonesian       | 🔄 Planned   |
| nl            | Dutch            | 🔄 Planned   |
| tr            | Turkish          | 🔄 Planned   |
| fil           | Filipino         | 🔄 Planned   |
| pl            | Polish           | 🔄 Planned   |
| sv            | Swedish          | 🔄 Planned   |
| bg            | Bulgarian        | 🔄 Planned   |
| ro            | Romanian         | 🔄 Planned   |
| ar            | Arabic           | 🔄 Planned   |
| cs            | Czech            | 🔄 Planned   |
| el            | Greek            | 🔄 Planned   |
| fi            | Finnish          | 🔄 Planned   |
| hr            | Croatian         | 🔄 Planned   |
| ms            | Malay            | 🔄 Planned   |
| sk            | Slovak           | 🔄 Planned   |
| da            | Danish           | 🔄 Planned   |
| ta            | Tamil            | 🔄 Planned   |
| uk            | Ukrainian        | 🔄 Planned   |
| ru            | Russian          | 🔄 Planned   |

## Project Structure

The internationalization system is built using:

- **i18next**: Core internationalization framework
- **react-i18next**: React bindings for i18next
- **expo-localization**: For device language detection

Key directories and files:

- `src/i18n/index.ts`: Main i18n configuration file
- `src/i18n/locales/`: Directory containing translation JSON files
- `src/i18n/locales/en.json`: English translations (base language)
- `src/i18n/locales/fr.json`: French translations
- `src/i18n/templates/language-template.json`: Template for new language files
- `src/utils/rtlLanguages.ts`: Utility for right-to-left language support

## Adding a New Language

### Step 1: Create the language JSON file

1. Copy the `src/i18n/templates/language-template.json` file to `src/i18n/locales/[lang-code].json`
2. Replace `[lang-code]` with the two-letter ISO code for the language (e.g., `ja` for Japanese)

```bash
# Example: Add Japanese
cp src/i18n/templates/language-template.json src/i18n/locales/ja.json
```

### Step 2: Translate the content

1. Fill in all the empty string values in the new language file with appropriate translations
2. You can use the helper script to identify missing translations:

```bash
# Run the translation helper script
node scripts/translation-helper.js [lang-code]

# Example:
node scripts/translation-helper.js ja
```

This will generate a report showing missing translations and create a Markdown file with the results.

### Step 3: Update the i18n configuration

Modify `src/i18n/index.ts` to include the new language:

1. Uncomment the import line for your language
   ```typescript
   import ja from './locales/ja.json';
   ```

2. Uncomment the resource entry in the resources object
   ```typescript
   ja: { translation: ja },
   ```

3. Add the language code to the SUPPORTED_LANGUAGES array
   ```typescript
   export const SUPPORTED_LANGUAGES = ['en', 'fr', 'ja'];
   ```

### Step 4: Test the new language

1. Change the device language to the new language
2. Or manually select the language in the app settings
3. Verify that all text appears correctly throughout the app

## Right-to-Left (RTL) Languages

For languages that are written right-to-left (like Arabic), we provide special support:

1. The `src/utils/rtlLanguages.ts` file contains a list of RTL languages
2. The app automatically applies RTL layout for these languages
3. When adding an RTL language, make sure it's included in the `RTL_LANGUAGES` array in this file

```typescript
// For example, to add Arabic as an RTL language:
const RTL_LANGUAGES = ['ar'];
```

## ElevenLabs Integration

When implementing TTS with ElevenLabs for a new language:

1. Check that the language is supported by ElevenLabs
2. Add the language mapping in `src/utils/rtlLanguages.ts`:

```typescript
// Update the mapping function to include your language
export const mapToElevenLabsLanguageCode = (languageCode: string): string => {
  const mapping: {[key: string]: string} = {
    // ... existing mappings
    ja: 'ja', // Japanese
  };
  
  return mapping[languageCode] || 'en';
};
```

## Best Practices

1. **Keep translations organized**: Follow the same structure as the English file
2. **Use placeholders consistently**: Maintain the same format for variables (e.g., `{{count}}`)
3. **Test with different text lengths**: Some languages may have longer strings that could break layouts
4. **Use native speakers for review**: Have a native speaker review the translations for accuracy
5. **Update all languages when adding new features**: Don't forget to add new keys to all language files

## Translation Process

We recommend this workflow for translating content:

1. Generate a new language file with the template
2. Run the translation helper to identify all required translations
3. Focus on translating key sections first (e.g., navigation, common actions)
4. Test the app with partial translations to see immediate impact
5. Complete the remaining translations
6. Have a native speaker review the translations
7. Test the app with the new language in various scenarios

## Resources

- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [ElevenLabs Language Support](https://docs.elevenlabs.io/speech-synthesis/voice-settings) 