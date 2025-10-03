import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Platform } from 'react-native';

/**
 * Audio output modes for different scenarios
 */
export enum AudioOutputMode {
  DEFAULT = 'default',           // System default routing
  FORCE_SPEAKER = 'force_speaker', // Always use device speaker
  FORCE_EARPIECE = 'force_earpiece' // Always use earpiece
}

/**
 * Configure audio mode for playback
 * @param mode Audio output mode to configure
 */
export const configureAudioMode = async (mode: AudioOutputMode = AudioOutputMode.DEFAULT): Promise<void> => {
  try {
    console.log(`Configuring audio mode: ${mode}`);
    
    const audioModeConfig: Partial<Audio.AudioMode> = {
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    };

    // Platform-specific audio routing
    if (Platform.OS === 'android') {
      switch (mode) {
        case AudioOutputMode.FORCE_SPEAKER:
          // playThroughEarpieceAndroid: false = use speaker
          audioModeConfig.playThroughEarpieceAndroid = false;
          break;
        case AudioOutputMode.FORCE_EARPIECE:
          // playThroughEarpieceAndroid: true = use earpiece
          audioModeConfig.playThroughEarpieceAndroid = true;
          break;
        case AudioOutputMode.DEFAULT:
        default:
          // Let system decide
          audioModeConfig.playThroughEarpieceAndroid = false;
          break;
      }
    }

    // iOS uses AVAudioSession under the hood, which respects system audio routing by default
    // For iOS, we'd need to use AVAudioSession category modes for more control

    await Audio.setAudioModeAsync(audioModeConfig as Audio.AudioMode);
    console.log(`Audio mode configured successfully: ${mode}`);
  } catch (error) {
    console.error('Error configuring audio mode:', error);
    throw error;
  }
};

/**
 * Initialize audio for the app
 * Should be called once on app startup
 */
export const initializeAudio = async (): Promise<void> => {
  try {
    console.log('Initializing audio...');
    
    // Request permissions and set up audio mode
    await Audio.requestPermissionsAsync();
    
    // Set default audio mode
    await configureAudioMode(AudioOutputMode.DEFAULT);
    
    console.log('Audio initialized successfully');
  } catch (error) {
    console.error('Error initializing audio:', error);
    // Don't throw - app should continue even if audio init fails
  }
};

/**
 * Reset audio mode to default system behavior
 */
export const resetAudioMode = async (): Promise<void> => {
  try {
    await configureAudioMode(AudioOutputMode.DEFAULT);
  } catch (error) {
    console.error('Error resetting audio mode:', error);
  }
};

