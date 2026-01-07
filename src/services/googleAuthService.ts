import { API_CONFIG } from '../config/api';
import { AuthToken } from './authService';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Define response types
export interface GoogleAuthResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  user?: {
    id: string;
    email?: string;
    name?: string;
    image?: string;
  };
}

// Custom scheme for redirects
const REDIRECT_URI = 'com.naqued.speechlinkmobile://auth/google/callback';

/**
 * Service for handling Google authentication for mobile
 */
class GoogleAuthService {
  private static instance: GoogleAuthService;
  
  private constructor() {}
  
  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }
  
  /**
   * Start the Google OAuth flow with deep linking (no polling needed)
   * @param accessToken Current user's access token (can be empty for initial login)
   * @returns Promise resolving to auth result
   */
  public async startGoogleAuth(accessToken: string): Promise<GoogleAuthResponse> {
    try {
      // Get the auth URL from our backend
      console.log('====== DEBUG: STARTING GOOGLE AUTH ======');
      console.log(`API base URL: ${API_CONFIG.BASE_URL}`);
      console.log(`Redirect URI: ${REDIRECT_URI}`);
      console.log(`Has access token: ${!!accessToken}`);
      console.log('========================================');
      
      // Prepare headers - only include Authorization if we have a token
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      console.log('Requesting Google auth URL from backend...');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/mobile/google`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          operation: 'get-auth-url',
          redirectUri: REDIRECT_URI // Send the redirect URI to backend
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to get Google auth URL:', errorData);
        throw new Error(errorData.error || 'Failed to start Google authentication');
      }
      
      const data = await response.json();
      
      if (!data.authUrl) {
        throw new Error('Invalid auth URL response from server');
      }
      
      console.log('====== DEBUG: RECEIVED AUTH URL ======');
      console.log(`Full auth URL: ${data.authUrl}`);
      console.log('======================================');
      
      console.log('Opening auth session with Google auth URL');
      
      // Use openAuthSessionAsync which automatically handles the redirect
      const result = await WebBrowser.openAuthSessionAsync(data.authUrl, REDIRECT_URI);
      
      console.log('====== DEBUG: AUTH SESSION RESULT ======');
      console.log('Result type:', result.type);
      console.log('Result:', JSON.stringify(result));
      console.log('========================================');
      
      if (result.type === 'success' && result.url) {
        // Parse the redirect URL to get the token or temp key
        return await this.handleAuthCallback(result.url, accessToken);
      } else if (result.type === 'cancel') {
        return {
          success: false,
          message: 'Authentication cancelled by user'
        };
      } else {
        return {
          success: false,
          message: 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('Error starting Google auth:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start Google authentication'
      };
    }
  }
  
  /**
   * Handle the auth callback URL
   * @param url The callback URL with parameters
   * @param accessToken Current user's access token
   * @returns Promise resolving to auth result
   */
  private async handleAuthCallback(url: string, accessToken: string): Promise<GoogleAuthResponse> {
    try {
      console.log('====== DEBUG: HANDLING CALLBACK ======');
      console.log('Callback URL:', url);
      
      // Parse URL parameters
      const params = Linking.parse(url).queryParams;
      console.log('Parsed params:', params);
      
      const tempKey = params?.tempKey as string;
      const error = params?.error as string;
      
      if (error) {
        console.error('Auth callback error:', error);
        return {
          success: false,
          message: error || 'Authentication failed'
        };
      }
      
      if (!tempKey) {
        console.error('No temp key in callback URL');
        return {
          success: false,
          message: 'Invalid authentication response'
        };
      }
      
      console.log('Temp key received:', tempKey);
      console.log('====================================');
      
      // Verify and claim the key
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      console.log('Verifying temp key...');
      const verifyResponse = await fetch(`${API_CONFIG.BASE_URL}/api/auth/mobile/google`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operation: 'verify-temp-key',
          tempKey
        })
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok || !verifyData.success) {
        console.error('Failed to verify temp key:', verifyData);
        return {
          success: false,
          message: verifyData.error || 'Failed to verify authentication'
        };
      }
      
      console.log('====== DEBUG: AUTH SUCCESS ======');
      console.log('Google authentication successful!');
      console.log(`User ID: ${verifyData.user?.id}`);
      console.log(`User email: ${verifyData.user?.email}`);
      console.log('=================================');
      
      return {
        success: true,
        message: 'Successfully authenticated with Google',
        access_token: verifyData.access_token,
        user: verifyData.user
      };
    } catch (error) {
      console.error('Error handling auth callback:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to complete authentication'
      };
    }
  }
}

export default GoogleAuthService.getInstance(); 