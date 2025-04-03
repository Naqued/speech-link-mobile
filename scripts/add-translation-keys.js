const fs = require('fs');
const path = require('path');

// Define the directory with locale files
const localesDir = path.join(__dirname, '../src/i18n/locales');

// Define the keys we want to add and their translations in English
const newKeys = {
  'voice.actions.success': 'Success',
  'voice.actions.voiceSelected': '{{name}} has been selected as your voice',
  'voice.actions.errorSelectingVoice': 'Failed to select voice. Please try again.'
};

// Process a single file
const processFile = (filePath) => {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse JSON
    const translations = JSON.parse(content);
    
    // Check if the voice section exists
    if (!translations.voice) {
      translations.voice = {};
    }
    
    // Check if the actions section exists
    if (!translations.voice.actions) {
      translations.voice.actions = {};
    }
    
    // Add new keys if they don't exist
    if (!translations.voice.actions.success) {
      translations.voice.actions.success = newKeys['voice.actions.success'];
    }
    
    if (!translations.voice.actions.voiceSelected) {
      translations.voice.actions.voiceSelected = newKeys['voice.actions.voiceSelected'];
    }
    
    if (!translations.voice.actions.errorSelectingVoice) {
      translations.voice.actions.errorSelectingVoice = newKeys['voice.actions.errorSelectingVoice'];
    }
    
    // Write the updated JSON back to the file
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
    
    console.log(`Updated ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
};

// Read all files in the directory
fs.readdir(localesDir, (err, files) => {
  if (err) {
    console.error('Error reading locales directory:', err.message);
    return;
  }
  
  // Filter for JSON files
  const jsonFiles = files.filter(file => path.extname(file) === '.json');
  
  // Process each file
  jsonFiles.forEach(file => {
    const filePath = path.join(localesDir, file);
    processFile(filePath);
  });
  
  console.log(`\nAdded translation keys to ${jsonFiles.length} language files.`);
}); 