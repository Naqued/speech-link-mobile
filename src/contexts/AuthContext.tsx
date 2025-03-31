import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';

interface AuthContextType {
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
  isLoading: boolean;
  authError: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  token: null,
  isLoading: true,
  authError: null
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Set up auth failure listener
  useEffect(() => {
    // Register callback for auth failures
    authService.onAuthenticationFailed(() => {
      console.log('Authentication failed, redirecting to login');
      setAuthError('Your session has expired. Please sign in again.');
      signOut();
    });
  }, []);

  useEffect(() => {
    // Check for existing auth token
    const bootstrapAsync = async () => {
      try {
        const authToken = await authService.getToken();
        setUserToken(authToken?.access_token || null);
      } catch (e) {
        console.error('Failed to load auth token', e);
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const signIn = async (token: string) => {
    try {
      // Instead of just saving the token string, create a proper token object
      const tokenObj = {
        access_token: token,
        token_type: 'bearer'
      };
      
      await authService.saveToken(tokenObj);
      setUserToken(token);
      setAuthError(null);
      // Reset auth failure flag when user logs in
      apiService.resetAuthFailureHandled();
    } catch (e) {
      console.error('Failed to save auth token', e);
    }
  };

  const signOut = async () => {
    try {
      await authService.clearToken();
      setUserToken(null);
    } catch (e) {
      console.error('Failed to remove auth token', e);
    }
  };

  const authContext = {
    signIn,
    signOut,
    token: userToken,
    isLoading,
    authError
  };

  if (isLoading) {
    // We could show a loading indicator here
    return null;
  }

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
}; 