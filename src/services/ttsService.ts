import { apiService } from './apiService';
import Sound from 'react-native-sound';
import * as FileSystem from 'expo-file-system';
import { authService } from './authService';
import { API_CONFIG } from '../config/api';

export interface TTSRequest {
  text: string;
  provider?: 'ELEVENLABS' | 'OPENAI';
  voiceId?: string;
  settings?: {
    speed?: number;
    pitch?: number;
    stability?: number;
    clarity?: number;
    style?: number;
    language?: string;
    [key: string]: any;
  };
}

// Interface for our app's Voice model
export interface Voice {
  id: string;
  name: string;
  provider: 'ELEVENLABS' | 'OPENAI';
  gender?: 'male' | 'female' | 'neutral';
  previewUrl?: string;
  language: string;
  languageCode?: string;
  description?: string;
  isFavorite?: boolean;
  publicOwnerId?: string;
  public_owner_id?: string; // For direct mapping from API responses
  accent?: string;
  age?: string;
  use_case?: string;
}

// Interface matching ElevenLabs API response
export interface ElevenLabsVoice {
  public_owner_id: string;
  voice_id: string;
  name: string;
  accent: string;
  gender: string;
  age: string;
  descriptive: string;
  use_case: string;
  category: string;
  language: string;
  locale: string;
  description: string;
  preview_url: string;
  is_added_by_user?: boolean;
  [key: string]: any;
}

export interface VoicePreviewRequest {
  voiceId: string;
  provider: 'ELEVENLABS' | 'OPENAI';
  text: string;
  publicOwnerId?: string;
  voiceName?: string;
}

class TTSService {
  private static instance: TTSService;

  private constructor() {}

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  private mapElevenLabsVoiceToAppVoice(voice: ElevenLabsVoice): Voice {
    // Map from ElevenLabs response format to our app's Voice format
    return {
      id: voice.voice_id,
      name: voice.name,
      provider: 'ELEVENLABS',
      gender: voice.gender === 'male' ? 'male' : 
              voice.gender === 'female' ? 'female' : 'neutral',
      previewUrl: voice.preview_url,
      language: voice.language.toUpperCase(),
      languageCode: voice.locale,
      description: voice.description,
      publicOwnerId: voice.public_owner_id,
      public_owner_id: voice.public_owner_id,
      accent: voice.accent,
      age: voice.age,
      use_case: voice.use_case
    };
  }

  public async getAvailableVoices(): Promise<Voice[]> {
    try {
      console.log('Fetching available voices from API...');
      // Add cache busting parameter to prevent browser/network caching
      const cacheBuster = new Date().getTime();
      const response = await apiService.get<{ voices: ElevenLabsVoice[], has_more: boolean }>(
        `/api/shared-voices?_=${cacheBuster}`
      );
      
      if (!response || !response.voices) {
        console.error('Unexpected response format:', response);
        return [];
      }
      
      console.log(`Received ${response.voices.length} voices from API`);
      return response.voices.map(voice => this.mapElevenLabsVoiceToAppVoice(voice));
    } catch (error) {
      console.error('Error fetching available voices:', error);
      throw error;
    }
  }

  /**
   * Search for voices with filtering parameters
   * @param params Search and filter parameters
   * @returns Filtered list of voices
   */
  public async searchVoices(params: {
    search?: string;
    provider?: string;
    gender?: string;
    language?: string;
    category?: string;
    age?: string;
    accent?: string;
    use_cases?: string;
    descriptives?: string;
    featured?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ voices: Voice[], hasMore: boolean }> {
    try {
      console.log('Searching voices with params:', params);
      
      // Build the query parameters
      const queryParams = new URLSearchParams();
      
      // Add cache busting parameter
      queryParams.append('_', new Date().getTime().toString());
      
      // Add search text if provided
      if (params.search) {
        queryParams.append('search', params.search);
      }
      
      // Add gender filter if provided and not 'all'
      if (params.gender && params.gender !== 'all') {
        queryParams.append('gender', params.gender);
      }
      
      // Add language filter if provided and not 'all'
      if (params.language && params.language !== 'all') {
        // Send the language code directly to the API - don't convert to full language name
        queryParams.append('language', params.language);
      }
      
      // Add category filter
      if (params.category && params.category !== 'all') {
        queryParams.append('category', params.category);
      }
      
      // Add age filter
      if (params.age && params.age !== 'all') {
        queryParams.append('age', params.age);
      }
      
      // Add accent filter
      if (params.accent && params.accent !== 'all') {
        queryParams.append('accent', params.accent);
      }
      
      // Add use_cases filter
      if (params.use_cases && params.use_cases !== 'all') {
        queryParams.append('use_cases', params.use_cases);
      }
      
      // Add descriptives filter
      if (params.descriptives && params.descriptives !== 'all') {
        queryParams.append('descriptives', params.descriptives);
      }
      
      // Add featured filter
      if (params.featured === 'true') {
        queryParams.append('featured', 'true');
      }
      
      // Add pagination if provided
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params.page_size !== undefined) {
        queryParams.append('page_size', params.page_size.toString());
      }
      
      // Make the API request
      const response = await apiService.get<{ voices: ElevenLabsVoice[], has_more: boolean }>(
        `/api/shared-voices?${queryParams.toString()}`
      );
      
      if (!response || !response.voices) {
        console.error('Unexpected response format:', response);
        return { voices: [], hasMore: false };
      }
      
      console.log(`Received ${response.voices.length} voices from search API`);
      
      // Map the response to our Voice type
      const voices = response.voices.map(voice => this.mapElevenLabsVoiceToAppVoice(voice));
      
      // If we're filtering by provider and it's not ELEVENLABS, we need to filter client-side
      // since the API only returns ELEVENLABS voices
      if (params.provider && params.provider !== 'all' && params.provider !== 'ELEVENLABS') {
        return { 
          voices: voices.filter(voice => voice.provider === params.provider),
          hasMore: response.has_more
        };
      }
      
      return { 
        voices: voices,
        hasMore: response.has_more
      };
    } catch (error) {
      console.error('Error searching voices:', error);
      throw error;
    }
  }

  public async generateSpeech(request: TTSRequest): Promise<Sound> {
    try {
      console.log('ttsService.generateSpeech starting with:', {
        textLength: request.text.length,
        textStart: request.text.substring(0, 20) + (request.text.length > 20 ? '...' : ''),
        provider: request.provider || 'not specified',
        voiceId: request.voiceId || 'not specified',
        settings: request.settings || {}
      });
      
      // Call TTS API with a direct fetch to handle binary data
      // First get auth headers
      const token = await authService.getToken();
      console.log('Auth token obtained:', !!token);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token?.access_token || ''}`
      };
      
      console.log('Making API request to:', `${API_CONFIG.BASE_URL}/api/tts`);
      console.log('Request body:', JSON.stringify(request));
      
      // Make direct fetch request to handle binary data
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/tts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        console.error('API returned error:', response.status, response.statusText);
        try {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
        } catch (e) {
          console.error('Could not read error response body');
        }
        throw new Error(`API error: ${response.status}`);
      }

      console.log('Successfully received API response, processing blob...');
      
      // Get the response as a blob
      const blob = await response.blob();
      console.log('Blob received, size:', blob.size);
      
      // Use FileSystem's createDownloadResumable for binary data 
      const fileUri = `${FileSystem.cacheDirectory}tts_output.mp3`;
      
      // Create a FileReader to convert the blob to base64
      const reader = new FileReader();
      
      console.log('Converting blob to base64...');
      
      // Convert blob to base64 using a promise
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Get the base64 part after the data URL prefix
            const base64Data = reader.result.split(',')[1];
            console.log('Base64 conversion successful, length:', base64Data.length);
            resolve(base64Data);
          } else {
            console.error('FileReader result is not a string');
            reject(new Error('FileReader result is not a string'));
          }
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
      
      console.log('Writing base64 data to file:', fileUri);
      
      // Write the base64 string to a file
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64
      });

      console.log('File written successfully, creating Sound object...');

      // Play audio with sound
      return new Promise((resolve, reject) => {
        const sound = new Sound(fileUri, '', (error) => {
          if (error) {
            console.error('Error creating Sound object:', error);
            reject(error);
            return;
          }
          console.log('Sound object created successfully');
          resolve(sound);
        });
      });
    } catch (error) {
      console.error('Error in ttsService.generateSpeech:', error);
      throw error;
    }
  }

  public async playTTS(text: string, voiceId: string, provider: 'ELEVENLABS' | 'OPENAI'): Promise<Sound> {
    const request: TTSRequest = {
      text,
      provider,
      voiceId
    };
    return this.generateSpeech(request);
  }

  public async generateVoicePreview(request: VoicePreviewRequest): Promise<string> {
    try {
      // Call voice-preview API with a direct fetch to handle binary data
      // First get auth headers
      const token = await authService.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token?.access_token || ''}`
      };
      
      // Make direct fetch request to handle binary data
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/voice-preview`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Get the response as a blob
      const blob = await response.blob();
      
      // Use FileSystem for file operations
      const fileUri = `${FileSystem.cacheDirectory}preview_${request.voiceId}.mp3`;
      
      // Create a FileReader to convert the blob to base64
      const reader = new FileReader();
      
      // Convert blob to base64 using a promise
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Get the base64 part after the data URL prefix
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
          } else {
            reject(new Error('FileReader result is not a string'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Write the base64 string to a file
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64
      });

      return fileUri;
    } catch (error) {
      console.error('Error generating voice preview:', error);
      throw error;
    }
  }
}

export const ttsService = TTSService.getInstance(); 