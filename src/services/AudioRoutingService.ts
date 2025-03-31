import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AndroidAudioRouter } from '../utils/audio/AndroidAudioRouter';

export class AudioRoutingService {
  private androidRouter: AndroidAudioRouter | null = null;
  private isAudioRoutingEnabled = false;
  
  constructor() {
    // Initialize platform-specific router
    if (Platform.OS === 'android') {
      this.androidRouter = new AndroidAudioRouter();
    }
    
    // Load saved preference
    this.loadSavedPreference();
  }
  
  private async loadSavedPreference() {
    try {
      const savedPreference = await AsyncStorage.getItem('audio_routing_enabled');
      this.isAudioRoutingEnabled = savedPreference === 'true';
    } catch (error) {
      console.error('Failed to load audio routing preference:', error);
    }
  }
  
  async playAudio(
    audioData: ArrayBuffer,
    routeToMicrophone: boolean = false
  ): Promise<boolean> {
    try {
      if ((routeToMicrophone || this.isAudioRoutingEnabled) && this.androidRouter) {
        // Route audio to microphone
        return this.androidRouter.routeAudioToMicrophone(audioData);
      } else {
        // Normal playback handled by caller
        return true;
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      return false;
    }
  }
  
  async routeAudioToMicrophone(audioData: ArrayBuffer): Promise<boolean> {
    if (!this.androidRouter) {
      console.error('Audio routing not supported on this platform');
      return false;
    }
    
    return this.androidRouter.routeAudioToMicrophone(audioData);
  }
  
  async stopAudioRouting(): Promise<void> {
    if (this.androidRouter) {
      await this.androidRouter.stopAudioRouting();
    }
  }
  
  async setAudioRoutingEnabled(enabled: boolean): Promise<boolean> {
    try {
      this.isAudioRoutingEnabled = enabled;
      
      // Save preference
      await AsyncStorage.setItem('audio_routing_enabled', enabled ? 'true' : 'false');
      
      if (!enabled) {
        this.stopAudioRouting();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save audio routing preference:', error);
      return false;
    }
  }
  
  isRoutingEnabled(): boolean {
    return this.isAudioRoutingEnabled;
  }
}

// Create singleton instance
export const audioRoutingService = new AudioRoutingService(); 