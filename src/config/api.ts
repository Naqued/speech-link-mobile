import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the network IP address for development
const DEV_API_URL = Platform.select({
  android: 'http://192.168.1.14:3000',
  ios: 'http://192.168.1.14:3000',
  default: 'http://192.168.1.14:3000',
});

const DEV_WS_URL = Platform.select({
  android: 'ws://192.168.1.14:3000/audio-stream',
  ios: 'ws://192.168.1.14:3000/audio-stream',
  default: 'ws://192.168.1.14:3000/audio-stream',
});

// Production URLs
const PROD_API_URL = 'https://speech-aac.link';
const PROD_WS_URL = 'wss://speech-aac.link/audio-stream';

// API version
const API_VERSION = '1.3';

// Force production mode for testing (set to true for testing, false for normal operation)
// This will be overridden by AsyncStorage value if available
let FORCE_PRODUCTION = true;

// Function to check if we should use production URL from AsyncStorage
const checkForceProduction = async () => {
  try {
    const forceProductionStr = await AsyncStorage.getItem('force_production_api');
    // Only update the global variable if the value exists
    if (forceProductionStr !== null) {
      FORCE_PRODUCTION = forceProductionStr === 'true';
      
      // Recalculate API URLs
      updateApiUrls();
      
      // Log the change
      console.log('Forced production mode updated from storage:', FORCE_PRODUCTION);
    }
  } catch (error) {
    console.error('Error reading force production setting:', error);
  }
};

// Call the check when the module is loaded
checkForceProduction();

// Helper function to update API URLs when the force production setting changes
let API_URL = DEV_API_URL;
let WS_URL = DEV_WS_URL;

function updateApiUrls() {
  API_URL = FORCE_PRODUCTION ? PROD_API_URL : (__DEV__ ? DEV_API_URL : PROD_API_URL);
  WS_URL = FORCE_PRODUCTION ? PROD_WS_URL : (__DEV__ ? DEV_WS_URL : PROD_WS_URL);
  
  // Add more detailed logging
  console.log('API Configuration Updated:');
  console.log(`__DEV__ flag value: ${__DEV__ ? 'true' : 'false'}`);
  console.log(`FORCE_PRODUCTION flag: ${FORCE_PRODUCTION}`);
  console.log(`Selected API_URL: ${API_URL}`);
}

// Initialize URLs
updateApiUrls();

// Add more detailed logging
console.log('API Configuration Debug:');
console.log(`__DEV__ flag value: ${__DEV__ ? 'true' : 'false'}`);
console.log(`FORCE_PRODUCTION flag: ${FORCE_PRODUCTION}`);
console.log(`DEV_API_URL: ${DEV_API_URL}`);
console.log(`PROD_API_URL: ${PROD_API_URL}`);
console.log(`Selected API_URL: ${API_URL}`);

console.log(`API v${API_VERSION} is configured to use:`, { 
  environment: FORCE_PRODUCTION ? 'FORCED PRODUCTION' : (__DEV__ ? 'DEVELOPMENT' : 'PRODUCTION'),
  baseUrl: API_URL,
  socketUrl: WS_URL,
  timeout: 30000
});

// Helper function to toggle force production mode
export const toggleForceProduction = async (force?: boolean) => {
  // If force is provided, use it, otherwise toggle the current value
  const newValue = force !== undefined ? force : !FORCE_PRODUCTION;
  FORCE_PRODUCTION = newValue;
  
  // Save to AsyncStorage
  try {
    await AsyncStorage.setItem('force_production_api', String(newValue));
    console.log('Saved force production mode:', newValue);
  } catch (error) {
    console.error('Failed to save force production mode:', error);
  }
  
  // Update the URLs
  updateApiUrls();
  
  return newValue;
};

export const API_CONFIG = {
  BASE_URL: API_URL,
  SOCKET_URL: WS_URL,
  TIMEOUT: 30000, // 30 seconds
  VERSION: API_VERSION,
  IS_DEV: !FORCE_PRODUCTION && __DEV__
}; 