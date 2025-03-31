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
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.MODIFY_AUDIO_SETTINGS
    ]);
    
    return (
      granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.MODIFY_AUDIO_SETTINGS] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error('Error requesting audio permissions:', error);
    return false;
  }
}; 