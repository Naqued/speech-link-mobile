import { useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { ttsService, TTSRequest } from '../services/ttsService';
import { apiService } from '../services/apiService';
import { audioOutputService } from '../services/audioOutputService';

export interface UseTextToSpeechResult {
  isLoading: boolean;
  currentSound: Audio.Sound | null;
  isPlaying: boolean;
  error: string | null;
  generateSpeech: (request: TTSRequest) => Promise<Audio.Sound>;
  speak: (text: string, voiceId?: string, provider?: 'ELEVENLABS' | 'OPENAI', language?: string) => Promise<Audio.Sound>;
  previewVoice: (voiceId: string, provider: 'ELEVENLABS' | 'OPENAI', publicOwnerId?: string, voiceName?: string) => Promise<Audio.Sound>;
  stopSpeaking: () => Promise<void>;
}

export const useTextToSpeech = (): UseTextToSpeechResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
  }, [currentSound]);

  const generateSpeech = useCallback(async (request: TTSRequest): Promise<Audio.Sound> => {
    console.log('useTextToSpeech.generateSpeech called with:', {
      textLength: request.text.length,
      textStart: request.text.substring(0, 20) + (request.text.length > 20 ? '...' : ''),
      voiceId: request.voiceId,
      provider: request.provider
    });
    
    try {
      // Stop any current playback
      await stopSpeaking();
      
      setIsLoading(true);
      setError(null);
      
      // Apply current audio output mode before playback
      await audioOutputService.applyCurrentMode();
      
      console.log('Calling ttsService.generateSpeech...');
      const sound = await ttsService.generateSpeech(request);
      console.log('ttsService.generateSpeech returned successfully');
      
      // Set up sound with expo-av
      await sound.setVolumeAsync(1.0);
      
      // Set up playback status update listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            console.log('Sound playback completed');
            setIsPlaying(false);
            setCurrentSound(null);
          } else if (status.isPlaying) {
            setIsPlaying(true);
          }
        }
      });
      
      // Store the sound reference
      setCurrentSound(sound);
      
      // Play the sound
      console.log('Playing sound...');
      await sound.playAsync();
      setIsPlaying(true);
      
      return sound;
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
  }, [stopSpeaking]);

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
      language: language || 'undefined'
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
  }, [generateSpeech]);

  // New function for previewing voices using /api/voice-preview endpoint
  const previewVoice = useCallback(async (
    voiceId: string,
    provider: 'ELEVENLABS' | 'OPENAI',
    publicOwnerId?: string,
    voiceName?: string
  ): Promise<Audio.Sound> => {
    try {
      // Stop any current playback
      await stopSpeaking();
      
      setIsLoading(true);
      setError(null);
      
      // Apply current audio output mode before playback
      await audioOutputService.applyCurrentMode();
      
      // Use the voice-preview endpoint instead of /api/tts
      const response = await apiService.post<{
        audioData: string;
        format: string;
        metadata: any;
      }>('/api/voice-preview', {
        voiceId,
        provider,
        text: 'Hello, this is a preview of my voice.',
        publicOwnerId,
        voiceName
      });
      
      if (!response.audioData) {
        throw new Error('No audio data received');
      }
      
      // Create a temporary file and write the audio data to it
      const filePath = `${FileSystem.cacheDirectory}voice_preview_${voiceId}.mp3`;
      
      // Write base64 audio data to file using Expo FileSystem
      await FileSystem.writeAsStringAsync(filePath, response.audioData, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Load the sound file with expo-av
      const { sound } = await Audio.Sound.createAsync(
        { uri: filePath },
        { shouldPlay: false }
      );
      
      // Set up sound with expo-av
      await sound.setVolumeAsync(1.0);
      
      // Set up playback status update listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentSound(null);
        }
      });
      
      // Store the sound reference
      setCurrentSound(sound);
      
      // Play the sound
      await sound.playAsync();
      setIsPlaying(true);
      
      return sound;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview voice');
      console.error('Error in voice preview:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [stopSpeaking]);

  return {
    isLoading,
    currentSound,
    isPlaying,
    error,
    generateSpeech,
    speak,
    previewVoice,
    stopSpeaking
  };
}; 