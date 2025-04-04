import { apiService } from './apiService';
import { Voice, ttsService } from './ttsService';
import i18next from 'i18next';

export interface VoiceSettings {
  provider: 'ELEVENLABS' | 'OPENAI' | 'RESEMBLE' | 'ELEVEN_LABS';
  voiceId: string;
  settings?: {
    speed?: number;
    pitch?: number;
    stability?: number;
    clarity?: number;
    style?: number;
    [key: string]: any;
  };
  sttProvider?: 'AUTO' | 'DEEPGRAM' | 'WHISPER' | 'SPEECHMATIC' | 'ELEVENLABS';
  enhancementEnabled?: boolean;
  autoSpeakEnabled?: boolean;
  audioRoutingEnabled?: boolean;
}

export interface FavoriteVoice {
  userId: string;
  voiceId: string;
  voiceName: string;
  voiceProvider: 'ELEVENLABS' | 'OPENAI' | 'RESEMBLE' | 'ELEVEN_LABS';
  previewUrl?: string;
  labels?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSettings {
  voiceSettings: VoiceSettings;
  favorites?: {
    voices?: string[];
    sentences?: string[];
  };
  preferredLanguage?: string;
  availableVoices?: Voice[];
}

class VoiceSettingsService {
  private static instance: VoiceSettingsService;

  private constructor() {}

  public static getInstance(): VoiceSettingsService {
    if (!VoiceSettingsService.instance) {
      VoiceSettingsService.instance = new VoiceSettingsService();
    }
    return VoiceSettingsService.instance;
  }

  /**
   * Clear all cached data in the service
   */
  public clearCache(): void {
    console.log('Clearing voice settings service cache');
    // No cached data to clear in this service after our previous changes
    // But we should clear the API cache as well
    apiService.clearCache();
  }

  public async getUserSettings(): Promise<UserSettings> {
    try {
      console.log('Fetching voice settings from API...');
      try {
        // Get voice settings from the API
        const voiceSettingsResponse = await apiService.get<VoiceSettings>('/api/voice-settings');
        console.log('Received voice settings:', JSON.stringify(voiceSettingsResponse));
        
        const userSettings: UserSettings = {
          voiceSettings: voiceSettingsResponse,
          favorites: {
            voices: [],
            sentences: []
          },
          preferredLanguage: 'en'
        };
        
        // Always fetch fresh favorites
        try {
          const favorites = await this.getFavoriteVoices();
          userSettings.favorites = {
            ...userSettings.favorites,
            voices: favorites.map(fav => fav.voiceId)
          };
        } catch (favError) {
          console.log('Could not fetch favorites, using empty list');
        }
        
        return userSettings;
      } catch (settingsError) {
        if (settingsError instanceof Error && 
            (settingsError.message.includes('Endpoint not found') || 
             settingsError.message.includes('404'))) {
          console.log('Voice settings endpoint not available (404), using default settings');
        } else if (settingsError instanceof Error && 
                  settingsError.message.includes('Unauthorized')) {
          console.log('Voice settings auth failed (401), using fallback implementation');
          
          // Create a fallback settings object without dynamic imports
          const defaultSettings = this.getDefaultSettings();
          
          // Attempt to directly fetch available voices from the API
          try {
            // Get favorites (this endpoint works with our token)
            const favorites = await this.getFavoriteVoices();
            console.log(`Found ${favorites.length} favorites to use in fallback implementation`);
            
            if (favorites.length > 0) {
              // If we have favorites, use the first one as the selected voice
              const fallbackVoiceSettings = {
                provider: favorites[0].voiceProvider || 'ELEVENLABS',
                voiceId: favorites[0].voiceId,
                settings: {
                  speed: 1.0,
                  pitch: 0
                },
                enhancementEnabled: false,
                autoSpeakEnabled: true
              };
              
              // Update default settings with our fallback
              defaultSettings.voiceSettings = fallbackVoiceSettings;
              
              // Set favorites
              if (defaultSettings.favorites) {
                defaultSettings.favorites.voices = favorites.map(fav => fav.voiceId);
              }
            }
          } catch (fallbackError) {
            console.error('Error setting up fallback voice settings:', fallbackError);
          }
          
          return defaultSettings;
        } else {
          console.error('Error fetching voice settings:', settingsError);
        }
        
        // But always fetch fresh favorites for the default settings too
        const defaultSettings = this.getDefaultSettings();
        
        try {
          const favorites = await this.getFavoriteVoices();
          if (favorites.length > 0) {
            defaultSettings.favorites = {
              ...defaultSettings.favorites,
              voices: favorites.map(fav => fav.voiceId)
            };
          }
        } catch (e) {
          // Ignore error, just use default empty favorites
        }
        
        return defaultSettings;
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return this.getDefaultSettings();
    }
  }

  public async getFavoriteVoices(): Promise<FavoriteVoice[]> {
    try {
      console.log('Fetching favorite voices...');
      const response = await apiService.get<{favorites: FavoriteVoice[]}>('/api/favorites');
      console.log('Received favorites:', JSON.stringify(response));
      
      // Handle both possible response formats
      const favorites = response.favorites || (Array.isArray(response) ? response : []);
      
      return favorites;
    } catch (error) {
      console.error('Error fetching favorite voices:', error);
      return [];
    }
  }

  private getDefaultSettings(): UserSettings {
    return {
      voiceSettings: {
        provider: 'ELEVENLABS',
        voiceId: '',
        enhancementEnabled: false,
        autoSpeakEnabled: false,
        audioRoutingEnabled: false
      },
      favorites: {
        voices: [],
        sentences: []
      },
      preferredLanguage: 'en'
    };
  }

  // Get shared voice details for a specific voice ID
  private async getSharedVoiceDetails(voiceId: string): Promise<{
    publicOwnerId?: string;
    voiceName?: string;
    gender?: string;
    accent?: string;
    age?: string;
    use_case?: string;
  }> {
    try {
      console.log(`Getting shared voice details for: ${voiceId}`);
      
      // Make a direct request to the shared-voices endpoint
      const cacheBuster = new Date().getTime();
      const sharedVoicesResponse = await apiService.get<{ voices: any[] }>(
        `/api/shared-voices?voice_id=${voiceId}&_=${cacheBuster}`
      );
      
      // Find the matching voice by voice_id
      const voice = sharedVoicesResponse.voices?.find(v => v.voice_id === voiceId);
      
      if (voice) {
        console.log(`Found shared voice: ${voice.name}, publicOwnerId: ${voice.public_owner_id}`);
        return { 
          publicOwnerId: voice.public_owner_id, 
          voiceName: voice.name,
          gender: voice.gender,
          accent: voice.accent,
          age: voice.age,
          use_case: voice.use_case
        };
      }
      
      // If not found with direct query, try all shared voices
      if (!voice) {
        console.log('Voice not found with direct query, trying all shared voices');
        const allSharedVoicesResponse = await apiService.get<{ voices: any[] }>('/api/shared-voices');
        const voiceFromAll = allSharedVoicesResponse.voices?.find(v => v.voice_id === voiceId);
        
        if (voiceFromAll) {
          console.log(`Found shared voice in all voices: ${voiceFromAll.name}, publicOwnerId: ${voiceFromAll.public_owner_id}`);
          return { 
            publicOwnerId: voiceFromAll.public_owner_id, 
            voiceName: voiceFromAll.name,
            gender: voiceFromAll.gender,
            accent: voiceFromAll.accent,
            age: voiceFromAll.age,
            use_case: voiceFromAll.use_case
          };
        }
      }
      
      // As a last resort, try to use hardcoded values for known voice IDs
      const knownVoices: Record<string, { publicOwnerId: string, name: string }> = {
        'aW0z5uDEq3t3v1kvbsXU': {
          publicOwnerId: '211f7388a0b6535686a7e095225d7850ca137562c50f8c0e5e6444ba7a1182d7',
          name: 'Chloe - Mindfulness & Meditation'
        },
        'Tj9l48J9AJbry5yCP5eW': {
          publicOwnerId: '1bdf478ac5e1a81b0b8423faadde277a29cb25195ed2c86adcb0622464c9b930',
          name: 'Matthew Schmitz - Nosferatu Ancient Vampire Lord'
        }
      };
      
      if (knownVoices[voiceId]) {
        console.log(`Using hardcoded values for known voice ID: ${voiceId}`);
        return knownVoices[voiceId];
      }
      
      console.log(`Shared voice not found for ID: ${voiceId}`);
      return {};
    } catch (error) {
      console.error('Error getting shared voice details:', error);
      return {};
    }
  }

  // Get voice data from the server
  private async getVoiceData(voiceId: string): Promise<Voice | null> {
    try {
      // First, try to use current search results from the combined voices array
      // This is the most likely to have complete information
      try {
        // Direct query to the shared-voices endpoint with the specific voice ID
        const cacheBuster = new Date().getTime();
        const specificVoiceResponse = await apiService.get<{ voices: any[] }>(
          `/api/shared-voices?voice_id=${voiceId}&_=${cacheBuster}`
        );
        
        const specificVoice = specificVoiceResponse.voices?.find(v => v.voice_id === voiceId);
        if (specificVoice) {
          console.log('Found specific voice data:', specificVoice);
          return {
            id: specificVoice.voice_id,
            name: specificVoice.name,
            provider: 'ELEVENLABS',
            gender: specificVoice.gender === 'male' ? 'male' : 
                    specificVoice.gender === 'female' ? 'female' : 'neutral',
            previewUrl: specificVoice.preview_url,
            language: specificVoice.language || 'English',
            description: specificVoice.description,
            publicOwnerId: specificVoice.public_owner_id,
            public_owner_id: specificVoice.public_owner_id,
            // Extract other metadata for labels
            accent: specificVoice.accent,
            age: specificVoice.age,
            use_case: specificVoice.use_case
          };
        }
      } catch (specificErr) {
        console.warn('Could not get specific voice data:', specificErr);
      }
      
      // Try to fetch from available voices endpoint
      try {
        const voiceSettingsResponse = await apiService.get<{ voices: Voice[] }>('/api/voice-settings');
        if (voiceSettingsResponse && voiceSettingsResponse.voices) {
          const voice = voiceSettingsResponse.voices.find((v: Voice) => v.id === voiceId);
          if (voice) {
            console.log('Found voice in available voices:', voice);
            return voice;
          }
        }
      } catch (err) {
        console.warn('Could not get voice from voice-settings:', err);
      }
      
      // Try to get voice from shared voices (general query)
      const sharedVoicesResponse = await apiService.get<{ voices: any[] }>('/api/shared-voices');
      const voice = sharedVoicesResponse.voices?.find(v => v.voice_id === voiceId);
      
      if (voice) {
        return {
          id: voice.voice_id,
          name: voice.name,
          provider: 'ELEVENLABS',
          gender: voice.gender === 'male' ? 'male' : 
                  voice.gender === 'female' ? 'female' : 'neutral',
          previewUrl: voice.preview_url,
          language: voice.language || 'English',
          description: voice.description,
          publicOwnerId: voice.public_owner_id,
          public_owner_id: voice.public_owner_id,
          // Extract other metadata for labels
          accent: voice.accent,
          age: voice.age,
          use_case: voice.use_case
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting voice data:', error);
      return null;
    }
  }

  public async updateVoiceSettings(settings: VoiceSettings): Promise<VoiceSettings> {
    try {
      console.log('Updating voice settings:', JSON.stringify(settings));
      
      // Get the voice details to include publicOwnerId and voiceName
      let publicOwnerId: string | undefined;
      let voiceName: string | undefined;
      
      if (settings.provider === 'ELEVENLABS') {
        try {
          // Use the specialized function for getting shared voice details
          const sharedVoiceDetails = await this.getSharedVoiceDetails(settings.voiceId);
          publicOwnerId = sharedVoiceDetails.publicOwnerId;
          voiceName = sharedVoiceDetails.voiceName;
          
          if (publicOwnerId && voiceName) {
            console.log('Found shared voice details:', { 
              voiceId: settings.voiceId, 
              publicOwnerId, 
              voiceName 
            });
          } else {
            // Fallback to try to get the voice data from other sources
            const voiceData = await this.getVoiceData(settings.voiceId);
            if (voiceData) {
              publicOwnerId = voiceData.public_owner_id || voiceData.publicOwnerId;
              voiceName = voiceData.name;
              console.log('Found voice data (fallback):', { 
                voiceId: settings.voiceId, 
                publicOwnerId, 
                voiceName 
              });
            }
          }
        } catch (err) {
          console.warn('Could not get voice data, proceeding anyway:', err);
        }
      }
      
      // Map our internal field names to what the API expects and match exactly the web project format
      const apiRequest = {
        // Always use selectedVoice (not voiceId)
        selectedVoice: settings.voiceId,
        // Always use ELEVEN_LABS (with underscore)
        provider: settings.provider === 'ELEVENLABS' ? 'ELEVEN_LABS' : settings.provider,
        speed: settings.settings?.speed || 1.0,
        pitch: settings.settings?.pitch || 0,
        enhancementEnabled: settings.enhancementEnabled || false,
        sttProvider: settings.sttProvider || 'AUTO',
        autoSpeakEnabled: settings.autoSpeakEnabled !== undefined ? settings.autoSpeakEnabled : true,
        // Include these fields needed for shared voices only if they exist
        ...(publicOwnerId && { publicOwnerId }),
        ...(voiceName && { voiceName })
      };
      
      console.log('Mapped API request:', JSON.stringify(apiRequest));
      const response = await apiService.post<VoiceSettings>('/api/voice-settings', apiRequest);
      
      return response;
    } catch (error) {
      console.error('Error updating voice settings:', error);
      throw error; // Let the caller handle the error
    }
  }

  public async toggleFavoriteVoice(
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
  ): Promise<boolean> {
    try {
      if (isFavorite) {
        // Adding to favorites
        console.log(`Adding favorite voice: ${voiceId}${voiceName ? ` (${voiceName})` : ''}`);
        
        // Create a favorite request object with the data we have
        const favoriteRequest: any = {
          voiceId,
          voiceProvider: 'ELEVEN_LABS' as const,
        };
        
        // If we have a name, use it directly - this is the most reliable approach
        if (voiceName) {
          console.log(`Using provided voice name: ${voiceName}`);
          favoriteRequest.voiceName = voiceName;
          
          // If we already have the metadata, use it directly
          if (voiceDetails) {
            console.log('Using provided voice details');
            
            if (voiceDetails.publicOwnerId) {
              favoriteRequest.publicOwnerId = voiceDetails.publicOwnerId;
            }
            
            if (voiceDetails.previewUrl) {
              favoriteRequest.previewUrl = voiceDetails.previewUrl;
            }
            
            // Add any metadata we have
            favoriteRequest.labels = { 
              gender: voiceDetails.gender || 'neutral',
              accent: voiceDetails.accent || 'american',
              age: voiceDetails.age || 'young',
              use_case: voiceDetails.use_case || 'general'
            };
            
            // Add description if available
            if (voiceDetails.description) {
              favoriteRequest.description = voiceDetails.description;
            }
          } else {
            // No details provided, try to get them
            try {
              // Make a single API call to get additional metadata if possible
              const fetchedDetails = await this.getSharedVoiceDetails(voiceId);
              
              if (fetchedDetails.publicOwnerId) {
                favoriteRequest.publicOwnerId = fetchedDetails.publicOwnerId;
                
                // Add any additional metadata we found
                favoriteRequest.labels = { 
                  gender: fetchedDetails.gender || 'neutral',
                  accent: fetchedDetails.accent || 'american',
                  age: fetchedDetails.age || 'young',
                  use_case: fetchedDetails.use_case || 'general'
                };
                
                console.log(`Enhanced favorite with details: publicOwnerId=${fetchedDetails.publicOwnerId}`);
              }
            } catch (err) {
              // Not critical if this fails since we already have the name
              console.warn('Could not get additional voice details, continuing with basic favorite:', err);
            }
          }
        } else {
          // We don't have a name, need to fetch it
          console.warn('No voice name provided, fetching from API...');
          
          try {
            // Make a direct request to get voice details
            const fetchedDetails = await this.getSharedVoiceDetails(voiceId);
            
            if (fetchedDetails.voiceName) {
              favoriteRequest.voiceName = fetchedDetails.voiceName;
              console.log(`Found voice name from API: ${fetchedDetails.voiceName}`);
              
              if (fetchedDetails.publicOwnerId) {
                favoriteRequest.publicOwnerId = fetchedDetails.publicOwnerId;
                
                // Add any additional metadata we found
                favoriteRequest.labels = { 
                  gender: fetchedDetails.gender || 'neutral',
                  accent: fetchedDetails.accent || 'american',
                  age: fetchedDetails.age || 'young',
                  use_case: fetchedDetails.use_case || 'general'
                };
              }
            } else {
              // If we still don't have a name, use a fallback
              favoriteRequest.voiceName = `Voice ${voiceId.substring(0, 8)}`;
              console.warn(`Could not find voice name, using fallback: ${favoriteRequest.voiceName}`);
            }
          } catch (error) {
            // Last resort fallback if all API calls fail
            favoriteRequest.voiceName = `Voice ${voiceId.substring(0, 8)}`;
            console.error('Failed to get voice details, using fallback name:', error);
          }
        }
        
        console.log('Adding favorite with data:', JSON.stringify(favoriteRequest));
        await apiService.post<{ favorite: FavoriteVoice }>('/api/favorites', favoriteRequest);
        return true;
      } else {
        // Removing from favorites
        console.log(`Removing favorite voice: ${voiceId}`);
        try {
          await apiService.delete<{ success: boolean }>(`/api/favorites/${voiceId}`);
        } catch (deleteError) {
          // Special handling for server errors when removing favorites
          console.warn(`Error removing favorite (${voiceId}), but continuing anyway:`, deleteError);
          
          // Even if the server returns 500, we want the UI to update
          // We'll return true and let the UI show it as removed
          return true;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling favorite voice:', error);
      return false; // Let the caller know there was an actual error
    }
  }

  public async setPreferredLanguage(language: string): Promise<boolean> {
    try {
      console.log(`Setting preferred language to: ${language}`);
      await apiService.post<{ success: boolean }>('/api/user/language', {
        language
      });
      
      return true;
    } catch (error) {
      console.error('Error setting preferred language:', error);
      return false;
    }
  }

  public async getVoicePreview(voiceId: string, provider: 'ELEVENLABS' | 'OPENAI', publicOwnerId?: string, voiceName?: string, language?: string): Promise<string> {
    try {
      console.log(`Getting voice preview for: ${voiceId} (${provider})`);
      
      // Generate a random number between 1 and 4 to select one of the preview texts
      const previewTextNumber = Math.floor(Math.random() * 4) + 1;
      const previewText = i18next.t(`voice.preview.text-${previewTextNumber}`);
      
      // Get current language if none provided
      const currentLanguage = language || i18next.language;
      console.log(`Using language for preview: ${currentLanguage}`);
      
      // First, try the standard API approach
      try {
        // Check if the API response contains a previewUrl
        const response = await apiService.post<{ previewUrl?: string, audioUrl?: string }>('/api/voice-preview', {
          voiceId,
          provider,
          text: previewText,
          publicOwnerId,
          voiceName,
          lang: currentLanguage
        });
        
        // If the API returns a URL, use that directly
        if (response.previewUrl) {
          console.log('Using previewUrl from API response');
          return response.previewUrl;
        }
        
        if (response.audioUrl) {
          console.log('Using audioUrl from API response');
          return response.audioUrl;
        }
      } catch (urlError) {
        console.log('PreviewUrl approach failed, trying binary approach', urlError);
      }
      
      // If we don't get a URL, fall back to binary data approach
      // This uses the TTS service directly
      const preview = await ttsService.generateVoicePreview({
        voiceId,
        provider,
        text: previewText,
        publicOwnerId,
        voiceName,
        language: currentLanguage
      });
      
      return preview;
    } catch (error) {
      console.error('Error getting voice preview:', error);
      throw error;
    }
  }
}

export const voiceSettingsService = VoiceSettingsService.getInstance(); 