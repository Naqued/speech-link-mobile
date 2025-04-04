import { authService, AuthToken } from './authService';
import { API_CONFIG } from '../config/api';
import Constants from 'expo-constants';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private static instance: ApiService;
  private tokenRefreshAttempts: Map<string, number> = new Map();
  private MAX_TOKEN_REFRESH_ATTEMPTS = 1;
  private authFailureHandled = false;
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private requestCache: Map<string, { data: any, timestamp: number }> = new Map();

  private constructor() {
    // Use the baseUrl from API_CONFIG
    this.baseUrl = API_CONFIG.BASE_URL;
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Clear the API request cache
   */
  public clearCache(): void {
    console.log('Clearing API request cache');
    this.requestCache.clear();
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Add debug logging to see what token is being sent
    console.log('Token being used for auth:', {
      tokenType: token.token_type || 'Bearer',
      accessTokenLength: token.access_token ? token.access_token.length : 0,
      // Don't log the full token for security reasons
      accessTokenPrefix: token.access_token ? token.access_token.substring(0, 10) + '...' : null
    });

    // Format the token according to what the server expects
    const tokenToUse = token.accessToken || token.access_token;
    const tokenType = (token.token_type || 'Bearer').toLowerCase();
    const authHeader = `${tokenType.charAt(0).toUpperCase() + tokenType.slice(1)} ${tokenToUse}`;
    
    console.log(`Using auth header format: ${authHeader.substring(0, 15)}...`);
    
    return {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'X-Client-Type': 'mobile-app',
      'User-Agent': 'SpeechLink-Mobile-App/1.0'
    };
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    try {
      // Try the request with the current token
      const headers = await this.getAuthHeaders();
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`[API Request] ${options.method || 'GET'} ${url}`);
      
      console.log('Request has authorization header:', headers.hasOwnProperty('Authorization'));
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {})
        }
      });
      
      console.log(`[API Response] ${url} - Status: ${response.status}`);
      
 
      
      // Reset auth failure flag for future requests
      this.authFailureHandled = false;
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error [${response.status}]:`, errorText);
        
        // Special case handling
        if (response.status === 404) {
          throw new Error(`Endpoint not found: ${endpoint}`);
        }
        
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      return response;
    } catch (error) {
      this.authFailureHandled = false; // Reset for future auth failures
      console.error('API fetch error:', error);
      throw error;
    }
  }

  public async get<T>(endpoint: string, useCache = false, cacheDuration = 5 * 60 * 1000): Promise<T> {
    // Check cache first if useCache is true
    if (useCache) {
      const cachedData = this.requestCache.get(endpoint);
      const now = Date.now();
      if (cachedData && (now - cachedData.timestamp) < cacheDuration) {
        console.log(`[Cached API Response] ${endpoint}`);
        return cachedData.data;
      }
    }
    
    try {
      const response = await this.fetchWithAuth(endpoint);
      const data = await response.json();
      
      // Store in cache if useCache is true
      if (useCache) {
        this.requestCache.set(endpoint, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  public async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as any;
      }
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  public async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.fetchWithAuth(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      return await response.json();
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  public async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.fetchWithAuth(endpoint, {
        method: 'DELETE'
      });
      
      // If it's a 204 No Content, return an empty success object
      if (response.status === 204) {
        return { success: true } as any;
      }
      
      return await response.json();
    } catch (error) {
      // Special handling for 404 on DELETE - consider it successful
      if (error instanceof Error && error.message.includes('404')) {
        console.log('Resource already deleted (404), returning success');
        return { success: true } as any;
      }
      
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Reset auth failure handling flag - call this when user logs in again
  public resetAuthFailureHandled(): void {
    this.authFailureHandled = false;
  }

  // Clear all token refresh attempts
  public resetTokenRefreshAttempts(): void {
    this.tokenRefreshAttempts.clear();
  }
}

export const apiService = ApiService.getInstance(); 