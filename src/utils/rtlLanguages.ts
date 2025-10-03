/**
 * List of language codes that use Right-to-Left (RTL) script
 * Currently only Arabic is in our supported language list
 */
const RTL_LANGUAGES = ['ar'];

/**
 * Check if a language code corresponds to an RTL language
 * @param languageCode The ISO 639-1 language code to check
 * @returns boolean indicating if the language is RTL
 */
export const isRTL = (languageCode: string): boolean => {
  return RTL_LANGUAGES.includes(languageCode);
};

/**
 * Utility function to map our language codes to ElevenLabs language codes
 * @param languageCode Our internal language code
 * @returns The corresponding ElevenLabs language code, or 'en' if not supported
 */
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
    // Add more mappings as ElevenLabs adds support for more languages
  };
  
  return mapping[languageCode] || 'en'; // Default to English if no mapping exists
}; 