import { Platform } from 'react-native';

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
const API_VERSION = '1.0';

// Log API URL for debugging
const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
const WS_URL = __DEV__ ? DEV_WS_URL : PROD_WS_URL;

console.log(`API v${API_VERSION} is configured to use:`, { 
  environment: __DEV__ ? 'DEVELOPMENT' : 'PRODUCTION',
  baseUrl: API_URL,
  socketUrl: WS_URL,
  timeout: 30000
});

export const API_CONFIG = {
  BASE_URL: API_URL,
  SOCKET_URL: WS_URL,
  TIMEOUT: 30000, // 30 seconds
  VERSION: API_VERSION,
  IS_DEV: __DEV__
}; 