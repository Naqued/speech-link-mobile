import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const TOKEN_STORAGE_KEY = '@speechlink_auth_token';

export interface AuthToken {
  access_token: string;
  expires_in?: number;
  token_type?: string;
  accessToken?: string;  // Alternative NextAuth format
  userId?: string;       // User ID extracted from token
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

// Define callbacks to be used for auth events
type AuthEventCallback = () => void;

class AuthService {
  private static instance: AuthService;
  private token: AuthToken | null = null;
  private tokenRefreshInProgress: boolean = false;
  private authFailedCallbacks: AuthEventCallback[] = [];

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Register a callback for when authentication fails
  public onAuthenticationFailed(callback: AuthEventCallback): void {
    this.authFailedCallbacks.push(callback);
  }

  // Trigger auth failed callbacks
  private triggerAuthFailedCallbacks(): void {
    this.authFailedCallbacks.forEach(callback => callback());
  }

  public async getDevelopmentToken(): Promise<AuthToken> {
    try {
      // Prevent multiple concurrent token refresh attempts
      if (this.tokenRefreshInProgress) {
        // Wait for existing refresh to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (this.token) {
          console.log('Using cached dev token (token refresh in progress)');
          return this.token;
        }
      }

      this.tokenRefreshInProgress = true;
      console.log('Fetching development token...');
      
      try {
        console.log(`Making request to: ${API_CONFIG.BASE_URL}/api/dev-auth`);
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/dev-auth`);
        
        console.log('Dev auth response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch development token: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dev token response structure:', Object.keys(data));
        
        // Only update if we actually got a token
        if (data && data.access_token) {
          // Add additional fields required by NextAuth format
          const enhancedToken = {
            ...data,
            // Add token_type if missing
            token_type: data.token_type || 'bearer',
            // Format field that NextAuth might expect
            accessToken: data.access_token,
            userId: data.user?.id
          };
          
          this.token = enhancedToken;
          await this.saveToken(enhancedToken);
          console.log('Successfully saved development token with enhanced fields');
          return enhancedToken;
        } else {
          console.error('Invalid token response - missing access_token:', data);
          throw new Error('Invalid token response');
        }
      } catch (error) {
        console.error('Error fetching development token:', error);
        // Trigger auth failed callbacks on serious errors
        this.triggerAuthFailedCallbacks();
        throw error;
      } finally {
        this.tokenRefreshInProgress = false;
      }
    } catch (error) {
      console.error('Error in getDevelopmentToken:', error);
      throw error;
    }
  }

  public async getToken(): Promise<AuthToken | null> {
    if (this.token) {
      return this.token;
    }

    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        this.token = JSON.parse(storedToken);
        return this.token;
      }
    } catch (error) {
      console.error('Error retrieving stored token:', error);
    }

    return null;
  }

  public async saveToken(token: AuthToken): Promise<void> {
    try {
      this.token = token;
      // Check and warn if we're missing expected fields
      if (!token.access_token) {
        console.warn('Warning: Token is missing access_token field');
      }
      console.log('Saving token with structure:', {
        hasAccessToken: !!token.access_token,
        accessTokenLength: token.access_token ? token.access_token.length : 0,
        hasTokenType: !!token.token_type,
        hasExpiresIn: !!token.expires_in,
      });
      
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  public async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      this.token = null;
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  public async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // Handle an auth error by clearing token and redirecting
  public async handleAuthError(): Promise<void> {
    // Clear the token since it's invalid
    await this.clearToken();
    // Notify listeners that auth has failed
    this.triggerAuthFailedCallbacks();
  }
}

export const authService = AuthService.getInstance(); 