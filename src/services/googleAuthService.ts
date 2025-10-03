import { API_CONFIG } from '../config/api';
import { AuthToken } from './authService';
import * as WebBrowser from 'expo-web-browser';

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

/**
 * Service for handling Google authentication for mobile
 */
class GoogleAuthService {
  private static instance: GoogleAuthService;
  private authCheckInterval: NodeJS.Timeout | null = null;
  private pollingActive: boolean = false;
  
  private constructor() {}
  
  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }
  
  /**
   * Start the Google OAuth flow
   * @param accessToken Current user's access token (can be empty for initial login)
   * @returns Promise resolving to auth result
   */
  public async startGoogleAuth(accessToken: string): Promise<GoogleAuthResponse> {
    try {
      // Get the auth URL from our backend
      console.log('====== DEBUG: STARTING GOOGLE AUTH ======');
      console.log(`API base URL: ${API_CONFIG.BASE_URL}`);
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
        body: JSON.stringify({ operation: 'get-auth-url' })
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
      
      console.log('Opening browser with Google auth URL');
      
      // Open browser with the auth URL
      const result = await WebBrowser.openBrowserAsync(data.authUrl);
      console.log('====== DEBUG: BROWSER RESULT ======');
      console.log('Browser closed with result:', JSON.stringify(result));
      console.log('===================================');
      
      // Start polling for completion
      return await this.startPollingForAuthCompletion(accessToken);
    } catch (error) {
      console.error('Error starting Google auth:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start Google authentication'
      };
    }
  }
  
  /**
   * Start polling the backend to check if auth has completed
   * @param accessToken Current user's access token (can be empty for initial login)
   * @returns Promise resolving to auth result
   */
  private async startPollingForAuthCompletion(accessToken: string): Promise<GoogleAuthResponse> {
    return new Promise((resolve, reject) => {
      // Clear any existing interval
      if (this.authCheckInterval) {
        clearInterval(this.authCheckInterval);
        this.authCheckInterval = null;
      }
      
      console.log('====== DEBUG: STARTING POLLING ======');
      console.log(`API base URL: ${API_CONFIG.BASE_URL}`);
      console.log('====================================');
      
      console.log('Starting to poll for Google auth completion...');
      this.pollingActive = true;
      let attempts = 0;
      const maxAttempts = 30; // Try for about 30 seconds
      
      this.authCheckInterval = setInterval(async () => {
        if (!this.pollingActive || attempts >= maxAttempts) {
          if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
          }
          
          if (attempts >= maxAttempts) {
            console.log('Max polling attempts reached, auth likely failed');
            this.pollingActive = false;
            resolve({
              success: false,
              message: 'Authentication timed out. Please try again.'
            });
          }
          return;
        }
        
        attempts++;
        console.log(`Polling attempt ${attempts}/${maxAttempts}`);
        
        try {
          // Check for unclaimed auth keys
          // Prepare headers - only include Authorization if we have a token
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }
          
          console.log(`DEBUG: Checking for unclaimed keys at ${API_CONFIG.BASE_URL}/api/auth/mobile/google`);
          const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/mobile/google`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ operation: 'check-temp-keys' })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error checking for auth keys:', errorData);
            return; // Return from this iteration instead of using continue
          }
          
          const data = await response.json();
          
          // If no keys found, return from this iteration
          if (!data.success || !data.tempKey) {
            console.log('DEBUG: No unclaimed keys found in this attempt');
            return;
          }
          
          console.log(`====== DEBUG: FOUND AUTH KEY ======`);
          console.log(`Found unclaimed auth key: ${data.tempKey}`);
          console.log(`===================================`);
          
          const tempKey = data.tempKey;
          
          // Verify and claim the key
          // Prepare headers - only include Authorization if we have a token
          const verifyHeaders: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          
          if (accessToken) {
            verifyHeaders['Authorization'] = `Bearer ${accessToken}`;
          }
          
          console.log(`DEBUG: Verifying key ${tempKey}`);
          const verifyResponse = await fetch(`${API_CONFIG.BASE_URL}/api/auth/mobile/google`, {
            method: 'POST',
            headers: verifyHeaders,
            body: JSON.stringify({
              operation: 'verify-temp-key',
              tempKey
            })
          });
          
          const statusText = verifyResponse.statusText;
          const status = verifyResponse.status;
          console.log(`DEBUG: Verify response status: ${status} ${statusText}`);
          
          const verifyData = await verifyResponse.json();
          
          if (!verifyResponse.ok) {
            console.error(`====== DEBUG: VERIFY FAILED ======`);
            console.error(`Status: ${status} ${statusText}`);
            console.error(`Response data:`, JSON.stringify(verifyData));
            console.error(`=================================`);
            return; // Return from this iteration instead of using continue
          }
          
          if (verifyData.success) {
            console.log('====== DEBUG: AUTH SUCCESS ======');
            console.log('Google authentication successful!');
            console.log(`User ID: ${verifyData.user?.id}`);
            console.log(`User email: ${verifyData.user?.email}`);
            console.log(`Token length: ${verifyData.access_token?.length || 0} chars`);
            console.log('=================================');
            
            this.pollingActive = false;
            if (this.authCheckInterval) {
              clearInterval(this.authCheckInterval);
              this.authCheckInterval = null;
            }
            
            resolve({
              success: true,
              message: 'Successfully authenticated with Google',
              access_token: verifyData.access_token,
              user: verifyData.user
            });
          } else {
            console.log('====== DEBUG: VERIFY RESPONSE NOT SUCCESS ======');
            console.log(`Response: ${JSON.stringify(verifyData)}`);
            console.log('==============================================');
          }
        } catch (error) {
          console.error('====== DEBUG: POLLING ERROR ======');
          console.error('Error during auth polling:', error);
          console.error('==================================');
          // Just return from this iteration, the next one will happen automatically
        }
      }, 1000); // Check every second
    });
  }
  
  /**
   * Stop any active polling
   */
  public stopPolling(): void {
    this.pollingActive = false;
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
      this.authCheckInterval = null;
    }
  }
}

export default GoogleAuthService.getInstance(); 