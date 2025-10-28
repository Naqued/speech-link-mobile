/**
 * AAC (Augmentative and Alternative Communication) service
 * Handles all API calls for AAC features
 */

import { apiService } from './apiService';
import {
  SentenceCategory,
  SampleSentence,
  CategoryReorderRequest,
  SentenceReorderRequest,
  TTSPreviewRequest,
  AACPreferences
} from '../models/AAC';

// Language mapping for backend compatibility
const LANGUAGE_CODE_MAPPING: Record<string, string> = {
  'hi': 'hi', // Hindi
  'en': 'en', // English
  'fr': 'fr', // French
  'de': 'de', // German
  'es': 'es', // Spanish
  'it': 'it', // Italian
  'ja': 'ja', // Japanese
  'ko': 'ko', // Korean
  'zh': 'zh', // Chinese
  'ar': 'ar', // Arabic
  // Add more mappings as needed
};

/**
 * Normalizes language code for backend compatibility
 * @param language Language code from i18n
 * @returns Normalized language code for backend
 */
const normalizeLanguageCode = (language: string): string => {
  const normalized = LANGUAGE_CODE_MAPPING[language] || language;
  console.log(`[aacService] Language normalization: ${language} -> ${normalized}`);
  return normalized;
};

/**
 * Enhanced API call with detailed error logging and language fallback
 */
const apiCallWithLanguageFallback = async <T>(
  endpoint: string,
  primaryLanguage: string,
  fallbackLanguage: string = 'en'
): Promise<T | null> => {
  const normalizedPrimary = normalizeLanguageCode(primaryLanguage);
  const normalizedFallback = normalizeLanguageCode(fallbackLanguage);
  
  try {
    console.log(`[aacService] Attempting API call: ${endpoint} with language: ${normalizedPrimary}`);
    const response = await apiService.get<T>(endpoint);
    
    // Log successful response details
    console.log(`[aacService] Success for ${normalizedPrimary}:`, {
      endpoint,
      responseSize: JSON.stringify(response).length,
      hasData: !!response
    });
    
    return response;
  } catch (primaryError) {
    console.warn(`[aacService] Primary language (${normalizedPrimary}) failed for ${endpoint}:`, primaryError);
    
    // If primary language fails and it's not English, try English fallback
    if (normalizedPrimary !== normalizedFallback) {
      try {
        const fallbackEndpoint = endpoint.replace(`language=${normalizedPrimary}`, `language=${normalizedFallback}`);
        console.log(`[aacService] Attempting fallback: ${fallbackEndpoint}`);
        
        const fallbackResponse = await apiService.get<T>(fallbackEndpoint);
        
        console.log(`[aacService] Fallback success for ${normalizedPrimary} -> ${normalizedFallback}:`, {
          endpoint: fallbackEndpoint,
          responseSize: JSON.stringify(fallbackResponse).length,
          hasData: !!fallbackResponse
        });
        
        return fallbackResponse;
      } catch (fallbackError) {
        console.error(`[aacService] Fallback language (${normalizedFallback}) also failed for ${endpoint}:`, fallbackError);
        throw fallbackError;
      }
    } else {
      // Primary language is already the fallback language
      throw primaryError;
    }
  }
};

/**
 * Service for handling all AAC-related API calls
 */
export const aacService = {
  /**
   * Get all categories for the current user
   * @param language Language code (e.g., 'en', 'fr', 'hi')
   * @returns Promise with array of categories
   */
  getCategories: async (language = 'en'): Promise<SentenceCategory[]> => {
    try {
      const normalizedLanguage = normalizeLanguageCode(language);
      console.log(`[aacService] getCategories called with language: ${language} (normalized: ${normalizedLanguage})`);
      
      const endpoint = `/api/sentence-categories?language=${normalizedLanguage}`;
      const response = await apiCallWithLanguageFallback<{ categories: SentenceCategory[] }>(
        endpoint,
        language,
        'en'
      );
      
      const categories = response?.categories || [];
      console.log(`[aacService] getCategories response for ${normalizedLanguage}:`, {
        count: categories.length,
        categoryIds: categories.map(c => c.id),
        hasGlobalCategories: categories.some(c => c.isGlobal)
      });
      
      // Additional validation for Hindi
      if (language === 'hi' && categories.length === 0) {
        console.warn(`[aacService] No categories found for Hindi. This might indicate backend data issue.`);
        console.log(`[aacService] Backend endpoint called: ${endpoint}`);
        console.log(`[aacService] Response structure:`, response);
      }
      
      return categories;
    } catch (error) {
      console.error(`[aacService] Error fetching categories for ${language}:`, {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  /**
   * Get a single category by ID
   * @param id Category ID
   * @returns Promise with the category
   */
  getCategoryById: async (id: string): Promise<SentenceCategory> => {
    try {
      const response = await apiService.get<{ category: SentenceCategory }>(`/api/sentence-categories/${id}`);
      return response?.category;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new category
   * @param category Category data
   * @returns Promise with the created category
   */
  createCategory: async (category: Partial<SentenceCategory>): Promise<SentenceCategory> => {
    try {
      const response = await apiService.post<{ category: SentenceCategory }>('/api/sentence-categories', category);
      return response?.category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  /**
   * Update an existing category
   * @param id Category ID
   * @param category Updated category data
   * @returns Promise with the updated category
   */
  updateCategory: async (id: string, category: Partial<SentenceCategory>): Promise<SentenceCategory> => {
    try {
      const response = await apiService.put<{ category: SentenceCategory }>(`/api/sentence-categories/${id}`, category);
      return response?.category;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a category
   * @param id Category ID to delete
   * @param moveTo Optional category ID to move sentences to
   * @returns Promise with success status
   */
  deleteCategory: async (id: string, moveTo?: string): Promise<{ success: boolean }> => {
    try {
      const endpoint = moveTo
        ? `/api/sentence-categories/${id}?moveTo=${moveTo}`
        : `/api/sentence-categories/${id}`;
      
      const response = await apiService.delete<{ success: boolean }>(endpoint);
      return response || { success: false };
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  },

  /**
   * Reorder categories
   * @param request Reorder request data
   * @returns Promise with the updated categories
   */
  reorderCategories: async (request: CategoryReorderRequest): Promise<SentenceCategory[]> => {
    try {
      const response = await apiService.put<{ categories: SentenceCategory[] }>(
        '/api/sentence-categories/reorder',
        request
      );
      return response?.categories || [];
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  },

  /**
   * Get all sentences, optionally filtered by category
   * @param categoryId Optional category ID to filter by
   * @param language Language code (e.g., 'en', 'fr', 'hi')
   * @returns Promise with array of sentences
   */
  getSentences: async (categoryId?: string, language = 'en'): Promise<SampleSentence[]> => {
    try {
      const normalizedLanguage = normalizeLanguageCode(language);
      let endpoint = `/api/sample-sentences?language=${normalizedLanguage}`;
      if (categoryId) {
        endpoint += `&categoryId=${categoryId}`;
      }
      
      console.log(`[aacService] getSentences called with language: ${language} (normalized: ${normalizedLanguage}), categoryId: ${categoryId || 'none'}`);
      console.log(`[aacService] getSentences endpoint: ${endpoint}`);
      
      const response = await apiCallWithLanguageFallback<{ sentences: SampleSentence[] }>(
        endpoint,
        language,
        'en'
      );
      
      const sentences = response?.sentences || [];
      console.log(`[aacService] getSentences response for ${normalizedLanguage}:`, {
        count: sentences.length,
        categoryFilter: categoryId || 'none',
        hasGlobalSentences: sentences.some(s => s.isGlobal),
        sampleTexts: sentences.slice(0, 3).map(s => s.text)
      });
      
      // Additional validation for Hindi
      if (language === 'hi' && sentences.length === 0) {
        console.warn(`[aacService] No sentences found for Hindi. This might indicate backend data issue.`);
        console.log(`[aacService] Backend endpoint called: ${endpoint}`);
        console.log(`[aacService] Response structure:`, response);
        console.log(`[aacService] Category filter applied:`, categoryId);
      }
      
      return sentences;
    } catch (error) {
      console.error(`[aacService] Error fetching sentences for ${language}:`, {
        error,
        categoryId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  /**
   * Get a single sentence by ID
   * @param id Sentence ID
   * @returns Promise with the sentence
   */
  getSentenceById: async (id: string): Promise<SampleSentence> => {
    try {
      const response = await apiService.get<{ sentence: SampleSentence }>(`/api/sample-sentences/${id}`);
      return response?.sentence;
    } catch (error) {
      console.error(`Error fetching sentence ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new sentence
   * @param sentence Sentence data
   * @returns Promise with the created sentence
   */
  createSentence: async (sentence: Partial<SampleSentence>): Promise<SampleSentence> => {
    try {
      const response = await apiService.post<{ sentence: SampleSentence }>('/api/sample-sentences', sentence);
      return response?.sentence;
    } catch (error) {
      console.error('Error creating sentence:', error);
      throw error;
    }
  },

  /**
   * Update an existing sentence
   * @param id Sentence ID
   * @param sentence Updated sentence data
   * @returns Promise with the updated sentence
   */
  updateSentence: async (id: string, sentence: Partial<SampleSentence>): Promise<SampleSentence> => {
    try {
      const response = await apiService.put<{ sentence: SampleSentence }>(`/api/sample-sentences/${id}`, sentence);
      return response?.sentence;
    } catch (error) {
      console.error(`Error updating sentence ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a sentence
   * @param id Sentence ID to delete
   * @returns Promise with success status
   */
  deleteSentence: async (id: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiService.delete<{ success: boolean }>(`/api/sample-sentences/${id}`);
      return response || { success: false };
    } catch (error) {
      console.error(`Error deleting sentence ${id}:`, error);
      throw error;
    }
  },

  /**
   * Increment the usage counter for a sentence
   * @param id Sentence ID
   * @returns Promise with the updated sentence
   */
  incrementSentenceUsage: async (id: string): Promise<SampleSentence> => {
    try {
      const response = await apiService.put<{ sentence: SampleSentence }>(`/api/sample-sentences/${id}/increment`, {});
      return response?.sentence;
    } catch (error) {
      console.error(`Error incrementing sentence ${id} usage:`, error);
      throw error;
    }
  },

  /**
   * Reorder sentences within a category
   * @param request Reorder request data
   * @returns Promise with the updated sentences
   */
  reorderSentences: async (request: SentenceReorderRequest): Promise<SampleSentence[]> => {
    try {
      const response = await apiService.put<{ sentences: SampleSentence[] }>(
        '/api/sample-sentences/reorder',
        request
      );
      return response?.sentences || [];
    } catch (error) {
      console.error('Error reordering sentences:', error);
      throw error;
    }
  },

  /**
   * Preview text-to-speech for a sentence
   * @param request TTS preview request
   * @returns Promise with either an audio URL or binary audio data
   */
  previewTTS: async (request: TTSPreviewRequest): Promise<string | Blob> => {
    try {
      // First check if the apiService supports the responseType option
      // If not, we'll need to handle the response differently
      const response = await apiService.post<{ audioUrl?: string } | Blob>('/api/tts/preview', request);
      
      // Response could be JSON with URL or binary audio data
      if (response && typeof response === 'object' && 'audioUrl' in response) {
        return response.audioUrl as string;
      }
      
      // Assume binary data
      return response as unknown as Blob;
    } catch (error) {
      console.error('Error previewing TTS:', error);
      throw error;
    }
  },

  /**
   * Get AAC preferences for the current user
   * @returns Promise with user preferences
   */
  getPreferences: async (): Promise<AACPreferences> => {
    try {
      const response = await apiService.get<{ preferences: AACPreferences }>('/api/aac-preferences');
      return response?.preferences;
    } catch (error) {
      console.error('Error fetching AAC preferences:', error);
      throw error;
    }
  },

  /**
   * Update AAC preferences for the current user
   * @param preferences Updated preferences data
   * @returns Promise with updated preferences
   */
  updatePreferences: async (preferences: Partial<AACPreferences>): Promise<AACPreferences> => {
    try {
      const response = await apiService.put<{ preferences: AACPreferences }>('/api/aac-preferences', preferences);
      return response?.preferences;
    } catch (error) {
      console.error('Error updating AAC preferences:', error);
      throw error;
    }
  }
}; 