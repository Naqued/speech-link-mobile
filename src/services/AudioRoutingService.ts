import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoAudioRouter } from '../utils/audio/ExpoAudioRouter';

export class AudioRoutingService {
  private audioRouter: ExpoAudioRouter | null = null;
  private isAudioRoutingEnabled = false;
  
  constructor() {
    console.log('Initializing AudioRoutingService');
    
    // Initialize platform-specific router
    if (Platform.OS === 'android') {
      try {
        this.audioRouter = new ExpoAudioRouter();
        console.log('ExpoAudioRouter initialized successfully');
      } catch (error) {
        console.error('Failed to initialize ExpoAudioRouter:', error);
      }
    }
    
    // Load saved preference
    this.loadSavedPreference();
  }
  
  private async loadSavedPreference() {
    try {
      const savedPreference = await AsyncStorage.getItem('audio_routing_enabled');
      this.isAudioRoutingEnabled = savedPreference === 'true';
      console.log('Loaded audio routing preference:', this.isAudioRoutingEnabled);
    } catch (error) {
      console.error('Failed to load audio routing preference:', error);
    }
  }
  
  async playAudio(
    audioData: ArrayBuffer,
    routeToMicrophone: boolean = false
  ): Promise<boolean> {
    try {
      console.log('playAudio called with routing enabled:', 
        routeToMicrophone || this.isAudioRoutingEnabled,
        'audioRouter available:', !!this.audioRouter);
        
      if ((routeToMicrophone || this.isAudioRoutingEnabled) && this.audioRouter) {
        // Route audio to microphone
        console.log('Routing audio to microphone...');
        return this.audioRouter.routeAudioToMicrophone(audioData);
      } else {
        // Normal playback handled by caller
        console.log('Using normal audio playback (not routing to microphone)');
        return true;
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      return false;
    }
  }
  
  async routeAudioToMicrophone(audioData: ArrayBuffer): Promise<boolean> {
    if (!this.audioRouter) {
      if (Platform.OS === 'android') {
        console.error('Audio routing not available: ExpoAudioRouter not initialized');
      } else {
        console.error('Audio routing not supported on this platform:', Platform.OS);
      }
      return false;
    }
    
    console.log('Routing audio to microphone via ExpoAudioRouter...');
    return this.audioRouter.routeAudioToMicrophone(audioData);
  }
  
  async stopAudioRouting(): Promise<void> {
    if (this.audioRouter) {
      console.log('Stopping audio routing...');
      await this.audioRouter.stopAudioRouting();
    } else {
      console.log('No audio router available to stop routing');
    }
  }
  
  async setAudioRoutingEnabled(enabled: boolean): Promise<boolean> {
    try {
      console.log('Setting audio routing enabled:', enabled);
      
      // If we're enabling routing but the router isn't available, log but still allow it
      // since we now have a mock implementation
      if (enabled && !this.audioRouter && Platform.OS === 'android') {
        console.warn('ExpoAudioRouter not available, but continuing with mock implementation');
      }
      
      this.isAudioRoutingEnabled = enabled;
      
      // Save preference
      await AsyncStorage.setItem('audio_routing_enabled', enabled ? 'true' : 'false');
      console.log('Saved audio routing preference:', enabled);
      
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