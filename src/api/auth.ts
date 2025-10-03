import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = async (email: string, password: string, name: string) => {
  try {
    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Use first name as last name if only one name provided
    
    console.log('Registering user:', { email, firstName, lastName });
    
    const response = await apiClient.post('/api/auth/mobile-register', {
      email,
      password,
      firstName,
      lastName
    });
    
    console.log('Registration response:', response.data);
    
    // The API returns { access_token, user }
    return {
      token: response.data.access_token,
      user: response.data.user
    };
  } catch (error: any) {
    console.error('User registration failed:', error);
    
    // Extract error message from response
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    throw error;
  }
};

export const loginWithGoogle = async (accessToken: string) => {
  try {
    const response = await apiClient.post('/api/auth/mobile/google', { accessToken });
    await AsyncStorage.setItem('auth_token', response.data.token);
    return response.data;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('auth_token');
    return apiClient.post('/api/auth/mobile/logout');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}; 