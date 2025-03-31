import { NativeModules, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Define interface for our native module
interface AudioRouterModule {
  routeAudioToMicrophone(audioFilePath: string): Promise<boolean>;
  stopAudioRouting(): Promise<void>;
}

// Native module must be implemented in Java/Kotlin
const { AudioRouterModule } = NativeModules;

export class AndroidAudioRouter {
  private isRouting = false;

  constructor() {
    // Verify the module exists
    if (!AudioRouterModule) {
      console.error('AudioRouterModule is not available');
    }
  }

  async routeAudioToMicrophone(audioData: ArrayBuffer): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        throw new Error('This module only works on Android');
      }

      // Convert ArrayBuffer to base64 string
      const base64Data = this.arrayBufferToBase64(audioData);

      // Save audio data to a file
      const filePath = `${FileSystem.cacheDirectory}tts_output_for_mic.mp3`;
      await FileSystem.writeAsStringAsync(filePath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Call native module to route audio
      const result = await AudioRouterModule.routeAudioToMicrophone(filePath);
      this.isRouting = result;
      return result;
    } catch (error) {
      console.error('Failed to route audio to microphone:', error);
      return false;
    }
  }

  async stopAudioRouting(): Promise<void> {
    if (this.isRouting && AudioRouterModule) {
      await AudioRouterModule.stopAudioRouting();
      this.isRouting = false;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
} 