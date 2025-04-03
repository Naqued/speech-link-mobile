import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginWithGoogle } from '../api/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Initialize WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession();

// Google Client IDs for different platforms
const ANDROID_CLIENT_ID = "220772687588-kf2slt096r3gtcjmtkk1c7htou9fnnnr.apps.googleusercontent.com";
const IOS_CLIENT_ID = "220772687588-kf2slt096r3gtcjmtkk1c7htou9fnnnr.apps.googleusercontent.com";

export const LoginScreen = () => {
  const { login, isLoading, error } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Set up Google Auth Request - Note: No web clientId
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    redirectUri: 'com.naqued.speechlinkmobile://',
    responseType: "code",
    usePKCE: true,
    scopes: ['profile', 'email']
  });
  
  // Store code verifier on mount
  useEffect(() => {
    const setupCodeVerifier = async () => {
      if (request?.codeVerifier) {
        await AsyncStorage.setItem('code_verifier', request.codeVerifier);
        console.log('Stored code verifier from request', { 
          length: request.codeVerifier.length,
          first10Chars: request.codeVerifier.substring(0, 10),
          last10Chars: request.codeVerifier.substring(request.codeVerifier.length - 10)
        });
      }
    };
    
    setupCodeVerifier();
  }, [request]);
  
  // Handle auth response
  useEffect(() => {
    if (response?.type === 'success' && response.params?.code) {
      handleAuthCode(response.params.code);
    } else if (response) {
      console.log('Auth response unsuccessful:', response);
    }
  }, [response]);
  
  const handleAuthCode = async (code: string) => {
    try {
      console.log('Authorization code received:', code);
      
      // Retrieve stored code verifier
      const storedCodeVerifier = await AsyncStorage.getItem('code_verifier');
      console.log('Retrieved code verifier from storage:', {
        length: storedCodeVerifier?.length,
        first10Chars: storedCodeVerifier?.substring(0, 10),
        last10Chars: storedCodeVerifier?.substring((storedCodeVerifier?.length || 0) - 10)
      });

      if (!storedCodeVerifier) {
        throw new Error('Code verifier not found in storage');
      }

      console.log('Sending Google authorization code to backend');
      console.log('Authorization Code:', code);
      console.log('Redirect URI:', 'com.naqued.speechlinkmobile://');
      console.log('Code Verifier available:', {
        length: storedCodeVerifier.length,
        first10Chars: storedCodeVerifier.substring(0, 10),
        last10Chars: storedCodeVerifier.substring(storedCodeVerifier.length - 10)
      });

      // Send code and verifier to backend
      const response = await loginWithGoogle(code, storedCodeVerifier);
      console.log('Backend response:', response);
      
      // Clear stored code verifier after successful login
      await AsyncStorage.removeItem('code_verifier');
      console.log('Cleared code verifier from storage after successful login');
    } catch (error) {
      console.error('Google Sign-In error:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      console.log('Starting Google Sign-In process...');
      console.log('Request configuration:', {
        androidClientId: ANDROID_CLIENT_ID,
        iosClientId: IOS_CLIENT_ID,
        redirectUri: 'com.naqued.speechlinkmobile://',
        usePKCE: true,
        codeVerifierLength: request?.codeVerifier?.length
      });
      
      // Prompt for authentication
      await promptAsync();
    } catch (error) {
      console.error('Failed to start Google auth:', error);
      setIsAuthenticating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.devButton}
          onPress={login}
          disabled={isLoading || isAuthenticating}
        >
          <Text style={styles.devButtonText}>🔧 Dev Login</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Speech Link</Text>
          <Text style={styles.subtitle}>Voice Enhancement App</Text>
          
          {error && (
            <Text style={styles.error}>{error}</Text>
          )}
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading || isAuthenticating}
          >
            {isLoading || isAuthenticating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign in with Google</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.loginButton, { marginTop: 10 }]}
            onPress={login}
            disabled={isLoading || isAuthenticating}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login with Development Token</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  devButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  devButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4A6FEA',
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#4A6FEA',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
}); 