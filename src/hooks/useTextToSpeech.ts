import { useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import Sound from 'react-native-sound';
import { ttsService, TTSRequest } from '../services/ttsService';
import { apiService } from '../services/apiService';
import RNFS from 'react-native-fs';

export interface UseTextToSpeechResult {
  isLoading: boolean;
  currentSound: Sound | null;
  isPlaying: boolean;
  error: string | null;
  generateSpeech: (request: TTSRequest) => Promise<Sound>;
  speak: (text: string, voiceId?: string, provider?: 'ELEVENLABS' | 'OPENAI', language?: string) => Promise<Sound>;
  previewVoice: (voiceId: string, provider: 'ELEVENLABS' | 'OPENAI', publicOwnerId?: string, voiceName?: string) => Promise<Sound>;
  stopSpeaking: () => void;
}

export const useTextToSpeech = (): UseTextToSpeechResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const stopSpeaking = useCallback(() => {
    if (currentSound) {
      console.log('Stopping current sound playback');
      currentSound.stop();
      setCurrentSound(null);
      setIsPlaying(false);
    }
  }, [currentSound]);

  const generateSpeech = useCallback(async (request: TTSRequest): Promise<Sound> => {
    console.log('useTextToSpeech.generateSpeech called with:', {
      textLength: request.text.length,
      textStart: request.text.substring(0, 20) + (request.text.length > 20 ? '...' : ''),
      voiceId: request.voiceId,
      provider: request.provider
    });
    
    try {
      // Stop any current playback
      stopSpeaking();
      
      setIsLoading(true);
      setError(null);
      
      console.log('Calling ttsService.generateSpeech...');
      const sound = await ttsService.generateSpeech(request);
      console.log('ttsService.generateSpeech returned successfully');
      
      // Set up sound callbacks
      sound.setVolume(1.0);
      
      // Store the sound reference
      setCurrentSound(sound);
      
      // Play the sound
      console.log('Playing sound...');
      setIsPlaying(true);
      
      sound.play((success) => {
        console.log('Sound playback completed, success:', success);
        if (success) {
          setIsPlaying(false);
          setCurrentSound(null);
        } else {
          console.error('Sound playback failed');
          setIsPlaying(false);
          setCurrentSound(null);
        }
      });
      
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
  ): Promise<Sound> => {
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
  ): Promise<Sound> => {
    try {
      // Stop any current playback
      stopSpeaking();
      
      setIsLoading(true);
      setError(null);
      
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
      const filePath = `${RNFS.CachesDirectoryPath}/voice_preview_${voiceId}.mp3`;
      
      // Write base64 audio data to file
      await RNFS.writeFile(filePath, response.audioData, 'base64');
      
      // Load the sound file
      return new Promise((resolve, reject) => {
        const sound = new Sound(filePath, '', (error) => {
          if (error) {
            console.error('Failed to load sound', error);
            setIsLoading(false);
            reject(error);
            return;
          }
          
          // Set up sound callbacks
          sound.setVolume(1.0);
          
          // Store the sound reference
          setCurrentSound(sound);
          
          // Play the sound
          sound.play((success) => {
            if (success) {
              setIsPlaying(false);
            }
          });
          
          setIsPlaying(true);
          resolve(sound);
        });
      });
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