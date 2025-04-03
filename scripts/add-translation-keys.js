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

// Validate JSON content
const isValidJSON = (content) => {
  try {
    JSON.parse(content);
    return true;
  } catch (e) {
    return false;
  }
};

// Process a single file
const processFile = (filePath) => {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the content is valid JSON
    if (!isValidJSON(content)) {
      console.error(`Invalid JSON in ${path.basename(filePath)}. Skipping file.`);
      return false;
    }
    
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
    let updated = false;
    
    if (!translations.voice.actions.success) {
      translations.voice.actions.success = newKeys['voice.actions.success'];
      updated = true;
    }
    
    if (!translations.voice.actions.voiceSelected) {
      translations.voice.actions.voiceSelected = newKeys['voice.actions.voiceSelected'];
      updated = true;
    }
    
    if (!translations.voice.actions.errorSelectingVoice) {
      translations.voice.actions.errorSelectingVoice = newKeys['voice.actions.errorSelectingVoice'];
      updated = true;
    }
    
    // Only write if changes were made
    if (updated) {
      // Write the updated JSON back to the file
      fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
      console.log(`Updated ${path.basename(filePath)}`);
    } else {
      console.log(`No changes needed for ${path.basename(filePath)}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing ${path.basename(filePath)}:`, error.message);
    return false;
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
  
  console.log(`Found ${jsonFiles.length} language files`);
  
  // Process counters
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  // Process each file
  jsonFiles.forEach(file => {
    const filePath = path.join(localesDir, file);
    const result = processFile(filePath);
    
    if (result === true) {
      successCount++;
    } else {
      errorCount++;
    }
  });
  
  console.log(`\nSummary:`);
  console.log(`- Successfully processed: ${successCount} files`);
  console.log(`- Failed to process: ${errorCount} files`);
  console.log(`- Total language files: ${jsonFiles.length}`);
}); 