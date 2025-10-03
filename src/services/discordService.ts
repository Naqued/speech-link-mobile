import { apiService } from './apiService';

export interface DiscordServer {
  id: string;
  name: string;
  icon: string | null;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

export interface DiscordSettings {
  connected: boolean;
  discordUserId?: string;
  discordUsername?: string;
  selectedServerId?: string;
  selectedServerName?: string;
  selectedChannelId?: string;
  selectedChannelName?: string;
  isConnected: boolean;
}

export interface ConnectionStatus {
  isConnected: boolean;
  connectionDetails?: {
    serverId: string;
    serverName: string;
    channelId: string;
    channelName: string;
    connectedAt: number;
    durationMs: number;
  };
}

// Define a more flexible response type to handle various response formats
interface ApiResponse<T = any> {
  data?: T;
  success?: boolean;
  message?: string;
  authUrl?: string; // Add this for direct access to authUrl in response
  tempKey?: string; // Add this for temporary authentication keys
  [key: string]: any; // Allow for any other properties
}

/**
 * Service for handling Discord integration
 */
export const discordService = {
  /**
   * Get Discord OAuth authorization URL
   */
  getAuthUrl: async (): Promise<string> => {
    try {
      const response = await apiService.get<ApiResponse>('/api/discord/auth', false);
      
      // Log the full response for debugging
      console.log('Auth URL Response:', JSON.stringify(response));
      
      // Check if the response has the authUrl directly at the root level
      if (response && response.authUrl) {
        return response.authUrl;
      }
      
      // Or check if it's nested in a data property
      if (response && response.data && response.data.authUrl) {
        return response.data.authUrl;
      }
      
      // If we get here, throw an error with details
      console.error('Invalid authUrl response format:', response);
      throw new Error('Failed to get Discord authorization URL: Invalid response format');
    } catch (error) {
      console.error('Error getting Discord auth URL:', error);
      throw error;
    }
  },

  /**
   * Handle OAuth callback from Discord
   */
  handleCallback: async (code: string): Promise<boolean> => {
    try {
      // First try direct processing if we have a code
      if (code) {
        try {
          const response = await apiService.post<ApiResponse>('/api/discord/auth/mobile', {
            operation: 'process-code',
            code: code
          });
          
          if (response.success || (response.data && response.data.success)) {
            return true;
          }
        } catch (err) {
          console.log('Direct code processing failed, will check for temp keys');
        }
      }
      
      // Check if there are any pending auth requests
      try {
        // First see if we're already authenticated
        const checkResponse = await apiService.post<ApiResponse>('/api/discord/auth/mobile', {
          operation: 'check-auth'
        });
        
        // If already authenticated, return true
        if (checkResponse.isAuthenticated || 
           (checkResponse.data && checkResponse.data.isAuthenticated)) {
          return true;
        }
        
        // Next, check for any temporary auth keys we can claim
        // In React Native, we can't use document.cookie, so we poll the server instead
        const tempKeyResponse = await apiService.post<ApiResponse>('/api/discord/auth/mobile', {
          operation: 'check-temp-keys'
        });
        
        // If we found a temporary key, verify and claim it
        if (tempKeyResponse.tempKey || 
           (tempKeyResponse.data && tempKeyResponse.data.tempKey)) {
          const tempKey = tempKeyResponse.tempKey || tempKeyResponse.data.tempKey;
          console.log('Found temp key from server:', tempKey);
          
          const verifyResponse = await apiService.post<ApiResponse>('/api/discord/auth/mobile', {
            operation: 'verify-temp-key',
            tempKey: tempKey
          });
          
          if (verifyResponse.success || (verifyResponse.data && verifyResponse.data.success)) {
            return true;
          }
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
      }
      
      // Poll for temp key verification for a limited time
      let attempts = 0;
      const maxAttempts = 30; // Try for about 30 seconds
      
      console.log('Starting to poll for authentication completion...');
      
      while (attempts < maxAttempts) {
        try {
          // Check for any pending temp keys
          console.log(`Polling attempt ${attempts + 1}/${maxAttempts}...`);
          const tempKeyResponse = await apiService.post<ApiResponse>('/api/discord/auth/mobile', {
            operation: 'check-temp-keys'
          });
          
          if (tempKeyResponse.tempKey || 
             (tempKeyResponse.data && tempKeyResponse.data.tempKey)) {
            const tempKey = tempKeyResponse.tempKey || tempKeyResponse.data.tempKey;
            console.log('Found temp key during polling:', tempKey);
            
            const verifyResponse = await apiService.post<ApiResponse>('/api/discord/auth/mobile', {
              operation: 'verify-temp-key',
              tempKey: tempKey
            });
            
            if (verifyResponse.success || (verifyResponse.data && verifyResponse.data.success)) {
              console.log('Successfully verified and claimed temp key!');
              return true;
            } else {
              console.log('Temp key verification failed:', 
                verifyResponse.error || verifyResponse.data?.error || 'Unknown error');
            }
          } else {
            console.log('No temp keys found in this polling attempt');
          }
        } catch (err) {
          console.error('Error during temp key verification cycle:', 
            err instanceof Error ? err.message : 'Unknown error');
        }
        
        // Wait for 1 second before trying again
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      console.log('Polling complete without finding a valid auth token');
      // If we got here, we couldn't verify 
      return false;
    } catch (error) {
      console.error('Error handling Discord callback:', error);
      throw error;
    }
  },

  /**
   * Check for pending auth requests
   */
  checkPendingAuth: async (): Promise<string | null> => {
    try {
      const response = await apiService.post<ApiResponse>('/api/discord/auth/mobile', {
        operation: 'check-temp-keys'
      });
      
      return response.tempKey || null;
    } catch (error) {
      console.error('Error checking pending auth:', error);
      return null;
    }
  },
  
  /**
   * Verify a temporary authentication key
   */
  verifyTempKey: async (tempKey: string): Promise<boolean> => {
    try {
      const response = await apiService.post<ApiResponse>('/api/discord/auth/mobile', {
        operation: 'verify-temp-key',
        tempKey
      });
      
      return response.success || (response.data && response.data.success) || false;
    } catch (error) {
      console.error('Error verifying temp key:', error);
      return false;
    }
  },

  /**
   * Get user's Discord servers
   */
  getServers: async (): Promise<DiscordServer[]> => {
    try {
      console.log('Fetching Discord servers...');
      const response = await apiService.get<ApiResponse>('/api/discord/servers', false);
      
      // Log the full response for debugging
      console.log('Discord servers response:', JSON.stringify(response));
      
      // Handle different response formats
      if (response && Array.isArray(response)) {
        console.log('Received array of servers directly:', response.length);
        return response;
      }
      
      if (response && response.servers && Array.isArray(response.servers)) {
        console.log('Received servers in root property:', response.servers.length);
        return response.servers;
      }
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log('Received servers in data property as array:', response.data.length);
        return response.data;
      }
      
      if (response && response.data && response.data.servers && Array.isArray(response.data.servers)) {
        console.log('Received servers in data.servers:', response.data.servers.length);
        return response.data.servers;
      }
      
      // If no appropriate array is found, log the issue and return empty array
      console.error('Discord servers response did not contain an array of servers:', response);
      return [];
    } catch (error) {
      console.error('Error getting Discord servers:', error);
      throw error;
    }
  },

  /**
   * Get voice channels for a server
   */
  getChannels: async (serverId: string): Promise<DiscordChannel[]> => {
    try {
      console.log(`Fetching Discord channels for server ${serverId}...`);
      const response = await apiService.get<ApiResponse>(`/api/discord/channels/${serverId}`, false);
      
      // Log the full response for debugging
      console.log('Discord channels response:', JSON.stringify(response));
      
      // Handle different response formats
      if (response && Array.isArray(response)) {
        console.log('Received array of channels directly:', response.length);
        return response;
      }
      
      if (response && response.channels && Array.isArray(response.channels)) {
        console.log('Received channels in root property:', response.channels.length);
        return response.channels;
      }
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log('Received channels in data property as array:', response.data.length);
        return response.data;
      }
      
      if (response && response.data && response.data.channels && Array.isArray(response.data.channels)) {
        console.log('Received channels in data.channels:', response.data.channels.length);
        return response.data.channels;
      }
      
      // If no appropriate array is found, log the issue and return empty array
      console.error('Discord channels response did not contain an array of channels:', response);
      return [];
    } catch (error) {
      console.error(`Error getting Discord channels for server ${serverId}:`, error);
      throw error;
    }
  },

  /**
   * Get user's Discord settings
   */
  getSettings: async (): Promise<DiscordSettings> => {
    try {
      const response = await apiService.get<DiscordSettings>('/api/discord/settings', false);
      return response;
    } catch (error) {
      console.error('Error getting Discord settings:', error);
      throw error;
    }
  },

  /**
   * Update Discord settings
   */
  updateSettings: async (settings: {
    selectedServerId: string;
    selectedServerName: string;
    selectedChannelId: string;
    selectedChannelName: string;
  }): Promise<boolean> => {
    try {
      // Add isConnected flag to settings to ensure Discord audio integration works
      const updatedSettings = {
        ...settings,
        isConnected: true  // Explicitly set this to true to enable audio integration
      };
      
      console.log('Updating Discord settings:', JSON.stringify(updatedSettings));
      const response = await apiService.post<ApiResponse>('/api/discord/settings', updatedSettings);
      console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~SETTINGS UPDATED~~~~~~~~~~~~~~~~~~~~~~~~~~")
      // Log the full response for debugging
      console.log('Discord updateSettings response:', JSON.stringify(response));
      
      // First check if we got a successful HTTP status (200-299)
      if (response && response._response && response._response.status >= 200 && response._response.status < 300) {
        console.log('Settings update HTTP status indicates success:', response._response.status);
        // Consider HTTP success as a successful operation
        return true;
      }
      
      // Check various response formats for success indicator
      if (response && response.success === true) {
        console.log('Found success flag in root of response');
        return true;
      }
      
      if (response && response.data && response.data.success === true) {
        console.log('Found success flag in data property');
        return true;
      }
      
      // If response contains a message but no explicit error, assume success
      if (response && response.message && !response.error) {
        console.log('Response contains message without error, assuming success');
        return true;
      }
      
      if (response && response.data && response.data.message && !response.data.error) {
        console.log('Response data contains message without error, assuming success');
        return true;
      }
      
      // If we get here, we couldn't find a clear success indicator
      console.warn('Could not determine success from response:', response);
      return false;
    } catch (error) {
      console.error('Error updating Discord settings:', error);
      throw error;
    }
  },

  /**
   * Connect to Discord voice channel
   */
  connect: async (): Promise<boolean> => {
    try {
      console.log('Requesting Discord voice channel connection');
      const response = await apiService.post<ApiResponse>('/api/discord/connect', {});
      
      // Add a detailed log of the response
      console.log('Discord connect response:', JSON.stringify(response));
      
      // Consider HTTP success as a successful operation
      if (response && response._response && response._response.status >= 200 && response._response.status < 300) {
        console.log('Connect request HTTP status indicates success:', response._response.status);
        return true;
      }
      
      // Check various response formats for success indicator
      if (response && response.success === true) {
        return true;
      }
      
      if (response && response.data && response.data.success === true) {
        return true;
      }
      
      // If we get here without a return, the connection wasn't successful
      console.warn('Discord connect did not return a clear success indicator:', response);
      return false;
    } catch (error) {
      console.error('Error connecting to Discord:', error);
      throw error;
    }
  },

  /**
   * Disconnect from Discord voice channel
   */
  disconnect: async (): Promise<boolean> => {
    try {
      console.log('Requesting Discord voice channel disconnection');
      const response = await apiService.post<ApiResponse>('/api/discord/disconnect', {});
      
      // Add a detailed log of the response
      console.log('Discord disconnect response:', JSON.stringify(response));
      
      // Consider HTTP success as a successful operation even if the response body doesn't indicate success
      if (response && response._response && response._response.status >= 200 && response._response.status < 300) {
        console.log('Disconnect request HTTP status indicates success:', response._response.status);
        return true;
      }
      
      // Check various response formats for success indicator
      if (response && response.success === true) {
        return true;
      }
      
      if (response && response.data && response.data.success === true) {
        return true;
      }
      
      // If we get here without a return, log a warning but still return true to update the UI
      // This is intentional to avoid getting stuck in a connected state in the UI
      console.warn('Discord disconnect did not return a clear success indicator, but proceeding anyway');
      return true;
    } catch (error) {
      console.error('Error disconnecting from Discord:', error);
      // Return true even on error to ensure the UI updates
      // This is a fail-safe to prevent the UI from getting stuck in a "connected" state
      return true;
    }
  },

  /**
   * Get connection status
   */
  getConnectionStatus: async (): Promise<ConnectionStatus> => {
    try {
      // Add a cache-busting timestamp to prevent cached responses
      const timestamp = Date.now();
      const response = await apiService.get<ConnectionStatus>(`/api/discord/connection-status?_t=${timestamp}`, false);
      
      // Log the response for debugging
      console.log('Discord connection status response:', JSON.stringify(response));
      
      return response;
    } catch (error) {
      console.error('Error getting Discord connection status:', error);
      throw error;
    }
  },

  /**
   * Stream synthesized speech to Discord
   */
  streamToDiscord: async (text: string, audioData?: string): Promise<boolean> => {
    try {
      // If we don't have audioData, log a warning but don't throw an error
      if (!audioData) {
        console.log('No audioData provided for Discord TTS, this is expected as the direct API is handling audio streaming');
        // Return true since the audio is being handled by the direct API
        return true;
      }
      
      const payload = {
        text,
        audioData
      };
      
      try {
        const response = await apiService.post<ApiResponse>('/api/discord/tts', payload);
        return response.data?.success || false;
      } catch (error) {
        // Log but swallow this error since the direct API handles streaming
        console.log('Discord TTS API error (expected, not critical):', error);
        // Return true anyway since the direct API is handling the audio
        return true;
      }
    } catch (error) {
      console.error('Error streaming to Discord:', error);
      // Don't rethrow the error to avoid breaking the speech flow
      return false;
    }
  },
}; 