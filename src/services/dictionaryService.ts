/**
 * Dictionary Service
 * 
 * Manages user dictionary entries for speech correction.
 * Communicates with backend API for CRUD operations.
 * 
 * @module services/dictionaryService
 */

import { apiService } from './apiService';

export interface DictionaryEntry {
  id: string;
  userId: string;
  word: string;
  pronunciation: string;
  language: string;
  isAutoLearned: boolean;
  confidence: number | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDictionaryEntryData {
  word: string;
  pronunciation: string;
  language: string;
  isAutoLearned?: boolean;
  confidence?: number;
}

export interface UpdateDictionaryEntryData {
  id: string;
  word?: string;
  pronunciation?: string;
  language?: string;
  confidence?: number;
  usageCount?: number;
}

/**
 * Dictionary Service Class
 * 
 * Provides methods for managing user dictionary entries.
 */
class DictionaryService {
  private static instance: DictionaryService;

  private constructor() {}

  public static getInstance(): DictionaryService {
    if (!DictionaryService.instance) {
      DictionaryService.instance = new DictionaryService();
    }
    return DictionaryService.instance;
  }

  /**
   * Get all dictionary entries for user
   * @param language - Optional language filter
   */
  async getEntries(language?: string): Promise<DictionaryEntry[]> {
    try {
      const params = language ? `?language=${language}` : '';
      const response = await apiService.fetchWithAuth(`/api/user-dictionary${params}`);
      const data = await response.json();
      return data.entries || [];
    } catch (error) {
      console.error('[DictionaryService] Error fetching entries:', error);
      throw error;
    }
  }

  /**
   * Get auto-learned entries only
   * @param language - Optional language filter
   */
  async getAutoLearnedEntries(language?: string): Promise<DictionaryEntry[]> {
    const entries = await this.getEntries(language);
    return entries.filter(entry => entry.isAutoLearned);
  }

  /**
   * Get manual entries only
   * @param language - Optional language filter
   */
  async getManualEntries(language?: string): Promise<DictionaryEntry[]> {
    const entries = await this.getEntries(language);
    return entries.filter(entry => !entry.isAutoLearned);
  }

  /**
   * Create a new dictionary entry
   * @param data - Entry data
   */
  async createEntry(data: CreateDictionaryEntryData): Promise<DictionaryEntry> {
    try {
      console.log('[DictionaryService] Creating entry:', data);
      
      const response = await apiService.fetchWithAuth('/api/user-dictionary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create dictionary entry');
      }

      const result = await response.json();
      console.log('[DictionaryService] Entry created successfully:', result.entry.id);
      
      // Clear API cache to ensure fresh data on next fetch
      apiService.clearCache();
      
      return result.entry;
    } catch (error) {
      console.error('[DictionaryService] Error creating entry:', error);
      throw error;
    }
  }

  /**
   * Create an auto-learned correction
   * Automatically marks as learned and sets confidence
   */
  async createAutoLearnedCorrection(
    word: string,
    pronunciation: string,
    language: string,
    confidence: number = 0.7
  ): Promise<DictionaryEntry> {
    return this.createEntry({
      word,
      pronunciation,
      language,
      isAutoLearned: true,
      confidence,
    });
  }

  /**
   * Update an existing dictionary entry
   * @param data - Update data
   */
  async updateEntry(data: UpdateDictionaryEntryData): Promise<DictionaryEntry> {
    try {
      console.log('[DictionaryService] Updating entry:', data.id);
      
      const response = await apiService.fetchWithAuth(`/api/user-dictionary/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update dictionary entry');
      }

      const result = await response.json();
      console.log('[DictionaryService] Entry updated successfully');
      
      // Clear API cache to ensure fresh data on next fetch
      apiService.clearCache();
      
      return result.entry;
    } catch (error) {
      console.error('[DictionaryService] Error updating entry:', error);
      throw error;
    }
  }

  /**
   * Delete a dictionary entry
   * @param id - Entry ID
   */
  async deleteEntry(id: string): Promise<boolean> {
    try {
      console.log('[DictionaryService] Deleting entry:', id);
      
      const response = await apiService.fetchWithAuth(`/api/user-dictionary/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete dictionary entry');
      }

      console.log('[DictionaryService] Entry deleted successfully');
      
      // Clear API cache to ensure fresh data on next fetch
      apiService.clearCache();
      
      return true;
    } catch (error) {
      console.error('[DictionaryService] Error deleting entry:', error);
      throw error;
    }
  }

  /**
   * Batch delete multiple entries
   * @param ids - Array of entry IDs
   */
  async deleteEntries(ids: string[]): Promise<number> {
    let successCount = 0;
    for (const id of ids) {
      try {
        await this.deleteEntry(id);
        successCount++;
      } catch (error) {
        console.error(`[DictionaryService] Failed to delete entry ${id}:`, error);
      }
    }
    return successCount;
  }

  /**
   * Clear all auto-learned entries
   * Useful for resetting learned corrections
   * @param language - Optional language filter
   */
  async clearAutoLearnedEntries(language?: string): Promise<number> {
    const autoLearnedEntries = await this.getAutoLearnedEntries(language);
    const ids = autoLearnedEntries.map(entry => entry.id);
    return this.deleteEntries(ids);
  }
}

export const dictionaryService = DictionaryService.getInstance();

