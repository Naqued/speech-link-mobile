import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Request audio permissions required for audio routing
 * @returns Promise<boolean> - True if all permissions granted
 */
export const requestAudioPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }
  
  try {
    // Only request RECORD_AUDIO as MODIFY_AUDIO_SETTINGS is not a runtime permission
    // that requires user approval in Android
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'SpeechLink needs access to your microphone for audio routing.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting audio permissions:', error);
    return false;
  }
}; 