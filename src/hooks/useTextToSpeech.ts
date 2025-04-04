import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { ttsService, TTSRequest } from '../services/ttsService';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { API_CONFIG } from '../config/api';
import { audioRoutingService } from '../services/AudioRoutingService';
import { requestAudioPermissions } from '../utils/permissions';
import { voiceSettingsService } from '../services/voiceSettingsService';
import i18next from 'i18next';

export interface UseTextToSpeechResult {
  isLoading: boolean;
  currentSound: Audio.Sound | null;
  isPlaying: boolean;
  error: string | null;
  generateSpeech: (request: TTSRequest) => Promise<Audio.Sound>;
  speak: (text: string, voiceId?: string, provider?: 'ELEVENLABS' | 'OPENAI', language?: string) => Promise<Audio.Sound>;
  previewVoice: (voiceId: string, provider: 'ELEVENLABS' | 'OPENAI', publicOwnerId?: string, voiceName?: string, language?: string) => Promise<Audio.Sound>;
  stopSpeaking: () => void;
  isAudioRoutingEnabled: boolean;
  toggleAudioRouting: (enabled: boolean) => Promise<boolean>;
}

export const useTextToSpeech = (): UseTextToSpeechResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioRoutingEnabled, setIsAudioRoutingEnabled] = useState<boolean>(false);

  // Initialize audio on mount
  useEffect(() => {
    (async () => {
      try {
        // Initialize Audio
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    })();
  }, []);

  // Load audio routing preference on mount
  useEffect(() => {
    const loadAudioRoutingPreference = async () => {
      try {
        // First try to get from voice settings
        const userSettings = await voiceSettingsService.getUserSettings();
        const routingEnabled = userSettings?.voiceSettings?.audioRoutingEnabled || false;
        
        // Initialize the audio routing service with this value
        await audioRoutingService.setAudioRoutingEnabled(routingEnabled);
        
        // Set local state
        setIsAudioRoutingEnabled(routingEnabled);
      } catch (error) {
        console.error('Failed to load audio routing preference from voice settings:', error);
        // Fallback to direct check from service
        setIsAudioRoutingEnabled(audioRoutingService.isRoutingEnabled());
      }
    };
    
    loadAudioRoutingPreference();
  }, []);

  const stopSpeaking = useCallback(async () => {
    if (currentSound) {
      console.log('Stopping current sound playback');
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
      setCurrentSound(null);
      setIsPlaying(false);
    }
    
    // Also stop any audio routing
    audioRoutingService.stopAudioRouting();
  }, [currentSound]);

  const generateSpeech = useCallback(async (request: TTSRequest): Promise<Audio.Sound> => {
    console.log('useTextToSpeech.generateSpeech called with:', {
      textLength: request.text.length,
      textStart: request.text.substring(0, 20) + (request.text.length > 20 ? '...' : ''),
      voiceId: request.voiceId,
      provider: request.provider,
      audioRoutingEnabled: isAudioRoutingEnabled
    });
    
    try {
      // Stop any current playback
      await stopSpeaking();
      
      setIsLoading(true);
      setError(null);
      
      // Check if audio routing is enabled
      if (isAudioRoutingEnabled) {
        console.log('Audio routing is enabled, using special flow');
        
        // Create a Promise for the audio data
        const audioDataPromise = new Promise<ArrayBuffer>(async (resolve, reject) => {
          try {
            // Call TTS API with a direct fetch to handle binary data
            // First get auth headers
            const token = await authService.getToken();
            console.log('Auth token obtained:', !!token);
            
            const headers: HeadersInit = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token?.access_token || ''}`
            };
            
            console.log('Making API request to:', `${API_CONFIG.BASE_URL}/api/tts`);
            
            // Make direct fetch request to handle binary data
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/tts`, {
              method: 'POST',
              headers,
              body: JSON.stringify(request)
            });
            
            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }
            
            // Get the response as arraybuffer
            const audioData = await response.arrayBuffer();
            resolve(audioData);
          } catch (error) {
            reject(error);
          }
        });
        
        // Get the audio data
        const audioData = await audioDataPromise;
        
        // Route audio to microphone
        await audioRoutingService.routeAudioToMicrophone(audioData);
        
        // Create a dummy sound to satisfy the return type
        const dummySound = new Audio.Sound();
        setCurrentSound(null);
        setIsPlaying(true);
        return dummySound;
      } else {
        // Normal flow using the TTS service
        console.log('Calling ttsService.generateSpeech...');
        const sound = await ttsService.generateSpeech(request);
        console.log('ttsService.generateSpeech returned successfully');
        
        // Store the sound reference
        setCurrentSound(sound);
        
        // Play the sound
        console.log('Playing sound...');
        setIsPlaying(true);
        
        // Set up event listener for playback status
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              console.log('Sound playback completed');
              setIsPlaying(false);
              setCurrentSound(null);
              sound.unloadAsync().catch(error => {
                console.error('Error unloading sound:', error);
              });
            }
          }
        });
        
        // Start playback
        await sound.playAsync();
        
        return sound;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate speech';
      console.error('Error in text-to-speech generateSpeech:', errorMessage, err);
      setError(errorMessage);
      setIsPlaying(false);
      setCurrentSound(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [stopSpeaking, isAudioRoutingEnabled]);

  const speak = useCallback(async (
    text: string, 
    voiceId?: string, 
    provider?: 'ELEVENLABS' | 'OPENAI',
    language?: string
  ): Promise<Audio.Sound> => {
    console.log('useTextToSpeech.speak called with:', {
      textLength: text.length,
      textStart: text.substring(0, 20) + (text.length > 20 ? '...' : ''),
      voiceId: voiceId || 'undefined',
      provider: provider || 'undefined',
      language: language || 'undefined',
      audioRoutingEnabled: isAudioRoutingEnabled
    });
    
    try {
      // Build request with optional parameters
      const request: TTSRequest = {
        text
      };
      
      // Only add fields if they're defined
      if (voiceId) request.voiceId = voiceId;
      if (provider) request.provider = provider;
      if (language) {
        request.settings = {
          ...(request.settings || {}),
          language
        };
      }
      
      return generateSpeech(request);
    } catch (error) {
      console.error('Error in useTextToSpeech.speak:', error);
      throw error;
    }
  }, [generateSpeech, isAudioRoutingEnabled]);

  // Function to toggle audio routing
  const toggleAudioRouting = useCallback(async (enabled: boolean): Promise<boolean> => {
    try {
      // Request permissions if enabling
      if (enabled) {
        const permissionsGranted = await requestAudioPermissions();
        if (!permissionsGranted) {
          Alert.alert(
            'Permissions Required',
            'Audio routing requires microphone and audio settings permissions',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
      
      // Update service
      const success = await audioRoutingService.setAudioRoutingEnabled(enabled);
      
      if (success) {
        // Also update voice settings
        try {
          const userSettings = await voiceSettingsService.getUserSettings();
          if (userSettings?.voiceSettings) {
            await voiceSettingsService.updateVoiceSettings({
              ...userSettings.voiceSettings,
              audioRoutingEnabled: enabled
            });
          }
        } catch (settingsError) {
          console.error('Failed to update audio routing in voice settings:', settingsError);
          // Continue even if settings update fails
        }
        
        // Update local state
        setIsAudioRoutingEnabled(enabled);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to toggle audio routing:', error);
      return false;
    }
  }, []);

  // New function for previewing voices using /api/voice-preview endpoint
  const previewVoice = useCallback(async (
    voiceId: string,
    provider: 'ELEVENLABS' | 'OPENAI',
    publicOwnerId?: string,
    voiceName?: string,
    language?: string
  ): Promise<Audio.Sound> => {
    try {
      // Stop any current playback
      await stopSpeaking();
      
      setIsLoading(true);
      setError(null);
      
      // Generate a random number between 1 and 4 to select one of the preview texts
      const previewTextNumber = Math.floor(Math.random() * 4) + 1;
      const previewText = i18next.t(`voice.preview.text-${previewTextNumber}`);
      
      // Get current language if none provided
      const currentLanguage = language || i18next.language;
      
      // Check if audio routing is enabled
      if (isAudioRoutingEnabled) {
        // Call preview API with audio routing
        const response = await apiService.post<{
          audioData: string;
          format: string;
          metadata: any;
        }>('/api/voice-preview', {
          voiceId,
          provider,
          text: previewText,
          publicOwnerId,
          voiceName,
          lang: currentLanguage
        });
        
        if (!response.audioData) {
          throw new Error('No audio data received');
        }
        
        // Convert base64 to ArrayBuffer
        const binaryString = atob(response.audioData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Route audio to microphone
        await audioRoutingService.routeAudioToMicrophone(bytes.buffer);
        
        // Create a dummy sound to satisfy the return type
        const dummySound = new Audio.Sound();
        setCurrentSound(null);
        setIsPlaying(true);
        return dummySound;
      } else {
        // Normal preview flow
        const response = await apiService.post<{
          audioData: string;
          format: string;
          metadata: any;
        }>('/api/voice-preview', {
          voiceId,
          provider,
          text: previewText,
          publicOwnerId,
          voiceName,
          lang: currentLanguage
        });
        
        if (!response.audioData) {
          throw new Error('No audio data received');
        }
        
        // Create a temporary file and write the audio data to it
        const filePath = `${FileSystem.cacheDirectory}voice_preview_${voiceId}.mp3`;
        
        // Write base64 audio data to file
        await FileSystem.writeAsStringAsync(filePath, response.audioData, {
          encoding: FileSystem.EncodingType.Base64
        });
        
        // Load the sound file using expo-av
        const { sound } = await Audio.Sound.createAsync(
          { uri: filePath },
          { shouldPlay: true }
        );
        
        // Set up event listener for playback status
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              console.log('Voice preview playback completed');
              setIsPlaying(false);
              setCurrentSound(null);
              sound.unloadAsync().catch(error => {
                console.error('Error unloading sound:', error);
              });
            }
          }
        });
        
        // Store the sound reference
        setCurrentSound(sound);
        setIsPlaying(true);
        
        return sound;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview voice');
      console.error('Error in voice preview:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [stopSpeaking, isAudioRoutingEnabled]);

  return {
    isLoading,
    currentSound,
    isPlaying,
    error,
    generateSpeech,
    speak,
    previewVoice,
    stopSpeaking,
    isAudioRoutingEnabled,
    toggleAudioRouting
  };
}; 