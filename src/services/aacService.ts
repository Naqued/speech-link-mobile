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
  TTSPreviewRequest
} from '../models/AAC';

/**
 * Service for handling all AAC-related API calls
 */
export const aacService = {
  /**
   * Get all categories for the current user
   * @param language Language code (e.g., 'en', 'fr')
   * @returns Promise with array of categories
   */
  getCategories: async (language = 'en'): Promise<SentenceCategory[]> => {
    try {
      const response = await apiService.get<{ categories: SentenceCategory[] }>(`/api/sentence-categories?language=${language}`);
      return response?.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
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
   * @param language Language code (e.g., 'en', 'fr')
   * @returns Promise with array of sentences
   */
  getSentences: async (categoryId?: string, language = 'en'): Promise<SampleSentence[]> => {
    try {
      let endpoint = `/api/sample-sentences?language=${language}`;
      if (categoryId) {
        endpoint += `&categoryId=${categoryId}`;
      }
      
      const response = await apiService.get<{ sentences: SampleSentence[] }>(endpoint);
      return response?.sentences || [];
    } catch (error) {
      console.error('Error fetching sentences:', error);
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
  }
}; 