// This defines the interface for our AudioRouter Expo module
export interface AudioRouterInterface {
  routeAudioToMicrophone(audioFilePath: string): Promise<boolean>;
  stopAudioRouting(): Promise<void>;
}

// The module will be automatically imported by the Expo modules system
// When it's properly set up in the native code
export const AudioRouter: AudioRouterInterface | null = null; 