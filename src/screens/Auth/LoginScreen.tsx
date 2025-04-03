import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';

// API
import { loginWithGoogle } from '../../api/auth';
import { API_CONFIG } from '../../config/api';

// Types
import { AuthStackParamList } from '../../navigation/AuthNavigator';

// Services
import { authService } from '../../services/authService';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

WebBrowser.maybeCompleteAuthSession();

// Constants for PKCE
const CODE_VERIFIER_KEY = 'google_auth_code_verifier';

// Function to generate a random code verifier
const generateCodeVerifier = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < 128; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Function to generate a code challenge from the verifier
const generateCodeChallenge = async (verifier: string) => {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier
  );
  
  // Convert hash to base64-url format
  return Buffer.from(digest).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { theme } = useContext(ThemeContext);
  const { signIn, authError } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Effect to display auth errors from context
  useEffect(() => {
    if (authError) {
      setLoginError(authError);
    }
  }, [authError]);

  // Generate and store a code verifier on component mount
  useEffect(() => {
    const setupCodeVerifier = async () => {
      const codeVerifier = generateCodeVerifier();
      await AsyncStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
      console.log('Generated and stored code verifier', { length: codeVerifier.length });
    };
    
    setupCodeVerifier();
  }, []);

  // Get the stored code verifier for Google auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "220772687588-kf2slt096r3gtcjmtkk1c7htou9fnnnr.apps.googleusercontent.com",
    clientId: "220772687588-kf2slt096r3gtcjmtkk1c7htou9fnnnr.apps.googleusercontent.com",
    iosClientId: "220772687588-kf2slt096r3gtcjmtkk1c7htou9fnnnr.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({
      scheme: "com.naqued.speechlinkmobile"
    }),
    responseType: "code",
    usePKCE: true,
    scopes: ['openid', 'email', 'profile']
  });



  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError('Please enter email and password');
      return;
    }

    try {
      setIsLoading(true);
      setLoginError(null);
      
      // Use our authService to login with credentials
      const response = await authService.loginWithCredentials({
        email,
        password
      });
      
      console.log('Login response received:', {
        hasAccessToken: !!response.accessToken,
        hasToken: !!response.token,
        hasUser: !!response.user
      });
      
      // Check if we have a token in either location
      const token = response.accessToken || response.token;
      
      if (!token) {
        setLoginError('Login successful but no authentication token received');
        console.error('No token in login response:', response);
        return;
      }
      
      // Update auth context with the received token
      await signIn(token);
    } catch (error) {
      console.error('Login error:', error);
      
      // Extract the specific error message
      let errorMessage = 'Login failed';
      
      if (error instanceof Error) {
        // Try to extract the most useful part of the error message
        const message = error.message;
        
        if (message.includes('Password:')) {
          // Extract just the password requirements if available
          const passwordError = message.split('Password:')[1]?.trim();
          if (passwordError) {
            errorMessage = `Password error: ${passwordError}`;
          } else {
            errorMessage = 'Invalid password';
          }
        } else if (message.includes('Email:')) {
          // Extract just the email error if available
          const emailError = message.split('Email:')[1]?.split(';')[0]?.trim();
          if (emailError) {
            errorMessage = `Email error: ${emailError}`;
          } else {
            errorMessage = 'Invalid email address';
          }
        } else if (message.includes('INVALID_CREDENTIALS')) {
          errorMessage = 'Invalid email or password';
        } else if (message.includes('USER_NOT_FOUND')) {
          errorMessage = 'No account found with this email address';
        } else if (message.includes('USER_DISABLED')) {
          errorMessage = 'This account has been disabled';
        } else if (message.includes('TOO_MANY_REQUESTS') || message.includes('RATE_LIMITED')) {
          errorMessage = 'Too many attempts. Please try again later';
        } else {
          // Use the full error message if it's not too long
          errorMessage = message.length > 100 ? message.substring(0, 100) + '...' : message;
        }
      }
      
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoginError(null);
      
      // Prompt user for Google authentication
      const result = await promptAsync();
      
      // Log the entire result object
      console.log('Google Auth Result:', JSON.stringify(result, null, 2));
      
      // Check if authentication was successful
      if (result.type !== 'success') {
        console.log('Auth failed with type:', result.type);
        throw new Error('Google sign-in was cancelled or failed');
      }
      
      // Check if we have the authorization code
      if (!result.params?.code) {
        console.log('No authorization code received:', result);
        throw new Error('No authorization code received from Google');
      }
      
      console.log('Authorization code received:', result.params.code);
      
      // Get the stored code verifier
      const codeVerifier = await AsyncStorage.getItem(CODE_VERIFIER_KEY);
      
      if (!codeVerifier) {
        console.log('Code verifier not found in storage');
        throw new Error('Authentication failed: Code verifier is missing');
      }
      
      console.log('Retrieved code verifier from storage', { length: codeVerifier.length });
      
      // Send the authorization code and code verifier to our backend
      const response = await loginWithGoogle(result.params.code, codeVerifier);
      console.log('Backend response:', JSON.stringify(response, null, 2));
      
      // Clear the used code verifier
      await AsyncStorage.removeItem(CODE_VERIFIER_KEY);
      
      // Update the auth context with the received token
      await signIn(response.token);
      
    } catch (error) {
      console.error('Google Sign-In error:', error);
      setLoginError(`Google Sign-In failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Show alert with more details in development
      if (__DEV__) {
        Alert.alert(
          'Google Sign-In Error',
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async () => {
    try {
      setIsLoading(true);
      setLoginError(null);
      console.log('Attempting to fetch dev token');
      
      // Use the authService to fetch and save the dev token
      const authToken = await authService.getDevelopmentToken();
      console.log('Received dev token:', {
        hasAccessToken: !!authToken.access_token,
        tokenType: authToken.token_type || 'bearer',
        userId: authToken.user?.id
      });
      
      // Then use the signIn method to update the AuthContext
      // Use the formatted token with the token_type prefix
      const accessToken = authToken.access_token;
      
      // Make sure token is valid before proceeding
      if (!accessToken) {
        throw new Error('Invalid token received from server');
      }
      
      await signIn(accessToken);
    } catch (error) {
      console.error('Dev login error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setLoginError(`Development login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Dev login button removed for production */}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>{t('app.name')}</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.welcomeText}>{t('auth.signIn')}</Text>
              
              {loginError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color="#FF6B6B" />
                  <Text style={styles.errorText}>{loginError}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.text} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.email')}
                  placeholderTextColor={theme.text + '80'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.text} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor={theme.text + '80'}
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.visibilityIcon}>
                  <Ionicons 
                    name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color={theme.text}
                  />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>{t('auth.signIn')}</Text>
              </TouchableOpacity>
              
              {/* Divider and social login buttons removed for production */}
              
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>{t('auth.dontHaveAccount')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.signupLink}>{t('auth.signUp')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
  keyboardAvoidingView: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
    marginTop: 10,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 30,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 10,
    marginBottom: 15,
    height: 55,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.text,
    fontSize: 16,
  },
  visibilityIcon: {
    padding: 10,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: theme.primary,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    color: theme.text + '80',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    gap: 15,
  },
  socialButton: {
    flexDirection: 'row',
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  socialButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: theme.text,
    fontSize: 14,
  },
  signupLink: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen; 