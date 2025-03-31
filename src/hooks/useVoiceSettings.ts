import { useState, useEffect, useCallback } from 'react';
import { voiceSettingsService, VoiceSettings, UserSettings, FavoriteVoice } from '../services/voiceSettingsService';
import { Voice } from '../services/ttsService';
import { ttsService } from '../services/ttsService';

export interface UseVoiceSettingsResult {
  userSettings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  availableVoices: Voice[];
  loadingVoices: boolean;
  favoriteVoices: FavoriteVoice[];
  loadingFavorites: boolean;
  updateVoiceSettings: (settings: VoiceSettings) => Promise<void>;
  toggleFavoriteVoice: (
    voiceId: string, 
    isFavorite: boolean, 
    voiceName?: string, 
    voiceDetails?: {
      gender?: string;
      accent?: string;
      age?: string;
      use_case?: string;
      description?: string;
      publicOwnerId?: string;
      previewUrl?: string;
    }
  ) => Promise<void>;
  refreshSettings: () => Promise<void>;
  getFavoriteVoices: () => Promise<FavoriteVoice[]>;
  previewVoice: (voiceId: string, provider: 'ELEVENLABS' | 'OPENAI', publicOwnerId?: string, voiceName?: string) => Promise<string>;
  setPreferredLanguage: (language: string) => Promise<void>;
  searchVoices: (params: {
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
  }) => Promise<{ voices: Voice[], hasMore: boolean }>;
}

export const useVoiceSettings = (): UseVoiceSettingsResult => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState<boolean>(true);
  const [favoriteVoices, setFavoriteVoices] = useState<FavoriteVoice[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(true);

  const fetchUserSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const settings = await voiceSettingsService.getUserSettings();
      setUserSettings(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user settings');
      console.error('Error fetching user settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAvailableVoices = useCallback(async () => {
    try {
      setLoadingVoices(true);
      const voices = await ttsService.getAvailableVoices();
      setAvailableVoices(voices);
    } catch (err) {
      console.error('Error fetching available voices:', err);
      // Don't set error state here to avoid blocking UI if only voices fail to load
    } finally {
      setLoadingVoices(false);
    }
  }, []);

  const getFavoriteVoices = useCallback(async () => {
    try {
      setLoadingFavorites(true);
      const favorites = await voiceSettingsService.getFavoriteVoices();
      setFavoriteVoices(favorites);
      return favorites;
    } catch (err) {
      console.error('Error fetching favorite voices:', err);
      return [];
    } finally {
      setLoadingFavorites(false);
    }
  }, []);

  const updateVoiceSettings = useCallback(async (settings: VoiceSettings) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedSettings = await voiceSettingsService.updateVoiceSettings(settings);
      
      // Update local state with new settings
      setUserSettings(prev => prev ? {
        ...prev,
        voiceSettings: updatedSettings
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update voice settings');
      console.error('Error updating voice settings:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFavoriteVoice = useCallback(async (
    voiceId: string, 
    isFavorite: boolean, 
    voiceName?: string, 
    voiceDetails?: {
      gender?: string;
      accent?: string;
      age?: string;
      use_case?: string;
      description?: string;
      publicOwnerId?: string;
      previewUrl?: string;
    }
  ) => {
    try {
      const success = await voiceSettingsService.toggleFavoriteVoice(voiceId, isFavorite, voiceName, voiceDetails);
      
      if (success) {
        // Refresh favorites after toggling
        await getFavoriteVoices();
        
        // Also update the user settings structure if it exists
        if (userSettings?.favorites) {
          // Update local favorites state
          const updatedFavorites = userSettings.favorites.voices ? [...userSettings.favorites.voices] : [];
          
          if (isFavorite) {
            if (!updatedFavorites.includes(voiceId)) {
              updatedFavorites.push(voiceId);
            }
          } else {
            const index = updatedFavorites.indexOf(voiceId);
            if (index > -1) {
              updatedFavorites.splice(index, 1);
            }
          }
          
          setUserSettings(prev => prev ? {
            ...prev,
            favorites: {
              ...prev.favorites,
              voices: updatedFavorites
            }
          } : null);
        }
      } else {
        // Still update the UI even if there was a server error
        // This ensures the UX is smooth even if the backend has issues
        if (userSettings?.favorites) {
          // Update local favorites state optimistically
          const updatedFavorites = userSettings.favorites.voices ? [...userSettings.favorites.voices] : [];
          
          if (isFavorite) {
            if (!updatedFavorites.includes(voiceId)) {
              updatedFavorites.push(voiceId);
            }
          } else {
            const index = updatedFavorites.indexOf(voiceId);
            if (index > -1) {
              updatedFavorites.splice(index, 1);
            }
          }
          
          setUserSettings(prev => prev ? {
            ...prev,
            favorites: {
              ...prev.favorites,
              voices: updatedFavorites
            }
          } : null);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite voice:', err);
      // Don't re-throw the error to keep the UI responsive
      // Just show a console error
    }
  }, [userSettings, getFavoriteVoices]);

  const previewVoice = useCallback(async (voiceId: string, provider: 'ELEVENLABS' | 'OPENAI', publicOwnerId?: string, voiceName?: string) => {
    try {
      return await voiceSettingsService.getVoicePreview(voiceId, provider, publicOwnerId, voiceName);
    } catch (err) {
      console.error('Error previewing voice:', err);
      throw err;
    }
  }, []);

  const setPreferredLanguage = useCallback(async (language: string) => {
    try {
      setIsLoading(true);
      const success = await voiceSettingsService.setPreferredLanguage(language);
      
      if (success) {
        // Update local state
        setUserSettings(prev => prev ? {
          ...prev,
          preferredLanguage: language
        } : null);
      }
    } catch (err) {
      console.error('Error setting preferred language:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    voiceSettingsService.clearCache();
    await Promise.all([
      fetchUserSettings(),
      fetchAvailableVoices(),
      getFavoriteVoices()
    ]);
  }, [fetchUserSettings, fetchAvailableVoices, getFavoriteVoices]);

  const searchVoices = useCallback(async (params: {
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
  }) => {
    try {
      return await ttsService.searchVoices(params);
    } catch (err) {
      console.error('Error searching voices:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchUserSettings();
    fetchAvailableVoices();
    getFavoriteVoices();
  }, [fetchUserSettings, fetchAvailableVoices, getFavoriteVoices]);

  return {
    userSettings,
    isLoading,
    error,
    availableVoices,
    loadingVoices,
    favoriteVoices,
    loadingFavorites,
    updateVoiceSettings,
    toggleFavoriteVoice,
    refreshSettings,
    getFavoriteVoices,
    previewVoice,
    setPreferredLanguage,
    searchVoices
  };
}; 