#!/usr/bin/env node
/**
 * Translation Helper Script
 * 
 * This script helps translators identify missing translations in language files.
 * It compares a target language file with the English base file and generates a report.
 * 
 * Usage:
 *   node translation-helper.js [language-code]
 * 
 * Example:
 *   node translation-helper.js ja
 */

const fs = require('fs');
const path = require('path');

// Base paths
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const ENGLISH_FILE = path.join(LOCALES_DIR, 'en.json');
const TEMPLATE_DIR = path.join(__dirname, '..', 'src', 'i18n', 'templates');

// Get language code from command line arguments
const targetLang = process.argv[2];

if (!targetLang) {
  console.error('Please provide a language code. Example: node translation-helper.js ja');
  process.exit(1);
}

// File paths
const TARGET_FILE = path.join(LOCALES_DIR, `${targetLang}.json`);
const REPORT_FILE = path.join(__dirname, `${targetLang}-translation-report.md`);

// Check if the English file exists
if (!fs.existsSync(ENGLISH_FILE)) {
  console.error('English base file not found. Expected at:', ENGLISH_FILE);
  process.exit(1);
}

// If target file doesn't exist, create it from template
if (!fs.existsSync(TARGET_FILE)) {
  // Create directories if they don't exist
  if (!fs.existsSync(LOCALES_DIR)) {
    fs.mkdirSync(LOCALES_DIR, { recursive: true });
  }

  // Copy template file to target file location
  const templateFile = path.join(TEMPLATE_DIR, 'language-template.json');
  if (fs.existsSync(templateFile)) {
    fs.copyFileSync(templateFile, TARGET_FILE);
    console.log(`Created new language file for ${targetLang} from template.`);
  } else {
    // Create an empty JSON file
    fs.writeFileSync(TARGET_FILE, '{}');
    console.log(`Created empty language file for ${targetLang}.`);
  }
}

// Read JSON files
try {
  const englishData = JSON.parse(fs.readFileSync(ENGLISH_FILE, 'utf8'));
  const targetData = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
  
  // Find missing keys and empty translations
  const missingKeys = [];
  const emptyTranslations = [];
  
  // Recursive function to check nested objects
  function checkMissingKeys(enObj, targetObj, path = '') {
    for (const key in enObj) {
      const newPath = path ? `${path}.${key}` : key;
      
      if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
        // Nested object
        if (!targetObj[key] || typeof targetObj[key] !== 'object') {
          missingKeys.push(newPath);
        } else {
          checkMissingKeys(enObj[key], targetObj[key], newPath);
        }
      } else {
        // Leaf value
        if (targetObj === undefined || targetObj[key] === undefined) {
          missingKeys.push(newPath);
        } else if (targetObj[key] === '') {
          emptyTranslations.push({ path: newPath, english: enObj[key] });
        }
      }
    }
  }
  
  checkMissingKeys(englishData, targetData);
  
  // Generate report
  let report = `# Translation Report for ${targetLang}\n\n`;
  report += `Generated on: ${new Date().toLocaleString()}\n\n`;
  
  report += `## Missing Keys (${missingKeys.length})\n\n`;
  if (missingKeys.length === 0) {
    report += 'No missing keys! 🎉\n\n';
  } else {
    report += 'The following keys are missing in the target language file:\n\n';
    missingKeys.forEach(key => {
      report += `- \`${key}\`\n`;
    });
    report += '\n';
  }
  
  report += `## Empty Translations (${emptyTranslations.length})\n\n`;
  if (emptyTranslations.length === 0) {
    report += 'No empty translations! 🎉\n\n';
  } else {
    report += 'The following translations are empty in the target language file:\n\n';
    report += '| Key | English Text |\n';
    report += '| --- | ----------- |\n';
    emptyTranslations.forEach(item => {
      report += `| \`${item.path}\` | "${item.english}" |\n`;
    });
    report += '\n';
  }
  
  report += '## Next Steps\n\n';
  report += '1. Fill in the missing or empty translations in the target language file\n';
  report += '2. Run this script again to check your progress\n';
  report += '3. Test the translations in the app to make sure they look correct\n';
  
  // Write report to file
  fs.writeFileSync(REPORT_FILE, report);
  
  console.log(`Translation report generated at: ${REPORT_FILE}`);
  console.log(`- Missing keys: ${missingKeys.length}`);
  console.log(`- Empty translations: ${emptyTranslations.length}`);
  
  if (missingKeys.length > 0) {
    // Add missing keys to target file
    let updatedTargetData = { ...targetData };
    
    missingKeys.forEach(path => {
      const keys = path.split('.');
      let enCurrent = englishData;
      let targetCurrent = updatedTargetData;
      
      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        enCurrent = enCurrent[keys[i]];
        if (!targetCurrent[keys[i]]) {
          targetCurrent[keys[i]] = {};
        }
        targetCurrent = targetCurrent[keys[i]];
      }
      
      // Add the missing key with an empty string
      const lastKey = keys[keys.length - 1];
      targetCurrent[lastKey] = '';
    });
    
    // Write updated target file
    fs.writeFileSync(TARGET_FILE, JSON.stringify(updatedTargetData, null, 2));
    console.log(`Added missing keys to: ${TARGET_FILE}`);
  }
  
} catch (error) {
  console.error('Error processing translation files:', error);
  process.exit(1);
} 