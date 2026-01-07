/**
 * Native Audio Output Service
 * 
 * This service provides access to native Android AudioManager functionality
 * to force speaker output, overriding Bluetooth routing.
 * 
 * IMPORTANT: This only works on Android. iOS routing is handled by the OS.
 */

import { Platform, NativeModules } from 'react-native';

interface AudioOutputNativeModule {
  forceSpeaker: () => Promise<boolean>;
  disableForceSpeaker: () => Promise<boolean>;
  forceEarpiece: () => Promise<boolean>;
  allowNormalRouting: () => Promise<boolean>;
  getAudioRoutingInfo: () => Promise<{
    mode: number;
    isSpeakerphoneOn: boolean;
    isBluetoothScoOn: boolean;
    isBluetoothA2dpOn: boolean;
    isMusicActive: boolean;
  }>;
  playAudio: (filePath: string) => Promise<boolean>;
  stopAudio: () => Promise<boolean>;
}

const { AudioOutput } = NativeModules as { AudioOutput: AudioOutputNativeModule };

/**
 * Check if native audio output control is available
 */
export const isNativeAudioOutputAvailable = (): boolean => {
  return Platform.OS === 'android' && AudioOutput !== undefined && AudioOutput !== null;
};

/**
 * Force audio to play through phone speaker, overriding Bluetooth
 * 
 * This uses Android's AudioManager.setSpeakerphoneOn(true) which
 * can override Bluetooth routing.
 * 
 * @returns true if successful, false otherwise
 */
export const forceSpeakerOutput = async (): Promise<boolean> => {
  if (!isNativeAudioOutputAvailable()) {
    console.warn('[NativeAudio] Native audio output module not available');
    return false;
  }

  try {
    console.log('[NativeAudio] Forcing speaker output via native module...');
    const result = await AudioOutput.forceSpeaker();
    console.log('[NativeAudio] Force speaker result:', result);
    return result;
  } catch (error) {
    console.error('[NativeAudio] Failed to force speaker:', error);
    return false;
  }
};

/**
 * Disable forced speaker mode and return to normal audio routing
 * 
 * @returns true if successful, false otherwise
 */
export const disableForceSpeaker = async (): Promise<boolean> => {
  if (!isNativeAudioOutputAvailable()) {
    console.warn('[NativeAudio] Native audio output module not available');
    return false;
  }

  try {
    console.log('[NativeAudio] Disabling forced speaker...');
    const result = await AudioOutput.disableForceSpeaker();
    console.log('[NativeAudio] Disable speaker result:', result);
    return result;
  } catch (error) {
    console.error('[NativeAudio] Failed to disable speaker:', error);
    return false;
  }
};

/**
 * Force audio to play through phone earpiece (like a phone call)
 * 
 * @returns true if successful, false otherwise
 */
export const forceEarpieceOutput = async (): Promise<boolean> => {
  if (!isNativeAudioOutputAvailable()) {
    console.warn('[NativeAudio] Native audio output module not available');
    return false;
  }

  try {
    console.log('[NativeAudio] Forcing earpiece output...');
    const result = await AudioOutput.forceEarpiece();
    console.log('[NativeAudio] Force earpiece result:', result);
    return result;
  } catch (error) {
    console.error('[NativeAudio] Failed to force earpiece:', error);
    return false;
  }
};

/**
 * Allow normal audio routing (Bluetooth, wired, etc.)
 * 
 * @returns true if successful, false otherwise
 */
export const allowNormalRouting = async (): Promise<boolean> => {
  if (!isNativeAudioOutputAvailable()) {
    console.warn('[NativeAudio] Native audio output module not available');
    return false;
  }

  try {
    console.log('[NativeAudio] Allowing normal audio routing...');
    const result = await AudioOutput.allowNormalRouting();
    console.log('[NativeAudio] Normal routing result:', result);
    return result;
  } catch (error) {
    console.error('[NativeAudio] Failed to enable normal routing:', error);
    return false;
  }
};

/**
 * Get current audio routing information (for debugging)
 * 
 * @returns Object containing audio routing info, or empty object if unavailable
 */
export const getAudioRoutingInfo = async (): Promise<Record<string, any>> => {
  if (!isNativeAudioOutputAvailable()) {
    return {};
  }

  try {
    const info = await AudioOutput.getAudioRoutingInfo();
    console.log('[NativeAudio] Audio routing info:', info);
    return info;
  } catch (error) {
    console.error('[NativeAudio] Failed to get audio info:', error);
    return {};
  }
};

/**
 * Apply the specified audio output device using native controls
 * 
 * @param device - The device type: 'speaker', 'earpiece', 'bluetooth', 'wired', 'airplay'
 * @returns true if successful, false otherwise
 */
export const applyNativeAudioOutput = async (device: string): Promise<boolean> => {
  if (!isNativeAudioOutputAvailable()) {
    console.log('[NativeAudio] Native module not available, device:', device);
    return false;
  }

  try {
    console.log('[NativeAudio] Applying native audio output:', device);
    
    switch (device) {
      case 'speaker':
        return await forceSpeakerOutput();
      
      case 'earpiece':
        return await forceEarpieceOutput();
      
      case 'bluetooth':
      case 'wired':
      case 'airplay':
        return await allowNormalRouting();
      
      default:
        console.warn('[NativeAudio] Unknown device type:', device);
        return false;
    }
  } catch (error) {
    console.error('[NativeAudio] Failed to apply audio output:', error);
    return false;
  }
};

/**
 * Play audio file using native Android MediaPlayer
 * This keeps the audio mode stable throughout playback (no Expo AV interference)
 * 
 * @param filePath - The file path or URI to play
 * @returns true if playback started successfully, false otherwise
 */
export const playAudioNative = async (filePath: string): Promise<boolean> => {
  if (!isNativeAudioOutputAvailable()) {
    console.warn('[NativeAudio] Native audio playback not available');
    return false;
  }

  try {
    console.log('[NativeAudio] Playing audio via native MediaPlayer:', filePath);
    const result = await AudioOutput.playAudio(filePath);
    console.log('[NativeAudio] Native playback started:', result);
    return result;
  } catch (error) {
    console.error('[NativeAudio] Failed to play audio:', error);
    return false;
  }
};

/**
 * Stop native audio playback
 * 
 * @returns true if successful, false otherwise
 */
export const stopAudioNative = async (): Promise<boolean> => {
  if (!isNativeAudioOutputAvailable()) {
    return false;
  }

  try {
    console.log('[NativeAudio] Stopping native audio playback...');
    const result = await AudioOutput.stopAudio();
    console.log('[NativeAudio] Stop result:', result);
    return result;
  } catch (error) {
    console.error('[NativeAudio] Failed to stop audio:', error);
    return false;
  }
};

export default {
  isAvailable: isNativeAudioOutputAvailable,
  forceSpeaker: forceSpeakerOutput,
  disableForceSpeaker,
  forceEarpiece: forceEarpieceOutput,
  allowNormalRouting,
  getInfo: getAudioRoutingInfo,
  applyOutput: applyNativeAudioOutput,
  playAudio: playAudioNative,
  stopAudio: stopAudioNative,
};

