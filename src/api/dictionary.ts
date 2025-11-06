import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { Audio } from 'expo-av';
import { authService } from '../services/authService';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const tokenData = await authService.getToken();
  if (tokenData) {
    const token = tokenData.access_token || tokenData.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Dictionary API] Added Authorization header');
    }
  }
  return config;
});

// Types
export interface DictionaryEntry {
  id: string;
  word: string;
  pronunciation: string;
  language: string;
  isAutoLearned: boolean;
  confidence: number | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDictionaryEntryDTO {
  word: string;
  pronunciation: string;
  language?: string;
}

export interface UpdateDictionaryEntryDTO {
  word?: string;
  pronunciation?: string;
  language?: string;
}

/**
 * Get all dictionary entries for the current user
 */
export const getDictionaryEntries = async (language: string = 'en'): Promise<DictionaryEntry[]> => {
  try {
    console.log('[Dictionary API] Fetching entries for language:', language);
    const response = await apiClient.get(`/api/user-dictionary?language=${language}`);
    console.log('[Dictionary API] Fetched entries:', response.data.entries?.length || 0);
    return response.data.entries || [];
  } catch (error: any) {
    console.error('[Dictionary API] Failed to fetch entries:', error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

/**
 * Get a specific dictionary entry by ID
 */
export const getDictionaryEntry = async (id: string): Promise<DictionaryEntry> => {
  try {
    console.log('[Dictionary API] Fetching entry:', id);
    const response = await apiClient.get(`/api/user-dictionary/${id}`);
    console.log('[Dictionary API] Fetched entry:', response.data.entry);
    return response.data.entry;
  } catch (error: any) {
    console.error('[Dictionary API] Failed to fetch entry:', error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

/**
 * Create a new dictionary entry
 */
export const createDictionaryEntry = async (data: CreateDictionaryEntryDTO): Promise<DictionaryEntry> => {
  try {
    console.log('[Dictionary API] Creating entry:', data);
    const response = await apiClient.post('/api/user-dictionary', data);
    console.log('[Dictionary API] Created entry:', response.data.entry);
    return response.data.entry;
  } catch (error: any) {
    console.error('[Dictionary API] Failed to create entry:', error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.response?.data?.details) {
      throw new Error(error.response.data.details.join(', '));
    }
    throw error;
  }
};

/**
 * Update an existing dictionary entry
 */
export const updateDictionaryEntry = async (id: string, data: UpdateDictionaryEntryDTO): Promise<DictionaryEntry> => {
  try {
    console.log('[Dictionary API] Updating entry:', id, data);
    const response = await apiClient.put(`/api/user-dictionary/${id}`, data);
    console.log('[Dictionary API] Updated entry:', response.data.entry);
    return response.data.entry;
  } catch (error: any) {
    console.error('[Dictionary API] Failed to update entry:', error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.response?.data?.details) {
      throw new Error(error.response.data.details.join(', '));
    }
    throw error;
  }
};

/**
 * Delete a dictionary entry
 */
export const deleteDictionaryEntry = async (id: string): Promise<void> => {
  try {
    console.log('[Dictionary API] Deleting entry:', id);
    await apiClient.delete(`/api/user-dictionary/${id}`);
    console.log('[Dictionary API] Deleted entry:', id);
  } catch (error: any) {
    console.error('[Dictionary API] Failed to delete entry:', error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

/**
 * Preview pronunciation using TTS
 */
export const previewPronunciation = async (pronunciation: string, language: string = 'en'): Promise<void> => {
  try {
    console.log('[Dictionary API] Previewing pronunciation:', pronunciation, language);
    
    const response = await apiClient.post(
      '/api/user-dictionary/preview',
      { pronunciation, language },
      { responseType: 'arraybuffer' }
    );

    // Convert array buffer to base64
    const base64Audio = arrayBufferToBase64(response.data);
    
    // Play the audio using Expo AV
    const { sound } = await Audio.Sound.createAsync(
      { uri: `data:audio/mpeg;base64,${base64Audio}` },
      { shouldPlay: true }
    );
    
    // Cleanup when done
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
    
    console.log('[Dictionary API] Playing pronunciation preview');
  } catch (error: any) {
    console.error('[Dictionary API] Failed to preview pronunciation:', error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

/**
 * Helper function to convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

