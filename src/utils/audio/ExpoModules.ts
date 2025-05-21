// This defines the interface for our AudioRouter Expo module
export interface AudioRouterInterface {
  routeAudioToMicrophone(audioFilePath: string): Promise<boolean>;
  stopAudioRouting(): Promise<void>;
}

// Mock implementation of the AudioRouter module
export const AudioRouter: AudioRouterInterface = {
  routeAudioToMicrophone: async (filePath: string): Promise<boolean> => {
    console.log('[MOCK] routeAudioToMicrophone called with path:', filePath);
    // Always return success in the mock implementation
    return true;
  },
  
  stopAudioRouting: async (): Promise<void> => {
    console.log('[MOCK] stopAudioRouting called');
    // Mock implementation doesn't need to do anything
    return;
  }
}; 