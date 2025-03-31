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

// Log API URL for debugging
const API_URL = __DEV__ ? DEV_API_URL : 'https://api.speechlink.com';
console.log('API is configured to use URL:', API_URL);

export const API_CONFIG = {
  BASE_URL: API_URL,
  SOCKET_URL: __DEV__
    ? DEV_WS_URL
    : 'wss://api.speechlink.com/audio-stream',
  TIMEOUT: 30000, // 30 seconds
}; 