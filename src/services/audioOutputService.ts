import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureAudioMode, AudioOutputMode } from '../utils/audio/audioConfig';

/**
 * Storage key for audio output settings
 */
const AUDIO_OUTPUT_SETTING_KEY = '@settings:audio_output_mode';

/**
 * Audio Output Service
 * Manages audio output device preferences
 */
export class AudioOutputService {
  private static instance: AudioOutputService;
  private currentMode: AudioOutputMode = AudioOutputMode.DEFAULT;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): AudioOutputService {
    if (!AudioOutputService.instance) {
      AudioOutputService.instance = new AudioOutputService();
    }
    return AudioOutputService.instance;
  }

  /**
   * Initialize the service and load saved preferences
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const savedMode = await this.loadSavedMode();
      this.currentMode = savedMode;
      await configureAudioMode(this.currentMode);
      this.initialized = true;
      console.log('AudioOutputService initialized with mode:', this.currentMode);
    } catch (error) {
      console.error('Error initializing AudioOutputService:', error);
      this.currentMode = AudioOutputMode.DEFAULT;
    }
  }

  /**
   * Load saved audio output mode from storage
   */
  private async loadSavedMode(): Promise<AudioOutputMode> {
    try {
      const savedMode = await AsyncStorage.getItem(AUDIO_OUTPUT_SETTING_KEY);
      if (savedMode && Object.values(AudioOutputMode).includes(savedMode as AudioOutputMode)) {
        return savedMode as AudioOutputMode;
      }
    } catch (error) {
      console.error('Error loading saved audio mode:', error);
    }
    return AudioOutputMode.DEFAULT;
  }

  /**
   * Save audio output mode to storage
   */
  private async saveMode(mode: AudioOutputMode): Promise<void> {
    try {
      await AsyncStorage.setItem(AUDIO_OUTPUT_SETTING_KEY, mode);
    } catch (error) {
      console.error('Error saving audio mode:', error);
    }
  }

  /**
   * Get current audio output mode
   */
  public getCurrentMode(): AudioOutputMode {
    return this.currentMode;
  }

  /**
   * Set audio output mode
   */
  public async setOutputMode(mode: AudioOutputMode): Promise<void> {
    try {
      await configureAudioMode(mode);
      this.currentMode = mode;
      await this.saveMode(mode);
      console.log('Audio output mode set to:', mode);
    } catch (error) {
      console.error('Error setting audio output mode:', error);
      throw error;
    }
  }

  /**
   * Toggle force speaker mode on/off
   * Returns the new mode
   */
  public async toggleForceSpeaker(): Promise<AudioOutputMode> {
    const newMode = this.currentMode === AudioOutputMode.FORCE_SPEAKER 
      ? AudioOutputMode.DEFAULT 
      : AudioOutputMode.FORCE_SPEAKER;
    
    await this.setOutputMode(newMode);
    return newMode;
  }

  /**
   * Check if force speaker is currently enabled
   */
  public isForceSpeakerEnabled(): boolean {
    return this.currentMode === AudioOutputMode.FORCE_SPEAKER;
  }

  /**
   * Apply current audio mode (useful before playback)
   */
  public async applyCurrentMode(): Promise<void> {
    try {
      await configureAudioMode(this.currentMode);
    } catch (error) {
      console.error('Error applying audio mode:', error);
    }
  }

  /**
   * Reset to default audio mode
   */
  public async resetToDefault(): Promise<void> {
    await this.setOutputMode(AudioOutputMode.DEFAULT);
  }

  /**
   * Get available audio output modes with labels
   */
  public getAvailableModes(): Array<{ value: AudioOutputMode; label: string; description: string }> {
    return [
      {
        value: AudioOutputMode.DEFAULT,
        label: 'System Default',
        description: 'Use system default audio routing (Bluetooth/headphones when connected)'
      },
      {
        value: AudioOutputMode.FORCE_SPEAKER,
        label: 'Always Speaker',
        description: 'Always play through phone speaker, even with Bluetooth/headphones connected'
      },
      {
        value: AudioOutputMode.FORCE_EARPIECE,
        label: 'Always Earpiece',
        description: 'Always play through phone earpiece (for private listening)'
      }
    ];
  }
}

// Export singleton instance
export const audioOutputService = AudioOutputService.getInstance();

